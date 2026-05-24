export interface AIRequest {
  prompt: string;
  conversationId?: string;
}

export interface AIResponse {
  content: string;
  latency: number;
  model: string;
  tokens?: number;
}
