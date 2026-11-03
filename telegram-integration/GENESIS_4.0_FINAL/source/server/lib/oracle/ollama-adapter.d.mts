export type OllamaAdapterErrorCode = 'NOT_CONFIGURED' | 'TIMEOUT' | 'RATE_LIMITED' | 'UPSTREAM' | 'EMPTY_RESPONSE' | 'CANCELLED';
export class OllamaAdapterError extends Error { code: OllamaAdapterErrorCode; }
export function completeWithOllama(input: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model: string; baseUrl?: string; maxTokens?: number; signal?: AbortSignal;
}): Promise<{
  content: string; provider: 'ollama'; model: string;
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number };
}>;
export function embedWithOllama(input: {
  input: string; model: string; baseUrl?: string; dimensions?: number; signal?: AbortSignal;
}): Promise<number[]>;
