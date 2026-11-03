import { createHash } from 'node:crypto';
import { createOracleEmbedding, OracleProviderError } from '@/lib/oracle/provider-router';
import { db } from '@/lib/db';

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

type MemoryInput = { id: string; userId: string; title: string; content: string };

export function memoryContentHash(title: string, content: string) {
  return createHash('sha256').update(`${title.trim()}\n${content.trim()}`).digest('hex');
}

export async function refreshMemoryEmbedding(memory: MemoryInput) {
  const contentHash = memoryContentHash(memory.title, memory.content);
  const provider = (process.env.GENESIS_AI_PROVIDER || 'openai').toLowerCase();
  if (!process.env.OPENAI_API_KEY || provider !== 'openai') {
    await db.memoryEmbedding.deleteMany({ where: { memoryId: memory.id, userId: memory.userId } });
    await db.memoryRecord.update({
      where: { id: memory.id },
      data: { embeddingStatus: 'pending', embeddingModel: EMBEDDING_MODEL, contentHash, embeddedAt: null, lastEmbeddingErrorCode: !process.env.OPENAI_API_KEY ? 'AI_NOT_CONFIGURED' : 'AI_PROVIDER_UNSUPPORTED' }
    });
    return false;
  }

  await db.memoryRecord.update({
    where: { id: memory.id },
    data: { embeddingStatus: 'processing', embeddingModel: EMBEDDING_MODEL, contentHash, lastEmbeddingErrorCode: null }
  });

  try {
    const embedding = await createOracleEmbedding(`${memory.title}\n${memory.content}`);
    const vector = `[${embedding.join(',')}]`;

    return await db.$transaction(async tx => {
      const current = await tx.$queryRaw<Array<{ title: string; content: string }>>`
        SELECT "title", "content" FROM "MemoryRecord" WHERE "id" = ${memory.id} AND "userId" = ${memory.userId} FOR UPDATE
      `;
      if (!current.length || memoryContentHash(current[0].title, current[0].content) !== contentHash) return false;

      await tx.$executeRaw`
        INSERT INTO "MemoryEmbedding" ("id", "userId", "memoryId", "embedding")
        VALUES (${`emb_${memory.id}`}, ${memory.userId}, ${memory.id}, ${vector}::vector)
        ON CONFLICT ("memoryId") DO UPDATE SET "embedding" = EXCLUDED."embedding"
      `;
      await tx.memoryRecord.update({
        where: { id: memory.id },
        data: { embeddingStatus: 'ready', embeddingModel: EMBEDDING_MODEL, embeddedAt: new Date(), contentHash, lastEmbeddingErrorCode: null }
      });
      return true;
    });
  } catch (error) {
    await db.$transaction(async tx => {
      const current = await tx.$queryRaw<Array<{ title: string; content: string }>>`
        SELECT "title", "content" FROM "MemoryRecord" WHERE "id" = ${memory.id} AND "userId" = ${memory.userId} FOR UPDATE
      `;
      if (!current.length || memoryContentHash(current[0].title, current[0].content) !== contentHash) return;
      // A stale vector is worse than no vector: remove it so retrieval falls back safely.
      await tx.memoryEmbedding.deleteMany({ where: { memoryId: memory.id, userId: memory.userId } });
      await tx.memoryRecord.update({
        where: { id: memory.id },
        data: { embeddingStatus: 'failed', embeddingModel: EMBEDDING_MODEL, embeddedAt: null, contentHash, lastEmbeddingErrorCode: error instanceof OracleProviderError ? error.code : 'EMBEDDING_FAILED' }
      });
    });
    console.warn('GENESIS memory embedding failed', error instanceof OracleProviderError ? error.code : 'EMBEDDING_FAILED');
    return false;
  }
}
