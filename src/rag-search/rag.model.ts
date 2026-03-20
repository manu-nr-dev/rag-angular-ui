export interface RagSource {
  id: number;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  source: string;
  similarityScore: number;
}
 
export interface RagResponse {
  query: string;
  answer: string;
  sources: RagSource[];
  latencyMs: number;
  grounded: boolean;
  groundingScore: number;
  groundingWarning: string | null;
}
 