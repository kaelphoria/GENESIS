const test = require('node:test');
const assert = require('node:assert/strict');
const { createGenesisToolRegistry, GENESIS_MCP_TOOLS } = require('../mcp/tools.mjs');

function mockDb() {
  const calls = [];
  const query = (name, result = []) => ({
    findMany: async args => { calls.push({ name, method: 'findMany', args }); return result; },
    findFirst: async args => { calls.push({ name, method: 'findFirst', args }); return null; },
    findUnique: async args => { calls.push({ name, method: 'findUnique', args }); return null; },
    count: async args => { calls.push({ name, method: 'count', args }); return 3; }
  });
  return {
    calls,
    world: query('world'), goal: query('goal'), project: query('project'), action: query('action'), personalProfile: query('personalProfile'),
    memoryRecord: query('memoryRecord'), lifeEvent: query('lifeEvent'), conversation: query('conversation'),
    chatMessage: query('chatMessage'), memoryVersion: query('memoryVersion')
  };
}

test('MCP registry refuses to initialize without an explicit owner scope', () => {
  assert.throws(() => createGenesisToolRegistry({ db: mockDb(), userId: '' }), /MCP_OWNER_SCOPE_REQUIRED/);
});

test('MCP tools are read-only and expose bounded schemas', () => {
  assert.equal(GENESIS_MCP_TOOLS.length, 11);
  assert.ok(GENESIS_MCP_TOOLS.every(tool => tool.inputSchema.additionalProperties === false));
  assert.ok(GENESIS_MCP_TOOLS.every(tool => !/create|update|delete|write|execute/i.test(tool.name)));
});

test('every collection query is scoped to the configured owner', async () => {
  const db = mockDb();
  const registry = createGenesisToolRegistry({ db, userId: 'owner-1' });
  await registry.call('genesis.get_overview');
  await registry.call('genesis.get_personal_profile');
  await registry.call('genesis.list_worlds');
  await registry.call('genesis.list_goals');
  await registry.call('genesis.list_projects');
  await registry.call('genesis.list_actions');
  await registry.call('genesis.search_memories', { query: 'test' });
  await registry.call('genesis.get_life_timeline');
  await registry.call('genesis.list_conversations');
  await registry.call('genesis.get_conversation', { conversationId: 'c1' });
  await registry.call('genesis.get_memory_history', { memoryId: 'm1' });
  assert.ok(db.calls.length >= 11);
  assert.ok(db.calls.every(call => call.args.where.userId === 'owner-1'));
});

test('MCP memory search enforces explicit consent and active lifecycle status', async () => {
  const db = mockDb();
  const registry = createGenesisToolRegistry({ db, userId: 'owner-1' });
  await registry.call('genesis.search_memories', { query: 'project' });
  const call = db.calls.find(item => item.name === 'memoryRecord');
  assert.equal(call.args.where.contextPermission, 'granted');
  assert.equal(call.args.where.status, 'active');
});

test('MCP query limits are clamped and invalid date ranges fail closed', async () => {
  const db = mockDb();
  const registry = createGenesisToolRegistry({ db, userId: 'owner-1' });
  await registry.call('genesis.list_goals', { limit: 500 });
  assert.equal(db.calls.at(-1).args.take, 50);
  await assert.rejects(() => registry.call('genesis.get_life_timeline', { from: '2026-02-01T00:00:00Z', to: '2026-01-01T00:00:00Z' }), /INVALID_DATE_RANGE/);
});

test('MCP tool registry rejects unknown tools and empty memory queries', async () => {
  const registry = createGenesisToolRegistry({ db: mockDb(), userId: 'owner-1' });
  await assert.rejects(() => registry.call('genesis.delete_everything'), /UNKNOWN_TOOL/);
  await assert.rejects(() => registry.call('genesis.search_memories', { query: '   ' }), /QUERY_REQUIRED/);
});

test('MCP rejects unknown arguments and invalid filters rather than widening a query', async () => {
  const registry = createGenesisToolRegistry({ db: mockDb(), userId: 'owner-1' });
  await assert.rejects(() => registry.call('genesis.list_goals', { status: 'anything' }), /INVALID_STATUS/);
  await assert.rejects(() => registry.call('genesis.list_worlds', { includePrivate: true }), /UNKNOWN_ARGUMENT/);
  await assert.rejects(() => registry.call('genesis.get_life_timeline', { from: 'not-a-date' }), /INVALID_DATE_RANGE/);
  await assert.rejects(() => registry.call('genesis.list_actions', { limit: -1 }), /INVALID_LIMIT/);
});

test('MCP temporal history and conversation continuity remain owner-scoped and consent-gated', async () => {
  const db = mockDb();
  db.conversation.findFirst = async args => { db.calls.push({ name: 'conversation', method: 'findFirst', args }); return { id: 'c1', title: 'Prior' }; };
  db.memoryRecord.findFirst = async args => { db.calls.push({ name: 'memoryRecord', method: 'findFirst', args }); return { id: 'm1', title: 'Allowed', version: 3 }; };
  db.memoryVersion.findMany = async args => { db.calls.push({ name: 'memoryVersion', method: 'findMany', args }); return [{ version: 3, snapshot: { contextPermission: 'granted' } }, { version: 2, snapshot: { contextPermission: 'denied' } }, { version: 1, snapshot: { title: 'legacy no permission field' } }]; };
  const registry = createGenesisToolRegistry({ db, userId: 'owner-1' });
  await registry.call('genesis.get_conversation', { conversationId: 'c1' });
  await registry.call('genesis.get_memory_history', { memoryId: 'm1' });
  const conversationQueries = db.calls.filter(call => ['conversation', 'chatMessage'].includes(call.name));
  assert.ok(conversationQueries.every(call => call.args.where.userId === 'owner-1'));
  const historyQuery = db.calls.find(call => call.name === 'memoryRecord');
  assert.equal(historyQuery.args.where.contextPermission, 'granted');
  assert.equal(historyQuery.args.where.status, 'active');
  const history = db.calls.find(call => call.name === 'memoryVersion');
  assert.equal(history.args.where.userId, 'owner-1');
  const result = await registry.call('genesis.get_memory_history', { memoryId: 'm1' });
  assert.deepEqual(result.versions.map(item => item.version), [3]);
});
