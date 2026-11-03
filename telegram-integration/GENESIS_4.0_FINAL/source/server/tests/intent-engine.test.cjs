const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyIntent } = require('../lib/oracle/intent-engine.mjs');

test('classifies common Russian and English intent categories', () => {
  assert.equal(classifyIntent('Помоги составить план на месяц').intent, 'planning');
  assert.equal(classifyIntent('Compare these two options').intent, 'decision');
  assert.equal(classifyIntent('Напиши короткое письмо').intent, 'creation');
  assert.equal(classifyIntent('Поищи последние исследования').intent, 'research');
  assert.equal(classifyIntent('Исправь эту ошибку').intent, 'execution');
  assert.equal(classifyIntent('Помоги понять, почему я так чувствую').intent, 'reflection');
});

test('does not overstate confidence and handles empty input', () => {
  assert.equal(classifyIntent('Привет').intent, 'conversation');
  assert.equal(classifyIntent('Привет').confidence, 0.35);
  assert.equal(classifyIntent('').requiresClarification, true);
});
