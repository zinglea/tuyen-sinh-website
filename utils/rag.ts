import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  type: 'text' | 'docx' | 'pdf' | 'image';
  metadata: {
    filename: string;
    page?: number;
    createdAt: Date;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

// Configuration
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base');
const DOCUMENTS_DIR = path.join(KNOWLEDGE_BASE_DIR, 'documents');
const IMAGES_DIR = path.join(KNOWLEDGE_BASE_DIR, 'images');

// Ensure directories exist
export function ensureDirectories() {
  [DOCUMENTS_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Text file processing
export async function processTextFile(filePath: string): Promise<DocumentChunk[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  
  // Split into chunks of ~1000 characters with overlap
  const chunks = splitIntoChunks(content, 1000, 200);
  
  return chunks.map((chunk, index) => ({
    id: `text-${filename}-${index}`,
    content: chunk,
    source: filePath,
    type: 'text',
    metadata: {
      filename,
      createdAt: new Date(),
    },
  }));
}

// DOCX processing
export async function processDocxFile(filePath: string): Promise<DocumentChunk[]> {
  const result = await mammoth.extractRawText({ path: filePath });
  const content = result.value;
  const filename = path.basename(filePath);
  
  const chunks = splitIntoChunks(content, 1000, 200);
  
  return chunks.map((chunk, index) => ({
    id: `docx-${filename}-${index}`,
    content: chunk,
    source: filePath,
    type: 'docx',
    metadata: {
      filename,
      createdAt: new Date(),
    },
  }));
}

// PDF processing
export async function processPdfFile(filePath: string): Promise<DocumentChunk[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);
  const content = result.text;
  const filename = path.basename(filePath);
  
  const chunks = splitIntoChunks(content, 1000, 200);
  
  return chunks.map((chunk, index) => ({
    id: `pdf-${filename}-${index}`,
    content: chunk,
    source: filePath,
    type: 'pdf',
    metadata: {
      filename,
      page: Math.floor(index / 2) + 1, // Approximate page number
      createdAt: new Date(),
    },
  }));
}

// Image processing using Gemini Vision
export async function processImageFile(filePath: string, apiKey: string): Promise<DocumentChunk[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const imageData = fs.readFileSync(filePath);
  const base64Image = imageData.toString('base64');
  const mimeType = getMimeType(filePath);
  const filename = path.basename(filePath);
  
  const result = await model.generateContent([
    'Hãy mô tả chi tiết nội dung của hình ảnh này. Nếu là văn bản, hãy trích xuất toàn bộ nội dung văn bản.',
    {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    },
  ]);
  
  const content = result.response.text();
  
  return [{
    id: `image-${filename}`,
    content,
    source: filePath,
    type: 'image',
    metadata: {
      filename,
      createdAt: new Date(),
    },
  }];
}

// Helper: Split text into chunks
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
    if (start >= end) start = end;
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

// Helper: Get MIME type
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Simple in-memory vector store (for production, use FAISS or similar)
class SimpleVectorStore {
  private chunks: DocumentChunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async addDocuments(chunks: DocumentChunk[]) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    for (const chunk of chunks) {
      try {
        const result = await model.embedContent(chunk.content);
        const embedding = result.embedding.values;
        this.chunks.push(chunk);
        this.embeddings.set(chunk.id, embedding);
      } catch (error) {
        console.error(`Error embedding chunk ${chunk.id}:`, error);
      }
    }
    
    // Save to disk
    this.saveToDisk();
  }
  
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.chunks.length === 0) return [];
    
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    try {
      const result = await model.embedContent(query);
      const queryEmbedding = result.embedding.values;
      
      // Calculate cosine similarity
      const scores = this.chunks.map(chunk => {
        const embedding = this.embeddings.get(chunk.id);
        if (!embedding) return { chunk, score: 0 };
        
        const score = cosineSimilarity(queryEmbedding, embedding);
        return { chunk, score };
      });
      
      // Sort by score and return top K
      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }
  
  private saveToDisk() {
    const dataPath = path.join(KNOWLEDGE_BASE_DIR, 'vector-store', 'data.json');
    const data = {
      chunks: this.chunks,
      embeddings: Array.from(this.embeddings.entries()),
    };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
  
  loadFromDisk() {
    const dataPath = path.join(KNOWLEDGE_BASE_DIR, 'vector-store', 'data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      this.chunks = data.chunks || [];
      this.embeddings = new Map(data.embeddings || []);
    }
  }
  
  getStats() {
    return {
      totalChunks: this.chunks.length,
      totalDocuments: new Set(this.chunks.map(c => c.metadata.filename)).size,
    };
  }
}

// Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Export singleton instance
let vectorStore: SimpleVectorStore | null = null;

export function getVectorStore(apiKey: string): SimpleVectorStore {
  if (!vectorStore) {
    vectorStore = new SimpleVectorStore(apiKey);
    vectorStore.loadFromDisk();
  }
  return vectorStore;
}

// Process all files in knowledge base
export async function processAllFiles(apiKey: string): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  ensureDirectories();
  const errors: string[] = [];
  let processed = 0;
  
  const allChunks: DocumentChunk[] = [];
  
  // Process documents
  const docFiles = fs.readdirSync(DOCUMENTS_DIR);
  for (const file of docFiles) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    try {
      let chunks: DocumentChunk[] = [];
      
      if (file.endsWith('.txt')) {
        chunks = await processTextFile(filePath);
      } else if (file.endsWith('.docx')) {
        chunks = await processDocxFile(filePath);
      } else if (file.endsWith('.pdf')) {
        chunks = await processPdfFile(filePath);
      } else {
        continue;
      }
      
      allChunks.push(...chunks);
      processed++;
    } catch (error) {
      errors.push(`Lỗi xử lý ${file}: ${error}`);
    }
  }
  
  // Process images
  const imageFiles = fs.readdirSync(IMAGES_DIR);
  for (const file of imageFiles) {
    const filePath = path.join(IMAGES_DIR, file);
    try {
      const chunks = await processImageFile(filePath, apiKey);
      allChunks.push(...chunks);
      processed++;
    } catch (error) {
      errors.push(`Lỗi xử lý ${file}: ${error}`);
    }
  }
  
  // Add to vector store
  if (allChunks.length > 0) {
    const store = getVectorStore(apiKey);
    await store.addDocuments(allChunks);
  }
  
  return {
    success: errors.length === 0,
    processed,
    errors,
  };
}
