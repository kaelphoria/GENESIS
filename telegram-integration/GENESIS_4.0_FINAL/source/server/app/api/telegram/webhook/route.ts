import { NextRequest,NextResponse } from 'next/server';
import { requireSameOrigin } from '@/lib/request-security';
export const runtime='nodejs';
type Update={message?:{text?:string;chat:{id:number};from?:{id:number;first_name?:string}}};
async function callTelegram(method:string,payload:Record<string,unknown>){const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)throw new Error('Bot not configured');const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(8000)});const result=await r.json() as {ok?:boolean};if(!r.ok||result.ok!==true)throw new Error(`Telegram ${method} failed`);return result;}
export async function POST(req:NextRequest){
 const secret=process.env.TELEGRAM_WEBHOOK_SECRET;if(!secret||req.headers.get('x-telegram-bot-api-secret-token')!==secret)return NextResponse.json({ok:false},{status:401});
 // Telegram authenticates server-to-server webhooks with its secret header, not a browser Origin.
 // Same-origin protection remains the fallback for any non-Telegram caller.
 if(!req.headers.get('x-telegram-bot-api-secret-token')){const originFailure=requireSameOrigin(req);if(originFailure)return originFailure;}
 try{const update=await req.json() as Update;const m=update.message;if(!m?.chat?.id||!m.from?.id)return NextResponse.json({ok:true});const allowed=process.env.GENESIS_TELEGRAM_ALLOWED_USER_ID;const app=process.env.TELEGRAM_WEBAPP_URL;const chat=m.chat.id;
  if(!allowed||String(m.from.id)!==allowed){await callTelegram('sendMessage',{chat_id:chat,text:'Этот экземпляр GENESIS работает в приватном режиме. Доступ не предоставлен.'});return NextResponse.json({ok:true});}
  const text=(m.text||'').trim();
  if(text.startsWith('/start')||text.startsWith('/open')){
   if(!app||!app.startsWith('https://'))await callTelegram('sendMessage',{chat_id:chat,text:'Mini App пока не подключён. Нужен публичный HTTPS-адрес приложения.'});
   else await callTelegram('sendMessage',{chat_id:chat,text:'GENESIS готов. Открой личное пространство: ORACLE, память, Девять миров и решения.',reply_markup:{inline_keyboard:[[{text:'Открыть GENESIS',web_app:{url:app}}]]}});
  }else if(text.startsWith('/help'))await callTelegram('sendMessage',{chat_id:chat,text:'Команды GENESIS:\n/start — открыть пространство\n/open — открыть Mini App\n/help — помощь\n\nЛичные диалоги с ORACLE доступны внутри Mini App.'});
  else await callTelegram('sendMessage',{chat_id:chat,text:'Сообщение получено. Для приватного диалога с ORACLE открой GENESIS Mini App — история сохраняется в твоём личном пространстве.',reply_markup:app?.startsWith('https://')?{inline_keyboard:[[{text:'Открыть GENESIS',web_app:{url:app}}]]}:undefined});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({ok:false},{status:500});}
}
