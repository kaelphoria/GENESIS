const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePricingCatalog, priceUsage } = require('../lib/oracle/cost-ledger.mjs');
const { createAgentPlan, summarizeAgentTrace } = require('../lib/oracle/agent-orchestrator.mjs');

test('pricing catalog accepts only dated, non-negative, model-specific USD rates', () => {
  const rates = parsePricingCatalog(JSON.stringify([
    { provider: 'openai', model: 'gpt-test', currency: 'USD', effectiveFrom: '2026-01-01T00:00:00Z', inputUsdPerMillion: 1, outputUsdPerMillion: 2 },
    { provider: 'openai', model: 'bad', currency: 'EUR', effectiveFrom: '2026-01-01', inputUsdPerMillion: 1, outputUsdPerMillion: 2 }
  ]));
  assert.equal(rates.length, 1);
  assert.equal(parsePricingCatalog('not json').length, 0);
});

test('cost remains unknown without an exact provider/model/date match', () => {
  const result = priceUsage({ provider: 'openai', model: 'gpt-test', inputTokens: 1000, outputTokens: 1000, pricing: [] });
  assert.equal(result.costUsd, null);
  assert.equal(result.status, 'not_configured');
});

test('cost uses the latest effective dated rate and actual token usage', () => {
  const pricing = parsePricingCatalog(JSON.stringify([
    { provider: 'openai', model: 'gpt-test', currency: 'USD', effectiveFrom: '2026-01-01T00:00:00Z', inputUsdPerMillion: 1, outputUsdPerMillion: 2 },
    { provider: 'openai', model: 'gpt-test', currency: 'USD', effectiveFrom: '2026-06-01T00:00:00Z', inputUsdPerMillion: 3, outputUsdPerMillion: 4 }
  ]));
  const result = priceUsage({ provider: 'openai', model: 'gpt-test', inputTokens: 100000, outputTokens: 50000, pricing, at: '2026-07-01T00:00:00Z' });
  assert.equal(result.costUsd, 0.5);
  assert.equal(result.rateEffectiveFrom, '2026-06-01T00:00:00Z');
});

test('agent trace exposes monetary cost only when every specialist stage has a matching rate', () => {
  const plan = createAgentPlan({ intent: 'decision' });
  const steps = [
    { id: plan.steps[0].id, content: 'a', usage: { provider: 'openai', model: 'gpt-test', inputTokens: 1000, outputTokens: 1000 } },
    { id: plan.steps[1].id, content: 'b', usage: { provider: 'openai', model: 'gpt-test', inputTokens: 1000, outputTokens: 1000 } }
  ];
  const pricing = parsePricingCatalog(JSON.stringify([{ provider: 'openai', model: 'gpt-test', currency: 'USD', effectiveFrom: '2026-01-01T00:00:00Z', inputUsdPerMillion: 1, outputUsdPerMillion: 2 }]));
  const trace = summarizeAgentTrace(plan, steps, pricing, '2026-07-01T00:00:00Z');
  assert.equal(trace.usage.costStatus, 'exact_rate_match');
  assert.equal(trace.usage.costUsd, 0.006);
  const partial = summarizeAgentTrace(plan, steps, pricing.filter(rate => rate.model !== 'gpt-test'), '2026-07-01T00:00:00Z');
  assert.equal(partial.usage.costUsd, null);
});

test('cached input tokens require a separately configured cached-input rate for exact cost', () => {
  const base = { provider: 'openai', model: 'gpt-cache', currency: 'USD', effectiveFrom: '2026-01-01T00:00:00Z', inputUsdPerMillion: 1, outputUsdPerMillion: 2 };
  const noCachedRate = priceUsage({ provider: 'openai', model: 'gpt-cache', inputTokens: 1000, cachedInputTokens: 500, outputTokens: 0, pricing: [base] });
  assert.equal(noCachedRate.costUsd, null);
  const withCachedRate = priceUsage({ provider: 'openai', model: 'gpt-cache', inputTokens: 1000, cachedInputTokens: 500, outputTokens: 0, pricing: [{ ...base, cachedInputUsdPerMillion: 0.25 }] });
  assert.equal(withCachedRate.costUsd, 0.000625);
});
