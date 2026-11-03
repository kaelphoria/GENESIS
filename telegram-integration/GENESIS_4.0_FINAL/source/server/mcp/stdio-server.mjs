import { PrismaClient } from '@prisma/client';
import { createGenesisToolRegistry } from './tools.mjs';
import { createMcpProtocolHandler } from './protocol.mjs';

const MAX_LINE_BYTES = 1024 * 1024;
const userId = process.env.GENESIS_MCP_OWNER_USER_ID;
if (!userId) {
  process.stderr.write('GENESIS_MCP_OWNER_USER_ID is required; refusing to start without an explicit owner scope.\n');
  process.exit(1);
}

const db = new PrismaClient();
const registry = createGenesisToolRegistry({ db, userId });
const handle = createMcpProtocolHandler(registry);
let buffer = '';

function send(message) {
  if (message) process.stdout.write(`${JSON.stringify(message)}\n`);
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  if (Buffer.byteLength(buffer, 'utf8') > MAX_LINE_BYTES && !buffer.includes('\n')) {
    buffer = '';
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Message too large' } });
    return;
  }
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Message too large' } });
      continue;
    }
    let message;
    try { message = JSON.parse(line); }
    catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
    void handle(message).then(send).catch(() => {
      if (message && Object.prototype.hasOwnProperty.call(message, 'id')) send({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: 'Internal error' } });
    });
  }
  if (Buffer.byteLength(buffer, 'utf8') > MAX_LINE_BYTES) {
    buffer = '';
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Message too large' } });
  }
});

async function shutdown() {
  try { await db.$disconnect(); } finally { process.exit(0); }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
