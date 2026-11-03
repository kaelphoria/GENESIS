-- Additive migration: preserve existing chat history and memory records.
CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Новый диалог',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Every existing user's legacy messages are retained in one imported conversation.
INSERT INTO "Conversation" ("id", "userId", "title", "createdAt", "updatedAt")
SELECT 'conv_import_' || u."id", u."id", 'Импортированная история', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "ChatMessage" m WHERE m."userId" = u."id");

ALTER TABLE "ChatMessage" ADD COLUMN "conversationId" TEXT;
UPDATE "ChatMessage" m
SET "conversationId" = 'conv_import_' || m."userId"
WHERE EXISTS (SELECT 1 FROM "Conversation" c WHERE c."id" = 'conv_import_' || m."userId");

-- Users without messages have no rows to backfill; the NOT NULL constraint is safe.
ALTER TABLE "ChatMessage" ALTER COLUMN "conversationId" SET NOT NULL;

ALTER TABLE "MemoryRecord"
  ADD COLUMN "embeddingStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "embeddingModel" TEXT,
  ADD COLUMN "embeddedAt" TIMESTAMP(3),
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "lastEmbeddingErrorCode" TEXT;

CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX "MemoryRecord_userId_embeddingStatus_idx" ON "MemoryRecord"("userId", "embeddingStatus");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
