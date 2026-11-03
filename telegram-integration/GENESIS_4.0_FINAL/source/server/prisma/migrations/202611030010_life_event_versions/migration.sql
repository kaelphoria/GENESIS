CREATE TABLE "LifeEventVersion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LifeEventVersion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LifeEventVersion_eventId_version_key" ON "LifeEventVersion"("eventId", "version");
CREATE INDEX "LifeEventVersion_userId_createdAt_idx" ON "LifeEventVersion"("userId", "createdAt");
ALTER TABLE "LifeEventVersion" ADD CONSTRAINT "LifeEventVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LifeEventVersion" ADD CONSTRAINT "LifeEventVersion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LifeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "LifeEventVersion" ("id", "userId", "eventId", "version", "snapshot")
SELECT 'lev_' || md5("id" || ':v' || "version"), "userId", "id", "version", jsonb_build_object(
  'title', "title", 'description', "description", 'category', "category",
  'occurredAt', "occurredAt", 'significance', "significance",
  'projectId', "projectId", 'decisionId', "decisionId", 'sourceId', "sourceId", 'version', "version"
) FROM "LifeEvent";
