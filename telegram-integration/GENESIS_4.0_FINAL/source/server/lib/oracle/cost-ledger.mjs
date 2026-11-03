/**
 * Exact usage-based cost calculation requires a dated, explicit pricing record.
 * No fallback or assumed price is used when the catalog is absent or stale.
 */
export function parsePricingCatalog(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(item => item && typeof item.provider === 'string' && typeof item.model === 'string'
    && item.currency === 'USD' && typeof item.effectiveFrom === 'string'
    && Number.isFinite(Date.parse(item.effectiveFrom))
    && Number.isFinite(item.inputUsdPerMillion) && item.inputUsdPerMillion >= 0
    && Number.isFinite(item.outputUsdPerMillion) && item.outputUsdPerMillion >= 0
    && (item.cachedInputUsdPerMillion === undefined || (Number.isFinite(item.cachedInputUsdPerMillion) && item.cachedInputUsdPerMillion >= 0)))
    .map(item => ({ provider: item.provider, model: item.model, currency: 'USD', effectiveFrom: item.effectiveFrom, inputUsdPerMillion: item.inputUsdPerMillion, outputUsdPerMillion: item.outputUsdPerMillion, ...(item.cachedInputUsdPerMillion === undefined ? {} : { cachedInputUsdPerMillion: item.cachedInputUsdPerMillion }) }));
}

export function priceUsage({ provider, model, inputTokens = 0, outputTokens = 0, cachedInputTokens = 0, pricing = [], at = new Date().toISOString() }) {
  const timestamp = Date.parse(at);
  const matching = pricing.filter(rate => rate.provider === provider && rate.model === model && Date.parse(rate.effectiveFrom) <= timestamp)
    .sort((a, b) => Date.parse(b.effectiveFrom) - Date.parse(a.effectiveFrom))[0];
  if (!matching || (cachedInputTokens > 0 && matching.cachedInputUsdPerMillion === undefined)) return { costUsd: null, currency: 'USD', status: 'not_configured', rateEffectiveFrom: matching?.effectiveFrom || null };
  const cached = Math.min(Math.max(0, inputTokens), Math.max(0, cachedInputTokens));
  const uncached = Math.max(0, inputTokens) - cached;
  const cost = (uncached * matching.inputUsdPerMillion + cached * (matching.cachedInputUsdPerMillion ?? matching.inputUsdPerMillion) + Math.max(0, outputTokens) * matching.outputUsdPerMillion) / 1_000_000;
  return { costUsd: Number(cost.toFixed(9)), currency: 'USD', status: 'exact_rate_match', rateEffectiveFrom: matching.effectiveFrom };
}
