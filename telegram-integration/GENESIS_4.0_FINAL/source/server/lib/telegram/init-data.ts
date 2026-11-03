import { createHmac, timingSafeEqual } from 'node:crypto';
type TelegramUser = { id: number; first_name?: string; last_name?: string; username?: string };
export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSeconds = 300): TelegramUser | null {
  if (!initData || initData.length > 8192) return null;
  const params = new URLSearchParams(initData); const hash = params.get('hash');
  const authDate = Number(params.get('auth_date')); const userRaw = params.get('user');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !Number.isFinite(authDate) || !userRaw) return null;
  const now = Math.floor(Date.now()/1000); if (authDate > now+30 || now-authDate > maxAgeSeconds) return null;
  params.delete('hash');
  const check = [...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const secret = createHmac('sha256','WebAppData').update(botToken).digest();
  const expected = createHmac('sha256',secret).update(check).digest(); const supplied=Buffer.from(hash,'hex');
  if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return null;
  try { const user=JSON.parse(userRaw) as TelegramUser; return Number.isSafeInteger(user.id)&&user.id>0?user:null; } catch { return null; }
}
