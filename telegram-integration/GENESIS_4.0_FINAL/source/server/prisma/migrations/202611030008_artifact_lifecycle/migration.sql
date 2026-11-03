ALTER TABLE "Artifact" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "Artifact" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
CREATE INDEX "Artifact_userId_sourceId_status_idx" ON "Artifact"("userId", "sourceId", "status");
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
