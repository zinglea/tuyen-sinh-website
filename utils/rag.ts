import fs from 'fs';
import path from 'path';

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

/**
 * Simple keyword-based vector store
 * Uses TF-IDF-like scoring instead of Gemini embeddings
 * This avoids API calls and works within Vercel's serverless timeout
 */
class SimpleVectorStore {
  private chunks: DocumentChunk[] = [];
  private loaded = false;

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

          if (data.content) {
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

  /**
   * Keyword-based search (no API calls needed)
   * Uses Vietnamese-aware word matching with TF-IDF-like scoring
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    this.loadPreProcessedData();

    if (this.chunks.length === 0) return [];

    // Normalize and tokenize query
    const queryTerms = tokenize(query);

    if (queryTerms.length === 0) return [];

    // Score each chunk by keyword relevance
    const scores = this.chunks.map(chunk => {
      const chunkText = chunk.content.toLowerCase();
      let score = 0;

      // Exact phrase match (highest weight)
      const queryLower = query.toLowerCase();
      if (chunkText.includes(queryLower)) {
        score += 10;
      }

      // Individual term matches
      for (const term of queryTerms) {
        if (chunkText.includes(term)) {
          // Count occurrences
          const regex = new RegExp(escapeRegex(term), 'gi');
          const matches = chunkText.match(regex);
          const count = matches ? matches.length : 0;

          // TF-like scoring: diminishing returns for repeated terms
          score += Math.log2(1 + count);
        }
      }

      // Bonus for matching multiple distinct terms
      const matchedTerms = queryTerms.filter(term => chunkText.includes(term));
      if (matchedTerms.length > 1) {
        score *= (1 + matchedTerms.length / queryTerms.length);
      }

      return { chunk, score };
    });

    // Sort by score and return top K with score > 0
    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  getStats() {
    this.loadPreProcessedData();
    return {
      totalChunks: this.chunks.length,
      totalDocuments: new Set(this.chunks.map(c => c.metadata.filename)).size,
    };
  }
}

// Tokenize Vietnamese text into search terms
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,.\-;:!?()[\]{}'"\/\\]+/)
    .filter(word => word.length >= 2)     // Skip single chars
    .filter((word, index, self) => self.indexOf(word) === index); // Deduplicate
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// Export singleton instance
let vectorStore: SimpleVectorStore | null = null;

export function getVectorStore(apiKey: string): SimpleVectorStore {
  if (!vectorStore) {
    vectorStore = new SimpleVectorStore();
  }
  return vectorStore;
}
