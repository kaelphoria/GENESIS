CREATE TABLE "Source" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "kind" TEXT NOT NULL, "title" TEXT NOT NULL,
  "uri" TEXT, "contentHash" TEXT, "trustStatus" TEXT NOT NULL DEFAULT 'unverified', "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MemoryVersion" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "memoryId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProvenanceEvent" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "sourceId" TEXT, "memoryId" TEXT, "artifactId" TEXT,
  "eventType" TEXT NOT NULL, "details" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProvenanceEvent_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MemoryRecord" ADD COLUMN "sourceRefId" TEXT;
ALTER TABLE "MemoryRecord" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX "Source_userId_kind_createdAt_idx" ON "Source"("userId", "kind", "createdAt");
CREATE INDEX "Source_userId_contentHash_idx" ON "Source"("userId", "contentHash");
CREATE UNIQUE INDEX "MemoryVersion_memoryId_version_key" ON "MemoryVersion"("memoryId", "version");
CREATE INDEX "MemoryVersion_userId_createdAt_idx" ON "MemoryVersion"("userId", "createdAt");
CREATE INDEX "ProvenanceEvent_userId_createdAt_idx" ON "ProvenanceEvent"("userId", "createdAt");
CREATE INDEX "ProvenanceEvent_sourceId_createdAt_idx" ON "ProvenanceEvent"("sourceId", "createdAt");
CREATE INDEX "ProvenanceEvent_memoryId_createdAt_idx" ON "ProvenanceEvent"("memoryId", "createdAt");
CREATE INDEX "MemoryRecord_userId_sourceRefId_idx" ON "MemoryRecord"("userId", "sourceRefId");
ALTER TABLE "Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryVersion" ADD CONSTRAINT "MemoryVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryVersion" ADD CONSTRAINT "MemoryVersion_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "MemoryRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "MemoryRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProvenanceEvent" ADD CONSTRAINT "ProvenanceEvent_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemoryRecord" ADD CONSTRAINT "MemoryRecord_sourceRefId_fkey" FOREIGN KEY ("sourceRefId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve a version-one snapshot for records that existed before provenance was introduced.
INSERT INTO "MemoryVersion" ("id", "userId", "memoryId", "version", "snapshot", "createdAt")
SELECT
  'mv_' || md5(m."id" || ':version:1'),
  m."userId",
  m."id",
  1,
  jsonb_build_object(
    'title', m."title",
    'content', m."content",
    'classification', m."classification",
    'source', m."source",
    'sourceRefId', NULL,
    'confidence', m."confidence",
    'status', m."status",
    'contextPermission', m."contextPermission",
    'version', 1
  ),
  m."updatedAt"
FROM "MemoryRecord" m;

INSERT INTO "ProvenanceEvent" ("id", "userId", "memoryId", "eventType", "details", "createdAt")
SELECT
  'pe_' || md5(m."id" || ':legacy-baseline'),
  m."userId",
  m."id",
  'LEGACY_MEMORY_BASELINE',
  jsonb_build_object('origin', 'record existed before provenance tracking', 'sourceStatus', 'unknown'),
  m."updatedAt"
FROM "MemoryRecord" m;
