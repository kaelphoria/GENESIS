'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (mode === 'register') headers['x-genesis-bootstrap-token'] = bootstrapToken;
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка');
      router.push('/');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось выполнить вход');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
      <label>Пароль<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={12} required value={password} onChange={event => setPassword(event.target.value)} placeholder="Не менее 12 символов" /></label>
      {mode === 'register' && <label>Bootstrap token<input type="password" autoComplete="off" required minLength={32} value={bootstrapToken} onChange={event => setBootstrapToken(event.target.value)} placeholder="Токен из защищённых настроек сервера" /></label>}
      {error && <div className="form-error">{error}</div>}
      <button className="primary-btn" disabled={busy}>{busy ? 'Подключение…' : mode === 'login' ? 'Войти в пространство' : 'Создать пространство'} <span>↗</span></button>
    </form>
  );
}
