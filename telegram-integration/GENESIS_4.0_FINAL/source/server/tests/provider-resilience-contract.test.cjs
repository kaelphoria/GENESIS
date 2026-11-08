const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'lib/oracle/provider-router.ts'), 'utf8');
test('provider boundary has a finite timeout and no SDK-internal retries', () => {
  assert.match(source, /timeout: 45_000/);
  assert.match(source, /maxRetries: 0/);
});
test('provider retries are bounded to one additional transient attempt', () => {
  assert.match(source, /attempt < 2/);
  assert.match(source, /status !== 429 && status < 500 && !timeout/);
});
test('provider errors are typed and do not expose upstream response bodies', () => {
  assert.match(source, /class OracleProviderError/);
  assert.match(source, /'NOT_CONFIGURED' \| 'UNSUPPORTED_PROVIDER' \| 'TIMEOUT' \| 'RATE_LIMITED' \| 'UPSTREAM' \| 'EMPTY_RESPONSE' \| 'CANCELLED'/);
  assert.match(source, /AI provider request failed/);
});

test('embeddings use the provider boundary with a shorter timeout and bounded retries', () => {
  assert.match(source, /timeout: 20_000/);
  assert.match(source, /createOracleEmbedding/);
  assert.match(source, /OPENAI_EMBEDDING_MODEL/);
});

test('memory embedding service delegates all provider calls to the shared boundary', () => {
  const embeddings = fs.readFileSync(path.join(__dirname, '..', 'lib/memory-embeddings.ts'), 'utf8');
  assert.match(embeddings, /createOracleEmbedding/);
  assert.doesNotMatch(embeddings, /from ['"]openai['"]|new OpenAI/);
  assert.match(embeddings, /OPENAI_EMBEDDING_MODEL/);
});

test('chat completion propagates request cancellation to the provider and classifies aborts', () => {
  assert.match(source, /signal\?: AbortSignal/);
  assert.match(source, /\{ signal: input\.signal \}/);
  assert.match(source, /input\.signal\?\.aborted.*CANCELLED/);
});

test('provider usage captures cached input tokens separately for correct cost accounting', () => {
  assert.match(source, /cachedInputTokens: result\.usage\?\.prompt_tokens_details\?\.cached_tokens/);
});

test('provider router exposes an explicit local Ollama adapter without changing the default provider', () => {
  assert.match(source, /provider === 'ollama'/);
  assert.match(source, /OLLAMA_MODEL/);
  assert.match(source, /OLLAMA_EMBEDDING_MODEL/);
  assert.match(source, /completeWithOllama/);
  assert.match(source, /embedWithOllama/);
});


test('chat route supports explicitly selected Ollama without requiring an OpenAI key', () => {
  const chat = fs.readFileSync(path.join(__dirname, '..', 'app/api/chat/route.ts'), 'utf8');
  assert.match(chat.replace(/\s+/g, ' '), /configuredProvider === 'openai' && !process\.env\.OPENAI_API_KEY/);
  assert.match(chat.replace(/\s+/g, ' '), /configuredProvider === 'ollama' && !process\.env\.OLLAMA_MODEL/);
  assert.match(chat.replace(/\s+/g, ' '), /include: \{ sourceRef: \{ select: \{ id: true, title: true, trustStatus: true \} \} \}/);
});

test('chat route defaults personal context to off and requires an explicit true value', () => {
  const chat = fs.readFileSync(path.join(__dirname, '..', 'app/api/chat/route.ts'), 'utf8');
  assert.match(chat.replace(/\s+/g, ' '), /const includeContext = body\.includeContext === true/);
});
