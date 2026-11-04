const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'telegram-integration/GENESIS_4.0_FINAL/site/index.html'), 'utf8');
test('GENESIS 4.0 exposes the Simulation workspace in navigation and content', () => {
  assert.match(html, /data-view="simulation"/);
  assert.match(html, /id="simulation"/);
  assert.match(html, /COGNITIVE ENGINE \/ DECISION LAB/);
});
test('Decision Lab requires a question, two criteria and two options', () => {
  assert.match(html, /criteria\.length<2\|\|options\.length<2/);
  assert.match(html, /if\(!q\|\|criteria\.length<2\|\|options\.length<2\)/);
});
test('Decision Lab applies bounded user-entered weights and scores', () => {
  assert.match(html, /Math\.max\(1,Math\.min\(5,Number\(document\.getElementById\(`\$\{id\}-w-/);
  assert.match(html, /total\+=v\*weights\[i\]/);
  assert.match(html, /NOT A PREDICTION/);
});
test('GENESIS 4.0 remains a private local-first build with no automatic sync claim', () => {
  assert.match(html, /4\.0\.0-private-preview/);
  assert.match(html, /Облачная синхронизация/);
  assert.match(html, /OFF/);
});
