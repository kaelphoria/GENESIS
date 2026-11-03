import { NextRequest, NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
import { verifyTelegramInitData } from '@/lib/telegram/init-data';
import { createSession, jsonError } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureUserWorkspace } from '@/lib/seed-user';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const originFailure=requireSameOrigin(req); if(originFailure)return originFailure;
 try{
  const token=process.env.TELEGRAM_BOT_TOKEN, allowed=process.env.GENESIS_TELEGRAM_ALLOWED_USER_ID, ownerId=process.env.GENESIS_TELEGRAM_OWNER_USER_ID;
  if(!token||!allowed||!ownerId)return jsonError('Telegram-вход ещё не настроен на сервере.',503);
  const body=await req.json(); const user=verifyTelegramInitData(typeof body.initData==='string'?body.initData:'',token);
  if(!user)return jsonError('Данные Telegram недействительны или устарели. Перезапусти Mini App.',401);
  if(String(user.id)!==allowed)return jsonError('Доступ к GENESIS через Telegram не разрешён.',403);
  const owner=await db.user.findUnique({where:{id:ownerId},select:{id:true}}); if(!owner)return jsonError('Владелец GENESIS не найден. Проверь конфигурацию сервера.',503);
  await ensureUserWorkspace(owner.id); await createSession(owner.id);
  await db.auditEvent.create({data:{userId:owner.id,event:'TELEGRAM_SESSION_CREATED'}});
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return jsonError('Не удалось выполнить безопасный вход через Telegram.',500);}
}
