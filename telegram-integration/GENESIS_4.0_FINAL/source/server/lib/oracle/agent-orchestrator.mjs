import { priceUsage } from './cost-ledger.mjs';

/**
 * Deterministic, permission-aware specialist routing for ORACLE.
 * This module plans work only; it never performs external actions.
 */
const AGENTS = {
  'decision-analyst': {
    purpose: 'Разложить решение на критерии, варианты, компромиссы и неопределённости.',
    focus: 'Сначала отдели факты от предположений. Сравни варианты по явным критериям и не подменяй выбор пользователя.'
  },
  'critical-reviewer': {
    purpose: 'Проверить анализ на пропуски, ложные дихотомии и слабые предположения.',
    focus: 'Проверь предыдущий анализ. Сохрани сильные выводы, исправь ошибки, добавь недостающие риски и неопределённости.'
  },
  'planning-strategist': {
    purpose: 'Преобразовать намерение в реалистичную последовательность этапов.',
    focus: 'Сформируй этапы, зависимости, ближайший выполнимый шаг и признаки прогресса. Не обещай выполнить действия.'
  },
  'feasibility-reviewer': {
    purpose: 'Проверить план на реализуемость, перегрузку и скрытые зависимости.',
    focus: 'Проверь предыдущий план на чрезмерную сложность, риски и отсутствующие зависимости. Упрости его, если это повышает шанс выполнения.'
  },
  'creative-studio': {
    purpose: 'Создать содержательный и оригинальный результат по запросу.',
    focus: 'Сосредоточься на качестве, ясности и соответствии запросу. Не добавляй ненужную методологию.'
  },
  'research-synthesizer': {
    purpose: 'Структурировать имеющиеся сведения и обозначить пробелы.',
    focus: 'Разделяй известное, выводы и гипотезы. Внешний поиск недоступен, если соответствующая capability явно не включена; не выдумывай источники и свежие факты.'
  },
  'implementation-planner': {
    purpose: 'Подготовить безопасный план реализации без выполнения внешних действий.',
    focus: 'Опиши изменения, проверки, риски и откат. Ничего не запускай, не развёртывай и не изменяй во внешних системах.'
  },
  'safety-reviewer': {
    purpose: 'Проверить предлагаемые шаги на полномочия, безопасность и обратимость.',
    focus: 'Проверь предыдущий план на необратимые действия, утечку данных и действия без разрешения. Удали шаги, требующие невыданных полномочий.'
  },
  'reflective-guide': {
    purpose: 'Помочь исследовать переживания без навязывания интерпретаций.',
    focus: 'Будь внимательным и недирективным. Предлагай гипотезы как гипотезы, оставляй пространство для самостоятельного смысла пользователя.'
  },
  'generalist': {
    purpose: 'Дать прямой и полезный ответ на обычный разговорный запрос.',
    focus: 'Отвечай непосредственно, без лишней структуры, если она не нужна.'
  }
};

const ROUTES = {
  decision: ['decision-analyst', 'critical-reviewer'],
  planning: ['planning-strategist', 'feasibility-reviewer'],
  creation: ['creative-studio'],
  research: ['research-synthesizer'],
  execution: ['implementation-planner', 'safety-reviewer'],
  reflection: ['reflective-guide'],
  conversation: ['generalist']
};

export function createAgentPlan({ intent = 'conversation', capabilities = [], includeContext = false, traceId }) {
  const route = ROUTES[intent] || ROUTES.conversation;
  const enabled = new Set(capabilities.filter(item => item?.enabled === true).map(item => item.id));
  const allowedCapabilities = ['oracle.respond', ...(includeContext && enabled.has('memory.read') ? ['memory.read'] : [])];
  const maxAgents = 2;
  const steps = route.slice(0, maxAgents).map((id, index) => ({
    id,
    sequence: index + 1,
    purpose: AGENTS[id].purpose,
    requiredCapabilities: ['oracle.respond']
  }));
  return {
    traceId: typeof traceId === 'string' ? traceId : 'untracked',
    intent: ROUTES[intent] ? intent : 'conversation',
    allowedCapabilities,
    budget: { maxAgents, maxTokensPerAgent: 900, maxTotalOutputTokens: 1800 },
    steps
  };
}

export function buildAgentInstruction(step, plan) {
  const agent = AGENTS[step?.id];
  if (!agent || !plan?.steps?.some(item => item.id === step.id)) throw new Error('AGENT_NOT_IN_PLAN');
  return [
    `GENESIS SPECIALIST: ${step.id}`,
    `PURPOSE: ${agent.purpose}`,
    `METHOD: ${agent.focus}`,
    `ALLOWED CAPABILITIES: ${plan.allowedCapabilities.join(', ')}`,
    'BOUNDARIES: You are an internal reasoning stage. Do not claim to have used tools, searched the web, changed data, sent messages, executed code, or performed external actions unless the conversation explicitly contains verified results.',
    'EPISTEMIC RULE: Distinguish user-provided facts, sourced facts, inferences, and unknowns. Do not invent personal memories, citations, or tool results.',
    'HUMAN CONTROL: Offer analysis and drafts. The user remains the decision-maker and author.'
  ].join('\n');
}

