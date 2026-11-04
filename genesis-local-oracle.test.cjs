const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'telegram-integration/GENESIS_4.0_FINAL/site/index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
test('ORACLE local workspace supports multiple durable sessions and assistant messages', () => {
  assert.match(script, /oracleSessions\.slice\(-20\)/);
  assert.match(script, /currentOracleSessionId/);
  assert.match(script, /\['user','system','assistant'\]/);
  assert.match(script, /function oracleSelectSession/);
});
test('ORACLE retrieval ranks personal memory locally and is not a network call', () => {
  assert.match(script, /function oracleRetrieve\(query\)/);
  assert.match(script, /Math\.log\(1\+\(docs\.length\+1\)/);
  assert.match(script, /function oracleLocalReflection/);
  assert.doesNotMatch(script, /fetch\s*\(/);
});
test('personal context remains explicitly selected for each prepared prompt', () => {
  for (const id of ['oracleUseProfile','oracleUseWorlds','oracleUseGoals','oracleUseMemory','oracleUseDecisions']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(script, /function oracleBuildContext/);
});
test('local ORACLE states its model boundary instead of pretending to be generative AI', () => {
  assert.match(html, /Генеративная модель не подключена/);
  assert.match(script, /НЕ ГЕНЕРАТИВНЫЙ AI/);
});
