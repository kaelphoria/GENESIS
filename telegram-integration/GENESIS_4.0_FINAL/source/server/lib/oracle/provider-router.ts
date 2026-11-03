import OpenAI from 'openai';
import { completeWithOllama, embedWithOllama, OllamaAdapterError } from './ollama-adapter.mjs';

export type OracleMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type OracleCompletionInput = { messages: OracleMessage[]; maxTokens?: number; signal?: AbortSignal };
export type OracleCompletionResult = { content: string; provider: 'openai' | 'ollama'; model: string; usage?: { inputTokens: number; outputTokens: number; cachedInputTokens?: number } };

export class OracleProviderError extends Error {
  constructor(public readonly code: 'NOT_CONFIGURED' | 'UNSUPPORTED_PROVIDER' | 'TIMEOUT' | 'RATE_LIMITED' | 'UPSTREAM' | 'EMPTY_RESPONSE' | 'CANCELLED', message: string) { super(message); this.name = 'OracleProviderError'; }
}

/** Server-only provider boundary. Retries are bounded and restricted to transient upstream failures. */
export async function completeOracle(input: OracleCompletionInput): Promise<OracleCompletionResult> {
  const provider = (process.env.GENESIS_AI_PROVIDER || 'openai').toLowerCase();
  if (provider === 'ollama') {
    try {
      return await completeWithOllama({ messages: input.messages, maxTokens: input.maxTokens ?? 1800, signal: input.signal, model: process.env.OLLAMA_MODEL || '', baseUrl: process.env.OLLAMA_BASE_URL });
    } catch (error) {
      if (error instanceof OllamaAdapterError) throw new OracleProviderError(error.code as ConstructorParameters<typeof OracleProviderError>[0], error.message);
      throw new OracleProviderError('UPSTREAM', 'AI provider request failed');
    }
  }
  if (provider !== 'openai') throw new OracleProviderError('UNSUPPORTED_PROVIDER', 'Unsupported AI provider');
  if (!process.env.OPENAI_API_KEY) throw new OracleProviderError('NOT_CONFIGURED', 'AI provider is not configured');

  const model = process.env.OPENAI_MODEL || 'gpt-5.6';
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0 });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await client.chat.completions.create({
        model, messages: input.messages, max_completion_tokens: input.maxTokens ?? 1800
      }, { signal: input.signal });
      const content = result.choices[0]?.message?.content?.trim() || '';
      if (!content) throw new OracleProviderError('EMPTY_RESPONSE', 'AI provider returned an empty response');
      return { content, provider: 'openai', model, usage: { inputTokens: result.usage?.prompt_tokens ?? 0, outputTokens: result.usage?.completion_tokens ?? 0, cachedInputTokens: result.usage?.prompt_tokens_details?.cached_tokens ?? 0 } };
    } catch (error: any) {
      if (error instanceof OracleProviderError) throw error;
      if (input.signal?.aborted || error?.name === 'AbortError') throw new OracleProviderError('CANCELLED', 'AI provider request was cancelled');
      lastError = error;
      const status = Number(error?.status || 0);
      const timeout = error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT' || error?.code === 'APIConnectionTimeoutError';
      const connection = error?.name === 'APIConnectionError' || error?.code === 'ECONNRESET' || error?.code === 'ECONNREFUSED';
      if (attempt > 0 || (status !== 429 && status < 500 && !timeout && !connection)) break;
    }
  }
  const status = Number((lastError as any)?.status || 0);
  const timeout = (lastError as any)?.name === 'TimeoutError' || (lastError as any)?.code === 'ETIMEDOUT' || (lastError as any)?.code === 'APIConnectionTimeoutError';
  if (timeout) throw new OracleProviderError('TIMEOUT', 'AI provider request timed out');
  if (status === 429) throw new OracleProviderError('RATE_LIMITED', 'AI provider rate limit reached');
  throw new OracleProviderError('UPSTREAM', 'AI provider request failed');
}


/** Embeddings use the same server-only provider boundary and bounded network policy. */
export async function createOracleEmbedding(input: string): Promise<number[]> {
  const provider = (process.env.GENESIS_AI_PROVIDER || 'openai').toLowerCase();
  if (provider === 'ollama') {
    try {
      return await embedWithOllama({ input, model: process.env.OLLAMA_EMBEDDING_MODEL || '', baseUrl: process.env.OLLAMA_BASE_URL, dimensions: 1536 });
    } catch (error) {
      if (error instanceof OllamaAdapterError) throw new OracleProviderError(error.code as ConstructorParameters<typeof OracleProviderError>[0], error.message);
      throw new OracleProviderError('UPSTREAM', 'AI embedding request failed');
    }
  }
  if (provider !== 'openai') throw new OracleProviderError('UNSUPPORTED_PROVIDER', 'Unsupported AI provider');
  if (!process.env.OPENAI_API_KEY) throw new OracleProviderError('NOT_CONFIGURED', 'AI provider is not configured');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 0 });
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await client.embeddings.create({ model, input });
      const vector = result.data[0]?.embedding;
      if (!vector?.length) throw new OracleProviderError('EMPTY_RESPONSE', 'AI provider returned an empty embedding');
      return vector;
    } catch (error: any) {
      if (error instanceof OracleProviderError) throw error;
      const status = Number(error?.status || 0);
      const timeout = error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT' || error?.code === 'APIConnectionTimeoutError';
      const connection = error?.name === 'APIConnectionError' || error?.code === 'ECONNRESET' || error?.code === 'ECONNREFUSED';
      if (attempt === 0 && (status === 429 || status >= 500 || timeout || connection)) continue;
      if (timeout) throw new OracleProviderError('TIMEOUT', 'AI embedding request timed out');
      if (status === 429) throw new OracleProviderError('RATE_LIMITED', 'AI provider rate limit reached');
      throw new OracleProviderError('UPSTREAM', 'AI embedding request failed');
    }
  }
  throw new OracleProviderError('UPSTREAM', 'AI embedding request failed');
}
