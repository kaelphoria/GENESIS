const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const route = fs.readFileSync(path.join(__dirname, '../app/api/manual-chat/route.ts'), 'utf8');
const ui = fs.readFileSync(path.join(__dirname, '../components/ManualOracle.tsx'), 'utf8');

test('manual ORACLE save route requires same-origin authenticated ownership', () => {
  assert.match(route, /requireSameOrigin\s*\(/);
  assert.match(route, /apiUser\s*\(/);
  assert.match(route, /conversationId,userId:user\.id/);
  assert.match(route, /db\.\$transaction/);
  assert.match(route, /auditEvent\.create/);
});

test('manual ORACLE keeps ChatGPT processing user-initiated and local API-only', () => {
  assert.match(ui, /\/api\/manual-chat/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.match(ui, /ChatGPT/);
  assert.doesNotMatch(route, /from ['"]openai['"]|new OpenAI/);
});
