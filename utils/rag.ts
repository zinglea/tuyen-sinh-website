import fs from 'fs';
import path from 'path';
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

// Configuration - pre-processed data directory (bundled with build)
const DATA_RAG_DIR = path.join(process.cwd(), 'data', 'rag');
const PROCESSED_DIR = path.join(DATA_RAG_DIR, 'processed');

// Simple in-memory vector store using Gemini embeddings
class SimpleVectorStore {
  private chunks: DocumentChunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private apiKey: string;
  private loaded = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Load pre-processed documents from data/rag/processed/
   * These JSON files are generated locally and committed to the repo
   */
  loadPreProcessedData() {
    if (this.loaded) return;

    try {
      if (!fs.existsSync(PROCESSED_DIR)) {
        console.log('No processed RAG data found at', PROCESSED_DIR);
        this.loaded = true;
        return;
      }

      const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

      for (const file of files) {
        try {
          const filePath = path.join(PROCESSED_DIR, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

          // Each processed file contains: id, filename, content, type, metadata
          if (data.content) {
            // Split content into chunks for better search
            const contentChunks = splitIntoChunks(data.content, 1000, 200);

            contentChunks.forEach((chunkContent, index) => {
              this.chunks.push({
                id: `${data.id}-chunk-${index}`,
                content: chunkContent,
                source: data.metadata?.filePath || data.filename,
                type: data.type || 'text',
                metadata: {
                  filename: data.filename,
                  createdAt: new Date(data.metadata?.modified || Date.now()),
                },
              });
            });
          }
        } catch (error) {
          console.error(`Error loading processed file ${file}:`, error);
        }
      }

      console.log(`Loaded ${this.chunks.length} chunks from ${files.length} processed files`);
      this.loaded = true;
    } catch (error) {
      console.error('Error loading pre-processed data:', error);
      this.loaded = true;
    }
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    this.loadPreProcessedData();

    if (this.chunks.length === 0) return [];

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    try {
      // Generate query embedding
      const queryResult = await model.embedContent(query);
      const queryEmbedding = queryResult.embedding.values;

      // Generate embeddings for chunks that don't have them yet (lazy loading)
      const chunksToEmbed = this.chunks.filter(c => !this.embeddings.has(c.id));

      for (const chunk of chunksToEmbed) {
        try {
          const result = await model.embedContent(chunk.content);
          this.embeddings.set(chunk.id, result.embedding.values);
        } catch (error) {
          console.error(`Error embedding chunk ${chunk.id}:`, error);
        }
      }

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

  getStats() {
    this.loadPreProcessedData();
    return {
      totalChunks: this.chunks.length,
      totalDocuments: new Set(this.chunks.map(c => c.metadata.filename)).size,
    };
  }
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
  }
  return vectorStore;
}
