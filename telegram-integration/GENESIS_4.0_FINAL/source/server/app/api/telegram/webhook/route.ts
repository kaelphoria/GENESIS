import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat: { id: number; type?: string };
    from?: { id: number; first_name?: string };
  };
};

type TelegramApiResult = { ok?: boolean };

async function callTelegram(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Telegram bot is not configured');

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000)
  });

  const result = (await response.json()) as TelegramApiResult;
  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram method failed: ${method}`);
  }
  return result;
}

async function sendText(chatId: number, text: string) {
  const characters = Array.from(text || 'ORACLE не вернул ответ.');
  while (characters.length) {
    const chunk = characters.splice(0, 3800).join('');
    await callTelegram('sendMessage', { chat_id: chatId, text: chunk });
  }
}

async function saveManualPrompt(userId: string, prompt: string) {
  const title = prompt.replace(/\s+/g, ' ').trim().slice(0, 61) || 'Telegram ORACLE';
  return db.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: { userId, title: title.length === 61 ? title + '…' : title }
    });
    const message = await tx.chatMessage.create({
      data: { userId, conversationId: conversation.id, role: 'user', content: prompt }
    });
    await tx.auditEvent.create({
      data: { userId, event: 'TELEGRAM_MANUAL_PROMPT_SAVED', metadata: { conversationId: conversation.id, messageId: message.id } }
    });
    return conversation;
  });
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
    const update = (await req.json()) as TelegramUpdate;
    const message = update.message;
    if (!message?.chat?.id || !message.from?.id) {
      return NextResponse.json({ ok: true });
    }

    const allowedUserId = process.env.GENESIS_TELEGRAM_ALLOWED_USER_ID;
    const chatId = message.chat.id;
    const senderId = message.from.id;

    if (
      !allowedUserId ||
      String(senderId) !== allowedUserId ||
      message.chat.type !== 'private' ||
      chatId !== senderId
    ) {
      await sendText(
        chatId,
        'Этот экземпляр GENESIS работает в приватном режиме. Доступ не предоставлен.'
      );
      return NextResponse.json({ ok: true });
    }

    const text = (message.text || '').trim();

    if (text.startsWith('/start') || text.startsWith('/open')) {
      const app = process.env.TELEGRAM_WEBAPP_URL;
      if (!app || !app.startsWith('https://')) {
        await sendText(
          chatId,
          'Mini App пока не подключён. Нужен публичный HTTPS-адрес приложения.'
        );
      } else {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: 'GENESIS готов. Открой своё пространство. ORACLE работает в бесплатном режиме обмена с ChatGPT.',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Открыть GENESIS', web_app: { url: app } }
            ]]
          }
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith('/help')) {
      await sendText(
        chatId,
        'Команды GENESIS:\n/start — открыть пространство\n/open — открыть Mini App\n/help — помощь\n\nОтправь текст — GENESIS сохранит его в ORACLE, чтобы ты мог перенести запрос в ChatGPT и вернуть ответ.'
      );
      return NextResponse.json({ ok: true });
    }

    if (!text) {
      await sendText(chatId, 'Пока ORACLE принимает только текстовые сообщения.');
      return NextResponse.json({ ok: true });
    }

    if (text.length > 12000) {
      await sendText(
        chatId,
        'Сообщение слишком длинное. Отправь его несколькими частями.'
      );
      return NextResponse.json({ ok: true });
    }

    try {
      const ownerId = process.env.GENESIS_TELEGRAM_OWNER_USER_ID;
      if (!ownerId) throw new Error('Telegram owner is not configured');
      await saveManualPrompt(ownerId, text);
      const app = process.env.TELEGRAM_WEBAPP_URL;
      const responseText = 'Запрос сохранён в GENESIS ORACLE. Открой Mini App → ORACLE, найди новый диалог и скопируй запрос в ChatGPT. Затем вставь ответ в поле «Ответ ChatGPT» и сохрани его в истории. Платный API не используется.';
      if (app && app.startsWith('https://')) {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: responseText,
          reply_markup: { inline_keyboard: [[{ text: 'Открыть ORACLE', web_app: { url: app } }]] }
        });
      } else {
        await sendText(chatId, responseText);
      }
    } catch (error) {
      console.error('GENESIS Telegram manual ORACLE error', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
      await sendText(chatId, 'Не удалось сохранить запрос в GENESIS. Попробуй ещё раз через минуту.');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      'GENESIS Telegram webhook error',
      error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
