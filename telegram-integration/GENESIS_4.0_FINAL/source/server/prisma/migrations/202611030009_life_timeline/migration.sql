CREATE TABLE "LifeEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT,
  "decisionId" TEXT,
  "sourceId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT 'milestone',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "significance" INTEGER NOT NULL DEFAULT 3,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LifeEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LifeEvent_userId_occurredAt_idx" ON "LifeEvent"("userId", "occurredAt");
CREATE INDEX "LifeEvent_userId_category_occurredAt_idx" ON "LifeEvent"("userId", "category", "occurredAt");
CREATE INDEX "LifeEvent_userId_projectId_idx" ON "LifeEvent"("userId", "projectId");
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
