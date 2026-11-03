const test = require('node:test');
const assert = require('node:assert/strict');
const { createAgentPlan, buildAgentInstruction, buildReviewPrompt, validateAgentOutput, restoreAgentProgress, summarizeAgentTrace, publicAgentTrace } = require('../lib/oracle/agent-orchestrator.mjs');
const fs = require('node:fs');
const path = require('node:path');
const route = fs.readFileSync(path.join(__dirname, '..', 'app/api/chat/route.ts'), 'utf8');
const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma/schema.prisma'), 'utf8');
test('decision, planning and execution use bounded sequential specialist pairs', () => {
  for (const intent of ['decision', 'planning', 'execution']) {
    const plan = createAgentPlan({ intent, traceId: 'trace-12345678' });
    assert.equal(plan.steps.length, 2);
    assert.equal(plan.budget.maxAgents, 2);
    assert.equal(plan.budget.maxTokensPerAgent * plan.steps.length, plan.budget.maxTotalOutputTokens);
  }
});
test('other intents route to one specialist and unknown intents fail to generalist', () => {
  assert.equal(createAgentPlan({ intent: 'creation' }).steps.length, 1);
  assert.equal(createAgentPlan({ intent: 'reflection' }).steps[0].id, 'reflective-guide');
  assert.equal(createAgentPlan({ intent: 'unknown' }).steps[0].id, 'generalist');
});
test('personal context capability is included only when explicitly enabled', () => {
  const denied = createAgentPlan({ intent: 'conversation', includeContext: true, capabilities: [{ id: 'memory.read', enabled: false }] });
  const granted = createAgentPlan({ intent: 'conversation', includeContext: true, capabilities: [{ id: 'memory.read', enabled: true }] });
  assert.deepEqual(denied.allowedCapabilities, ['oracle.respond']);
  assert.deepEqual(granted.allowedCapabilities, ['oracle.respond', 'memory.read']);
});
test('agent instructions explicitly prohibit unverified external actions and tool claims', () => {
  const plan = createAgentPlan({ intent: 'execution' });
  const instruction = buildAgentInstruction(plan.steps[0], plan);
  assert.match(instruction, /Do not claim to have used tools/);
  assert.match(instruction, /user remains the decision-maker/i);
  assert.throws(() => buildAgentInstruction({ id: 'unknown' }, plan), /AGENT_NOT_IN_PLAN/);
});
test('review stages are sequenced and output contract rejects invalid or oversized content', () => {
  assert.match(buildReviewPrompt('planner', 'reviewer'), /planner/);
  assert.equal(validateAgentOutput('  finished  ').content, 'finished');
  assert.equal(validateAgentOutput(' ').valid, false);
  assert.equal(validateAgentOutput('x'.repeat(24001)).reason, 'OUTPUT_TOO_LARGE');
});
test('trace records agent ids, call count and bounded budget without prompts', () => {
  const plan = createAgentPlan({ intent: 'planning', traceId: 'trace-12345678' });
  const trace = summarizeAgentTrace(plan, [{ id: 'planning-strategist', content: 'draft' }, { id: 'feasibility-reviewer', content: 'final' }]);
  assert.deepEqual(trace.agents, ['planning-strategist', 'feasibility-reviewer']);
  assert.equal(trace.calls, 2);
  assert.equal('prompt' in trace, false);
});
test('ORACLE route executes planned stages sequentially and persists the trace', () => {
  assert.match(route, /for \(let index = completedSteps\.length; index < agentPlan\.steps\.length; index\+\+\)/);
  assert.match(route, /data: \{ agentTrace: progressTrace \}/);
  assert.match(route, /agentTrace, errorCode: null/);
  assert.match(schema, /agentTrace Json\?/);
});

test('failed multi-stage runs resume from the last durably completed specialist', () => {
  const plan = createAgentPlan({ intent: 'decision', traceId: 'trace-resume-01' });
  const restored = restoreAgentProgress(plan, { completedSteps: [{ id: 'decision-analyst', content: 'analysis saved' }] });
  assert.equal(restored.length, 1);
  assert.equal(restored[0].content, 'analysis saved');
  assert.equal(restoreAgentProgress(plan, { completedSteps: [{ id: 'wrong-agent', content: 'x' }] }).length, 0);
});

test('public trace excludes intermediate model output while retaining useful diagnostics', () => {
  const safe = publicAgentTrace({ traceId: 't-1', intent: 'decision', agents: ['decision-analyst'], calls: 1, budget: { maxTotalOutputTokens: 1800 }, completedSteps: [{ id: 'decision-analyst', content: 'private intermediate draft' }] });
  assert.deepEqual(safe.agents, ['decision-analyst']);
  assert.equal('completedSteps' in safe, false);
});

test('agent trace uses a new additive migration after the idempotency checkpoint', () => {
  const migrations = path.join(__dirname, '..', 'prisma', 'migrations');
  const base = fs.readFileSync(path.join(migrations, '202611030004_chat_request_idempotency/migration.sql'), 'utf8');
  const trace = fs.readFileSync(path.join(migrations, '202611030005_agent_trace/migration.sql'), 'utf8');
  assert.doesNotMatch(base, /agentTrace/);
  assert.match(trace, /ALTER TABLE \"ChatRequest\" ADD COLUMN \"agentTrace\" JSONB/);
});

test('portable export includes persisted request and specialist trace records', () => {
  const exportRoute = fs.readFileSync(path.join(__dirname, '..', 'app/api/export/route.ts'), 'utf8');
  assert.match(exportRoute, /db\.chatRequest\.findMany/);
  assert.match(exportRoute, /chatRequests/);
});

test('agent trace persists actual provider token usage without inventing monetary cost', () => {
  const plan = createAgentPlan({ intent: 'decision', traceId: 'trace-usage-01' });
  const trace = summarizeAgentTrace(plan, [
    { id: 'decision-analyst', content: 'analysis', usage: { provider: 'openai', model: 'gpt-test', inputTokens: 120, outputTokens: 80 } },
    { id: 'critical-reviewer', content: 'final', usage: { provider: 'openai', model: 'gpt-test', inputTokens: 140, outputTokens: 60 } }
  ]);
  assert.equal(trace.usage.inputTokens, 260);
  assert.equal(trace.usage.outputTokens, 140);
  assert.equal(trace.usage.costUsd, null);
  assert.equal(trace.usage.costStatus, 'not_configured');
  assert.equal(trace.usage.stepCosts.length, 2);
  const restored = restoreAgentProgress(plan, trace);
  assert.equal(restored[0].usage.inputTokens, 120);
  assert.equal(publicAgentTrace(trace).usage.outputTokens, 140);
  assert.equal(publicAgentTrace(trace).completedSteps, undefined);
});
