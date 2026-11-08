'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const AUTH_TIMEOUT_MS = 20000;

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!email.trim() || password.length < (mode === 'register' ? 12 : 1)) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (mode === 'register') headers['x-genesis-bootstrap-token'] = bootstrapToken;
      const response = await fetch('/api/auth/' + mode, {
        method: 'POST', headers,
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal, cache: 'no-store', credentials: 'same-origin'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(response.status === 401
          ? 'Неверный email или пароль.'
          : data.error || (response.status >= 500 ? 'Сервер недоступен. Попробуй позже.' : 'Не удалось выполнить вход.'));
      }
      router.push('/');
      router.refresh();
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') setError('Сервер не отвечает. Проверь соединение и попробуй ещё раз.');
      else setError(caught instanceof Error ? caught.message : 'Не удалось выполнить вход');
    } finally {
      window.clearTimeout(timer);
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} aria-busy={busy}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" disabled={busy} /></label>
      <label>Пароль<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 12 : undefined} required value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'register' ? 'Не менее 12 символов' : ''} disabled={busy} /></label>
      {mode === 'register' && <label>Bootstrap token<input type="password" autoComplete="off" required minLength={32} value={bootstrapToken} onChange={event => setBootstrapToken(event.target.value)} placeholder="Токен из защищённых настроек сервера" disabled={busy} /></label>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-btn" disabled={busy}>{busy ? 'Подключение…' : mode === 'login' ? 'Войти в пространство' : 'Создать пространство'} <span>↗</span></button>
    </form>
  );
}
