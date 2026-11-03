import { db } from '@/lib/db';
import { WORLD_SEED } from '@/lib/worlds';
export async function ensureUserWorkspace(userId:string) {
  await db.personalProfile.upsert({where:{userId},update:{},create:{userId}});
  for (const w of WORLD_SEED) await db.world.upsert({where:{userId_slug:{userId,slug:w.slug}},update:{},create:{userId,slug:w.slug,title:w.title,description:w.description}});
}
