CREATE TABLE "Project" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'active',
  "priority" TEXT NOT NULL DEFAULT 'normal', "startAt" TIMESTAMP(3), "targetAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Milestone" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'pending', "dueAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Decision" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "projectId" TEXT, "question" TEXT NOT NULL,
  "options" JSONB, "selectedOption" TEXT, "rationale" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'open',
  "assumptions" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Experiment" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "decisionId" TEXT, "title" TEXT NOT NULL,
  "hypothesis" TEXT NOT NULL DEFAULT '', "method" TEXT NOT NULL DEFAULT '', "result" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'planned', "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Artifact" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "projectId" TEXT, "title" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL, "storageUri" TEXT, "contentHash" TEXT, "version" INTEGER NOT NULL DEFAULT 1,
  "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Action" ADD COLUMN "projectId" TEXT;
CREATE INDEX "Action_userId_projectId_idx" ON "Action"("userId", "projectId");
CREATE INDEX "Project_userId_status_updatedAt_idx" ON "Project"("userId", "status", "updatedAt");
CREATE INDEX "Milestone_userId_projectId_sortOrder_idx" ON "Milestone"("userId", "projectId", "sortOrder");
CREATE INDEX "Decision_userId_status_updatedAt_idx" ON "Decision"("userId", "status", "updatedAt");
CREATE INDEX "Experiment_userId_status_updatedAt_idx" ON "Experiment"("userId", "status", "updatedAt");
CREATE INDEX "Artifact_userId_projectId_updatedAt_idx" ON "Artifact"("userId", "projectId", "updatedAt");
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Action" ADD CONSTRAINT "Action_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
