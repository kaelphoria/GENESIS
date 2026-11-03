const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(path.join(__dirname, '../prisma/migrations/202611030001_conversations_memory_lifecycle/migration.sql'), 'utf8');

test('conversation migration preserves legacy messages before enforcing ownership', () => {
  const createTable = migration.indexOf('CREATE TABLE "Conversation"');
  const backfill = migration.indexOf('INSERT INTO "Conversation"');
  const addColumn = migration.indexOf('ALTER TABLE "ChatMessage" ADD COLUMN "conversationId"');
  const updateMessages = migration.indexOf('UPDATE "ChatMessage"');
  const notNull = migration.indexOf('ALTER TABLE "ChatMessage" ALTER COLUMN "conversationId" SET NOT NULL');
  assert.ok(createTable >= 0 && backfill > createTable && addColumn > backfill && updateMessages > addColumn && notNull > updateMessages);
});

test('memory lifecycle migration is additive and retains canonical memory content', () => {
  assert.match(migration, /ADD COLUMN "embeddingStatus" TEXT NOT NULL DEFAULT 'pending'/);
  assert.match(migration, /ADD COLUMN "contentHash" TEXT/);
  assert.match(migration, /ADD COLUMN "lastEmbeddingErrorCode" TEXT/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM "MemoryRecord"|TRUNCATE/i);
});
