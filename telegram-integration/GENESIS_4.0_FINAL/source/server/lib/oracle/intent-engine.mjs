/**
 * Deterministic first-pass intent classifier.
 * This is routing metadata, not a claim to understand the user's full intent.
 * The model remains responsible for asking clarifying questions when needed.
 */
const RULES = [
  { intent: 'decision', patterns: [/\b(choose|decide|decision|which one|compare|pros and cons)\b/i, /(выбрать|решить|решение|сравни|что лучше|за и против)/i] },
  { intent: 'planning', patterns: [/\b(plan|roadmap|schedule|milestone|steps)\b/i, /(план|дорожн\w+ карта|расписан\w+|этап\w+|шаги)/i] },
  { intent: 'creation', patterns: [/\b(write|draft|design|create|generate|compose)\b/i, /(напиши|составь|создай|разработай|придумай|оформи)/i] },
  { intent: 'research', patterns: [/\b(research|find out|look up|sources|latest|evidence)\b/i, /(исследуй|найди информацию|поищи|источники|последние данные|доказательств)/i] },
  { intent: 'execution', patterns: [/\b(do this|run|execute|implement|deploy|fix|build)\b/i, /(сделай|выполни|запусти|реализуй|внедри|исправь|собери)/i] },
  { intent: 'reflection', patterns: [/\b(why do i|help me understand|feel|relationship|identity|reflect)\b/i, /(почему я|помоги понять|чувствую|отношени|кто я|разобраться в себе)/i] }
];

export function classifyIntent(input) {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text) return { intent: 'conversation', confidence: 0, matchedRule: null, requiresClarification: true };
  for (const rule of RULES) {
    if (rule.patterns.some(pattern => pattern.test(text))) {
      return { intent: rule.intent, confidence: 0.62, matchedRule: rule.intent, requiresClarification: false };
    }
  }
  return { intent: 'conversation', confidence: 0.35, matchedRule: null, requiresClarification: false };
}
