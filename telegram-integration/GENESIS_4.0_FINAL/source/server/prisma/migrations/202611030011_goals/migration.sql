CREATE TABLE "Goal" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "worldId" TEXT,
  "title" TEXT NOT NULL, "description" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'active', "priority" TEXT NOT NULL DEFAULT 'normal',
  "targetAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Action" ADD COLUMN "goalId" TEXT;
ALTER TABLE "Project" ADD COLUMN "goalId" TEXT;
ALTER TABLE "Decision" ADD COLUMN "goalId" TEXT;
ALTER TABLE "LifeEvent" ADD COLUMN "goalId" TEXT;
CREATE INDEX "Goal_userId_status_updatedAt_idx" ON "Goal"("userId", "status", "updatedAt");
CREATE INDEX "Goal_userId_worldId_idx" ON "Goal"("userId", "worldId");
CREATE INDEX "Action_userId_goalId_idx" ON "Action"("userId", "goalId");
CREATE INDEX "Project_userId_goalId_idx" ON "Project"("userId", "goalId");
CREATE INDEX "Decision_userId_goalId_idx" ON "Decision"("userId", "goalId");
CREATE INDEX "LifeEvent_userId_goalId_idx" ON "LifeEvent"("userId", "goalId");
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Action" ADD CONSTRAINT "Action_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LifeEvent" ADD CONSTRAINT "LifeEvent_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
