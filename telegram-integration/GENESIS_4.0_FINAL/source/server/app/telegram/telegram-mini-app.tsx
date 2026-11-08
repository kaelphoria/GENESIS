'use client';
import { useEffect, useState } from 'react';

const AUTH_TIMEOUT_MS = 15000;
const SLOW_HINT_MS = 4000;
const SDK_TIMEOUT_MS = 15000;
const REDIRECT_GUARD_KEY = 'genesis-tg-auth-redirected-at';
type AuthResult = { ok: true } | { ok: false; message: string };
let authPromise: Promise<AuthResult> | null = null;

function authenticate(initData: string): Promise<AuthResult> {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AUTH_TIMEOUT_MS);
    try {
      const response = await fetch('/api/telegram/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ initData }),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Не удалось подтвердить доступ.');
      return { ok: true } as const;
    } catch (error) {
      return {
        ok: false,
        message: timedOut
          ? 'Сервер не ответил за 15 секунд. Проверь соединение и повтори вход.'
          : error instanceof Error ? error.message : 'Ошибка безопасного входа.'
      } as const;
    } finally {
      window.clearTimeout(timer);
    }
  })();
  void authPromise.then(result => { if (!result.ok) authPromise = null; });
  return authPromise;
}

export default function TelegramMiniApp() {
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState('Проверяем защищённое соединение');

  useEffect(() => {
    let cancelled = false;
    let slowTimer = 0;
    let sdkPoll = 0;
    let elapsed = 0;

    const fail = (message: string) => {
      if (cancelled) return;
      setFailed(true);
      setStatus(message);
    };

    const startAuthentication = async () => {
      if (cancelled) return;
      const tg = window.Telegram?.WebApp;
      if (!tg) return;
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.('#090a0c');
      tg.setBackgroundColor?.('#090a0c');
      tg.HapticFeedback?.impactOccurred?.('light');

      if (!tg.initData) {
        fail('Открой GENESIS через приватного Telegram-бота.');
        return;
      }

      let lastRedirect = 0;
      try { lastRedirect = Number(sessionStorage.getItem(REDIRECT_GUARD_KEY) || 0); } catch {}
      if (lastRedirect && Date.now() - lastRedirect < 5000) {
        fail('Похоже, вход вернулся на экран проверки. Нажми «Повторить», чтобы начать новую сессию.');
        return;
      }

      slowTimer = window.setTimeout(() => {
        if (!cancelled) setStatus('Соединение медленное. Продолжаем защищённую проверку…');
      }, SLOW_HINT_MS);

      const result = await authenticate(tg.initData);
      window.clearTimeout(slowTimer);
      if (cancelled) return;
      if (!result.ok) {
        fail(result.message);
        return;
      }

      setStatus('Доступ подтверждён. Загружаем твоё пространство');
      try { sessionStorage.setItem(REDIRECT_GUARD_KEY, String(Date.now())); } catch {}
      window.location.replace('/');
    };

    const pollForSdk = () => {
      if (cancelled) return;
      if (window.Telegram?.WebApp) {
        window.clearInterval(sdkPoll);
        void startAuthentication();
        return;
      }
      elapsed += 150;
      if (elapsed >= SDK_TIMEOUT_MS) {
        window.clearInterval(sdkPoll);
        fail('Не удалось подключить модуль Telegram. Проверь сеть и открой GENESIS из бота.');
      }
    };

    if (window.Telegram?.WebApp) {
      void startAuthentication();
    } else {
      const existing = document.querySelector<HTMLScriptElement>('script[data-telegram-webapp]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.dataset.telegramWebapp = 'true';
        script.onerror = () => fail('Не удалось загрузить защищённый модуль Telegram.');
        document.head.appendChild(script);
      } else {
        existing.addEventListener('error', () => fail('Не удалось загрузить защищённый модуль Telegram.'), { once: true });
      }
      sdkPoll = window.setInterval(pollForSdk, 150);
      pollForSdk();
    }

    return () => {
      cancelled = true;
      window.clearInterval(sdkPoll);
      window.clearTimeout(slowTimer);
    };
  }, []);

  return (
    <main className="tg-gate">
      <div className="tg-gate-glow" />
      <section className="tg-gate-card">
        <div className="tg-gate-orbit"><span /><i /><b /></div>
        <div className="tg-gate-kicker">PRIVATE INTELLIGENCE SYSTEM</div>
        <div className="tg-gate-wordmark">GENESIS</div>
        <div className="tg-gate-rule" />
        <div className={'tg-gate-indicator' + (failed ? ' error' : '')} />
        <p aria-live="polite">{status}</p>
        {failed && <button className="tg-gate-retry" onClick={() => {
          try { sessionStorage.removeItem(REDIRECT_GUARD_KEY); } catch {}
          window.location.reload();
        }}>Повторить подключение</button>}
        <small>SECURE TELEGRAM SESSION · PRIVATE ACCESS</small>
      </section>
    </main>
  );
}
