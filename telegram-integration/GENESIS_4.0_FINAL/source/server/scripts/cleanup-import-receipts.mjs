import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cutoff = new Date();
const apply = process.argv.includes('--apply');

try {
  const where = { expiresAt: { lt: cutoff } };
  const count = await prisma.importPreviewReceipt.count({ where });
  if (!apply) {
    process.stdout.write(JSON.stringify({ mode: 'dry-run', eligibleReceipts: count, cutoff: cutoff.toISOString() }) + '\n');
  } else if (process.env.GENESIS_MAINTENANCE_CONFIRM !== 'DELETE_EXPIRED_IMPORT_RECEIPTS') {
    process.stderr.write('Refusing cleanup: set GENESIS_MAINTENANCE_CONFIRM=DELETE_EXPIRED_IMPORT_RECEIPTS to confirm.\n');
    process.exitCode = 2;
  } else {
    const result = await prisma.importPreviewReceipt.deleteMany({ where });
    process.stdout.write(JSON.stringify({ mode: 'applied', deletedReceipts: result.count, cutoff: cutoff.toISOString() }) + '\n');
  }
} catch (error) {
  process.stderr.write(`Import receipt cleanup failed: ${error instanceof Error ? error.name : 'UNKNOWN_ERROR'}\n`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
