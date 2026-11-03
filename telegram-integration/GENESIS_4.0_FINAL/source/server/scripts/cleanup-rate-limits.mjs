import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const requestedRetentionDays = Number(process.env.GENESIS_RATE_LIMIT_RETENTION_DAYS || 7);
const retentionDays = Number.isFinite(requestedRetentionDays) ? Math.max(7, Math.floor(requestedRetentionDays)) : 7;
const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
const apply = process.argv.includes('--apply');

try {
  const count = await prisma.rateLimitBucket.count({ where: { updatedAt: { lt: cutoff } } });
  if (!apply) {
    process.stdout.write(JSON.stringify({ mode: 'dry-run', eligibleBuckets: count, cutoff: cutoff.toISOString(), retentionDays }) + '\n');
  } else if (process.env.GENESIS_MAINTENANCE_CONFIRM !== 'DELETE_EXPIRED_RATE_LIMIT_BUCKETS') {
    process.stderr.write('Refusing cleanup: set GENESIS_MAINTENANCE_CONFIRM=DELETE_EXPIRED_RATE_LIMIT_BUCKETS to confirm.\n');
    process.exitCode = 2;
  } else {
    const result = await prisma.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    process.stdout.write(JSON.stringify({ mode: 'applied', deletedBuckets: result.count, cutoff: cutoff.toISOString(), retentionDays }) + '\n');
  }
} catch (error) {
  process.stderr.write(`Rate-limit cleanup failed: ${error instanceof Error ? error.name : 'UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
