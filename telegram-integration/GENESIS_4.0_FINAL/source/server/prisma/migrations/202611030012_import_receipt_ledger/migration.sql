CREATE TABLE "ImportPreviewReceipt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportPreviewReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportPreviewReceipt_nonce_key" ON "ImportPreviewReceipt"("nonce");
CREATE INDEX "ImportPreviewReceipt_userId_expiresAt_idx" ON "ImportPreviewReceipt"("userId", "expiresAt");
CREATE INDEX "ImportPreviewReceipt_userId_consumedAt_expiresAt_idx" ON "ImportPreviewReceipt"("userId", "consumedAt", "expiresAt");
ALTER TABLE "ImportPreviewReceipt" ADD CONSTRAINT "ImportPreviewReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
