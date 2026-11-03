CREATE TABLE "ChatRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "userMessageId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "response" TEXT,
  "contextManifest" JSONB,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatRequest_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChatRequest_userId_idempotencyKey_key" ON "ChatRequest"("userId", "idempotencyKey");
CREATE INDEX "ChatRequest_userId_status_updatedAt_idx" ON "ChatRequest"("userId", "status", "updatedAt");
