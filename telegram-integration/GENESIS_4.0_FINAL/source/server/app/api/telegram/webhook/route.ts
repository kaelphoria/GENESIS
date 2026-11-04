
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
export const maxDuration = 60;

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    chat: { id: number; type?: string };
    from?: { id: number; first_name?: string };
  };
};

async function telegram(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Telegram is not configured');

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    }
  );

  const result = await response.json() as { ok?: boolean };
  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram ${method} failed`);
  }
}

async function sendText(chatId: number, text: string) {
  const chunks = Array.from(text);
  for (let i = 0; i < chunks.length; i += 3800) {
    await telegram('sendMessage', {
      chat_id: chatId,
      text: chunks.slice(i, i + 3800).join('')
    });
  }
}

async function createTelegramSession() {
  const secret = process.env.AUTH_SECRET;
  const ownerId = process.env.GENESIS_TELEGRAM_OWNER_USER_ID;

  if (!secret || secret.length < 32 || !ownerId) {
    throw new Error('GENESIS session configuration is incomplete');
  }

  return new SignJWT({ sub: ownerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret));
}

async function askOracle(message: string, updateId: number) {
  const base =
    process.env.GENESIS_APP_ORIGIN ||
    process.env.APP_URL;

  if (!base) throw new Error('GENESIS application URL is missing');

  const origin = new URL(base).origin;
  const session = await createTelegramSession();
  const requestId = `telegram-${updateId}`;

  const response = await fetch(new URL('/api/chat', origin), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `genesis_session=${session}`,
      'x-idempotency-key': requestId
    },
    body: JSON.stringify({
      message,
      requestId,
      includeContext: true
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(55000)
  });

  const result = await response.json() as {
    answer?: string;
    error?: string;
  };

  if (!response.ok || !result.answer) {
    throw new Error(result.error || 'ORACLE request failed');
  }

  return result.answer;
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (
    !secret ||
    req.headers.get('x-telegram-bot-api-secret-token') !== secret
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = await req.json() as TelegramUpdate;
    const message = update.message;

    if (!message?.chat?.id || !message.from?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const senderId = String(message.from.id);
    const allowedId = process.env.GENESIS_TELEGRAM_ALLOWED_USER_ID;

    if (
      !allowedId ||
      senderId !== allowedId ||
      message.chat.type !== 'private' ||
      chatId !== message.from.id
    ) {
      return NextResponse.json({ ok: true });
    }

    const text = (message.text || '').trim();

    if (!text) {
      await sendText(chatId, 'Отправь ORACLE текстовое сообщение.');
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/start') || text.startsWith('/open')) {
      const app = process.env.TELEGRAM_WEBAPP_URL;

      if (app?.startsWith('https://')) {
        await telegram('sendMessage', {
          chat_id: chatId,
          text: 'GENESIS активирован. Можешь общаться со мной прямо здесь или открыть личное пространство.',
          reply_markup: {
            inline_keyboard: [[
              {
                text: 'Открыть GENESIS',
                web_app: { url: app }
              }
            ]]
          }
        });
      } else {
        await sendText(chatId, 'GENESIS ORACLE готов к диалогу.');
      }

      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/help')) {
      await sendText(
        chatId,
        'GENESIS ORACLE\n\n' +
        'Просто напиши сообщение, чтобы начать диалог.\n' +
        '/start — открыть GENESIS\n' +
        '/open — открыть пространство\n' +
        '/help — помощь'
      );
      return NextResponse.json({ ok: true });
    }

    if (text.length > 12000) {
      await sendText(chatId, 'Сообщение слишком длинное. Максимум — 12 000 символов.');
      return NextResponse.json({ ok: true });
    }

    await telegram('sendChatAction', {
      chat_id: chatId,
      action: 'typing'
    });

    const answer = await askOracle(text, update.update_id);
    await sendText(chatId, answer);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      'GENESIS Telegram webhook error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      { ok: false, error: 'Temporary processing error' },
      { status: 500 }
    );
  }
}
