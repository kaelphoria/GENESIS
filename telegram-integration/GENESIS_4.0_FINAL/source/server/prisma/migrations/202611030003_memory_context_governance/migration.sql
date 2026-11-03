-- Existing memories are private by default. Context sharing requires an explicit user grant.
ALTER TABLE "MemoryRecord"
  ADD COLUMN "contextPermission" TEXT NOT NULL DEFAULT 'denied';
CREATE INDEX "MemoryRecord_userId_contextPermission_status_idx"
  ON "MemoryRecord"("userId", "contextPermission", "status");
