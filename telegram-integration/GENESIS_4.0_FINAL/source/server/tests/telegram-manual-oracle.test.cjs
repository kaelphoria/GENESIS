const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const webhook = fs.readFileSync(path.join(root, 'app/api/telegram/webhook/route.ts'), 'utf8');
const miniApp = fs.readFileSync(path.join(root, 'app/telegram/telegram-mini-app.tsx'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'components/Dashboard.tsx'), 'utf8');
const oracle = fs.readFileSync(path.join(root, 'components/ManualOracle.tsx'), 'utf8');

test('Telegram text messages are saved to the owner conversation as a manual ORACLE prompt', () => {
  assert.match(webhook, /saveManualPrompt\(ownerId, text\)/);
  assert.match(webhook, /db\.\$transaction/);
  assert.match(webhook, /role: 'user', content: prompt/);
  assert.match(webhook, /TELEGRAM_MANUAL_PROMPT_SAVED/);
  assert.doesNotMatch(webhook, /askOracle\(/);
});

test('Telegram bot offers the Mini App handoff and does not require an AI provider', () => {
  assert.match(webhook, /Открыть ORACLE/);
  assert.match(webhook, /Платный API не используется/);
  assert.doesNotMatch(webhook, /OPENAI_API_KEY|GENESIS_AI_PROVIDER|\/api\/chat/);
});

test('Mini App validates Telegram initData before opening the private workspace', () => {
  assert.match(miniApp, /initData/);
  assert.match(miniApp, /\/api\/telegram\/auth/);
  assert.ok(miniApp.includes('window.location.replace'));
});

test('Dashboard uses Telegram native BackButton and haptic navigation when available', () => {
  assert.match(dashboard, /BackButton/);
  assert.match(dashboard, /HapticFeedback\?\.selectionChanged/);
});

test('Manual ORACLE supports copying prompts and saving ChatGPT replies', () => {
  assert.match(oracle, /Скопировать последний запрос/);
  assert.match(oracle, /ОТВЕТ CHATGPT/);
  assert.match(oracle, /save\("assistant",reply\)/);
});
