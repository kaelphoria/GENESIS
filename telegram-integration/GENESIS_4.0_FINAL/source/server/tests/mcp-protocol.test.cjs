const test = require('node:test');
const assert = require('node:assert/strict');
const { createMcpProtocolHandler } = require('../mcp/protocol.mjs');

function handler() {
  return createMcpProtocolHandler({
    list: [{ name: 'genesis.read' }],
    call: async (name, args) => {
      if (name !== 'genesis.read') throw new Error('UNKNOWN_TOOL');
      return { owner: 'only', query: args.query };
    }
  });
}

test('MCP initialize negotiates a supported protocol and advertises only tools', async () => {
  const run = handler();
  const result = await run({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  assert.equal(result.result.protocolVersion, '2025-11-25');
  assert.deepEqual(result.result.capabilities, { tools: { listChanged: false } });
});

test('MCP tools/list is blocked until initialized notification arrives', async () => {
  const run = handler();
  const blocked = await run({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.equal(blocked.error.code, -32002);
  await run({ jsonrpc: '2.0', id: 2.5, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  assert.equal(await run({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  const listed = await run({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
  assert.equal(listed.result.tools[0].name, 'genesis.read');
});

test('MCP tools/call returns structured data and safe tool errors', async () => {
  const run = handler();
  await run({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  await run({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const result = await run({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'genesis.read', arguments: { query: 'x' } } });
  assert.deepEqual(result.result.structuredContent, { owner: 'only', query: 'x' });
  const failed = await run({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'bad' } });
  assert.equal(failed.result.isError, true);
  assert.equal(failed.result.content[0].text, 'UNKNOWN_TOOL');
});

test('MCP notifications produce no response and unknown methods use JSON-RPC method errors', async () => {
  const run = handler();
  assert.equal(await run({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  const result = await run({ jsonrpc: '2.0', id: 'x', method: 'not/a/method' });
  assert.equal(result.error.code, -32601);
});

test('MCP selects the current supported protocol when a client requests an unknown revision', async () => {
  const run = handler();
  const result = await run({ jsonrpc: '2.0', id: 4, method: 'initialize', params: { protocolVersion: 'unknown' } });
  assert.equal(result.result.protocolVersion, '2026-07-28');
});

test('MCP cannot complete initialization before initialize and reinitialize resets session state', async () => {
  const run = handler();
  await run({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal((await run({ jsonrpc: '2.0', id: 1, method: 'tools/list' })).error.code, -32002);
  await run({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  await run({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.ok((await run({ jsonrpc: '2.0', id: 3, method: 'tools/list' })).result);
  await run({ jsonrpc: '2.0', id: 4, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  assert.equal((await run({ jsonrpc: '2.0', id: 5, method: 'tools/list' })).error.code, -32002);
});

test('MCP validates JSON-RPC IDs, params and bounded tool arguments', async () => {
  const run = handler();
  await run({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  await run({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal((await run({ jsonrpc: '2.0', id: {}, method: 'ping' })).error.code, -32600);
  assert.equal((await run({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: [] })).error.code, -32600);
  const tooLarge = await run({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'genesis.read', arguments: { data: 'x'.repeat(40_000) } } });
  assert.equal(tooLarge.error.code, -32602);
});

test('MCP initialization notification rejects request IDs', async () => {
  const run = handler();
  await run({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  const result = await run({ jsonrpc: '2.0', id: 2, method: 'notifications/initialized' });
  assert.equal(result.error.code, -32600);
  assert.equal((await run({ jsonrpc: '2.0', id: 3, method: 'tools/list' })).error.code, -32002);
});
