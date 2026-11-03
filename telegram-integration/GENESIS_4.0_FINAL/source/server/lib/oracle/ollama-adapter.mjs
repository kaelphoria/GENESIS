/**
 * Optional local Ollama adapter. It uses the built-in fetch API and introduces
 * no SDK dependency. Plain HTTP is restricted to loopback; remote endpoints
 * must use HTTPS. Secrets are never sent to Ollama by this adapter.
 */
export class OllamaAdapterError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OllamaAdapterError';
    this.code = code;
  }
}

function endpoint(baseUrl, path) {
  let parsed;
  try { parsed = new URL(baseUrl || 'http://127.0.0.1:11434'); }
  catch { throw new OllamaAdapterError('NOT_CONFIGURED', 'Ollama endpoint is invalid'); }
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new OllamaAdapterError('NOT_CONFIGURED', 'Ollama must use HTTPS unless bound to loopback');
  }
  if (parsed.username || parsed.password) throw new OllamaAdapterError('NOT_CONFIGURED', 'Credentials must not be embedded in the Ollama URL');
  return `${parsed.origin}${path}`;
}

function requestSignal(signal, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function mapFailure(error, signal) {
  if (error instanceof OllamaAdapterError) return error;
  if (signal?.aborted || error?.name === 'AbortError') return new OllamaAdapterError('CANCELLED', 'Ollama request was cancelled');
  if (error?.name === 'TimeoutError') return new OllamaAdapterError('TIMEOUT', 'Ollama request timed out');
  return new OllamaAdapterError('UPSTREAM', 'Ollama request failed');
}

async function readJson(response) {
  try { return await response.json(); }
  catch { throw new OllamaAdapterError('UPSTREAM', 'Ollama returned an invalid response'); }
}

export async function completeWithOllama({
  messages, model, baseUrl, maxTokens = 1800, signal, fetchImpl = globalThis.fetch, timeoutMs = 45_000
}) {
  if (typeof model !== 'string' || !model.trim()) throw new OllamaAdapterError('NOT_CONFIGURED', 'OLLAMA_MODEL is not configured');
  if (typeof fetchImpl !== 'function') throw new OllamaAdapterError('NOT_CONFIGURED', 'Fetch is unavailable in this runtime');
  const url = endpoint(baseUrl, '/api/chat');
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false, options: { num_predict: maxTokens } }),
      signal: requestSignal(signal, timeoutMs)
    });
  } catch (error) { throw mapFailure(error, signal); }
  if (response.status === 429) throw new OllamaAdapterError('RATE_LIMITED', 'Ollama is busy or rate limited');
  if (!response.ok) throw new OllamaAdapterError('UPSTREAM', `Ollama returned HTTP ${response.status}`);
  const result = await readJson(response);
  const content = typeof result?.message?.content === 'string' ? result.message.content.trim() : '';
  if (!content) throw new OllamaAdapterError('EMPTY_RESPONSE', 'Ollama returned an empty response');
  return {
    content, provider: 'ollama', model,
    usage: {
      inputTokens: Number.isFinite(result.prompt_eval_count) ? result.prompt_eval_count : 0,
      outputTokens: Number.isFinite(result.eval_count) ? result.eval_count : 0,
      cachedInputTokens: 0
    }
  };
}

export async function embedWithOllama({
  input, model, baseUrl, dimensions = 1536, signal, fetchImpl = globalThis.fetch, timeoutMs = 20_000
}) {
  if (typeof model !== 'string' || !model.trim()) throw new OllamaAdapterError('NOT_CONFIGURED', 'OLLAMA_EMBEDDING_MODEL is not configured');
  if (typeof input !== 'string' || !input.trim()) throw new OllamaAdapterError('EMPTY_RESPONSE', 'Embedding input is empty');
  const url = endpoint(baseUrl, '/api/embed');
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input, dimensions }),
      signal: requestSignal(signal, timeoutMs)
    });
  } catch (error) { throw mapFailure(error, signal); }
  if (response.status === 429) throw new OllamaAdapterError('RATE_LIMITED', 'Ollama is busy or rate limited');
  if (!response.ok) throw new OllamaAdapterError('UPSTREAM', `Ollama returned HTTP ${response.status}`);
  const result = await readJson(response);
  const vector = Array.isArray(result?.embeddings?.[0]) ? result.embeddings[0] : null;
  if (!vector?.length) throw new OllamaAdapterError('EMPTY_RESPONSE', 'Ollama returned an empty embedding');
  if (vector.length !== dimensions || !vector.every(Number.isFinite)) {
    throw new OllamaAdapterError('UPSTREAM', `Embedding dimension mismatch; expected ${dimensions}`);
  }
  return vector;
}