export function buildReviewPrompt(previousAgentId, nextAgentId) {
  return `Передай результат следующему внутреннему этапу. Предыдущий этап: ${previousAgentId}. Текущий этап: ${nextAgentId}. Проведи свою проверку и выдай единый улучшенный ответ пользователю. Не упоминай внутреннюю оркестрацию, если это не помогает объяснению.`;
}

export function validateAgentOutput(content) {
  if (typeof content !== 'string') return { valid: false, reason: 'INVALID_CONTENT' };
  const normalized = content.trim();
  if (!normalized) return { valid: false, reason: 'EMPTY_CONTENT' };
  if (normalized.length > 24000) return { valid: false, reason: 'OUTPUT_TOO_LARGE' };
  return { valid: true, content: normalized };
}

export function restoreAgentProgress(plan, savedTrace) {
  if (!savedTrace || typeof savedTrace !== 'object' || !Array.isArray(savedTrace.completedSteps)) return [];
  const restored = [];
  for (const step of plan.steps) {
    const saved = savedTrace.completedSteps[restored.length];
    if (!saved || saved.id !== step.id) break;
    const output = validateAgentOutput(saved.content);
    if (!output.valid) break;
    const usage = saved.usage && typeof saved.usage === 'object' ? { provider: String(saved.usage.provider || 'unknown').slice(0, 40), model: String(saved.usage.model || 'unknown').slice(0, 100), inputTokens: Math.max(0, Number(saved.usage.inputTokens) || 0), outputTokens: Math.max(0, Number(saved.usage.outputTokens) || 0), cachedInputTokens: Math.max(0, Number(saved.usage.cachedInputTokens) || 0) } : null;
    restored.push({ id: step.id, content: output.content, ...(usage ? { usage } : {}) });
  }
  return restored;
}

export function summarizeAgentTrace(plan, completedSteps = [], pricingCatalog = [], pricedAt = new Date().toISOString()) {
  const safeSteps = completedSteps.slice(0, plan.budget.maxAgents).map(step => ({ id: step.id, content: step.content, ...(step.usage ? { usage: { provider: step.usage.provider, model: step.usage.model, inputTokens: Math.max(0, Number(step.usage.inputTokens) || 0), outputTokens: Math.max(0, Number(step.usage.outputTokens) || 0), cachedInputTokens: Math.max(0, Number(step.usage.cachedInputTokens) || 0) } } : {}) }));
  const usage = safeSteps.reduce((total, step) => ({ inputTokens: total.inputTokens + (step.usage?.inputTokens || 0), outputTokens: total.outputTokens + (step.usage?.outputTokens || 0) }), { inputTokens: 0, outputTokens: 0 });
  const stepCosts = safeSteps.filter(step => step.usage).map(step => ({ id: step.id, ...priceUsage({ ...step.usage, pricing: pricingCatalog, at: pricedAt }) }));
  const allPriced = stepCosts.length === safeSteps.length && safeSteps.length > 0 && stepCosts.every(item => item.status === 'exact_rate_match');
  const anyPriced = stepCosts.some(item => item.status === 'exact_rate_match');
  const costUsd = allPriced ? Number(stepCosts.reduce((sum, item) => sum + (item.costUsd || 0), 0).toFixed(9)) : null;
  return {
    traceId: plan.traceId,
    intent: plan.intent,
    agents: safeSteps.map(step => step.id),
    calls: safeSteps.length,
    completedSteps: safeSteps,
    usage: { ...usage, costUsd, currency: 'USD', costStatus: allPriced ? 'exact_rate_match' : anyPriced ? 'partially_configured' : 'not_configured', stepCosts },
    budget: plan.budget
  };
}


export function publicAgentTrace(trace) {
  if (!trace || typeof trace !== 'object') return null;
  return {
    traceId: typeof trace.traceId === 'string' ? trace.traceId : null,
    intent: typeof trace.intent === 'string' ? trace.intent : null,
    agents: Array.isArray(trace.agents) ? trace.agents.filter(id => typeof id === 'string') : [],
    calls: Number.isInteger(trace.calls) ? trace.calls : 0,
    budget: trace.budget && typeof trace.budget === 'object' ? trace.budget : null,
    usage: trace.usage && typeof trace.usage === 'object' ? { inputTokens: Math.max(0, Number(trace.usage.inputTokens) || 0), outputTokens: Math.max(0, Number(trace.usage.outputTokens) || 0), costUsd: typeof trace.usage.costUsd === 'number' && Number.isFinite(trace.usage.costUsd) ? trace.usage.costUsd : null, currency: 'USD', costStatus: typeof trace.usage.costStatus === 'string' ? trace.usage.costStatus : 'not_configured' } : null
  };
}
