const test = require('node:test');
const assert = require('node:assert/strict');
const { completeWithOllama, embedWithOllama, OllamaAdapterError } = require('../lib/oracle/ollama-adapter.mjs');

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('Ollama chat adapter sends bounded non-streaming requests and normalizes usage', async () => {
  let captured;
  const result = await completeWithOllama({
    messages: [{ role: 'user', content: 'hello' }], model: 'local-chat', maxTokens: 123,
    fetchImpl: async (url, options) => { captured = { url, options, body: JSON.parse(options.body) }; return response(200, { message: { content: ' hi ' }, prompt_eval_count: 7, eval_count: 4 }); }
  });
  assert.equal(captured.url, 'http://127.0.0.1:11434/api/chat');
  assert.equal(captured.body.stream, false);
  assert.equal(captured.body.options.num_predict, 123);
  assert.deepEqual(result.usage, { inputTokens: 7, outputTokens: 4, cachedInputTokens: 0 });
  assert.equal(result.content, 'hi');
  assert.equal(result.provider, 'ollama');
});

test('Ollama adapter rejects non-loopback plaintext endpoints and embedded credentials', async () => {
  await assert.rejects(() => completeWithOllama({ messages: [], model: 'x', baseUrl: 'http://10.0.0.5:11434', fetchImpl: async () => response(200, {}) }), { code: 'NOT_CONFIGURED' });
  await assert.rejects(() => completeWithOllama({ messages: [], model: 'x', baseUrl: 'https://user:pass@example.com', fetchImpl: async () => response(200, {}) }), { code: 'NOT_CONFIGURED' });
});

test('Ollama adapter maps rate limits and empty responses without leaking response bodies', async () => {
  await assert.rejects(() => completeWithOllama({ messages: [], model: 'x', fetchImpl: async () => response(429, { secret: 'no' }) }), { code: 'RATE_LIMITED' });
  await assert.rejects(() => completeWithOllama({ messages: [], model: 'x', fetchImpl: async () => response(200, { message: { content: ' ' } }) }), { code: 'EMPTY_RESPONSE' });
});

test('Ollama embeddings enforce the existing pgvector dimension contract', async () => {
  const vector = Array(1536).fill(0.1);
  const result = await embedWithOllama({ input: 'memory', model: 'local-embed', fetchImpl: async () => response(200, { embeddings: [vector] }) });
  assert.equal(result.length, 1536);
  await assert.rejects(() => embedWithOllama({ input: 'memory', model: 'wrong-dim', fetchImpl: async () => response(200, { embeddings: [[0.1, 0.2]] }) }), { code: 'UPSTREAM' });
});

test('Ollama adapter requires explicit model configuration', async () => {
  await assert.rejects(() => completeWithOllama({ messages: [], model: '', fetchImpl: async () => response(200, {}) }), OllamaAdapterError);
  await assert.rejects(() => embedWithOllama({ input: 'x', model: '', fetchImpl: async () => response(200, {}) }), OllamaAdapterError);
});
