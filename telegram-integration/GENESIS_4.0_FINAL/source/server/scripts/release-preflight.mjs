#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const isLoopbackHost = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname.toLowerCase());

export function inspectReleaseEnvironment(env = process.env) {
  const errors = [];
  const warnings = [];
  const production = env.NODE_ENV === 'production';

  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required.');
  else {
    try {
      const database = new URL(env.DATABASE_URL);
      if (!['postgres:', 'postgresql:'].includes(database.protocol)) errors.push('DATABASE_URL must use PostgreSQL.');
      if (production && !isLoopbackHost(database.hostname) && !['require', 'verify-ca', 'verify-full'].includes(database.searchParams.get('sslmode') || '')) {
        errors.push('Production DATABASE_URL must enforce TLS with sslmode=require (or stronger).');
      }
    } catch { errors.push('DATABASE_URL is not a valid URL.'); }
  }

  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) errors.push('AUTH_SECRET must contain at least 32 characters.');

  const appUrl = env.APP_URL || '';
  if (production) {
    try {
      const app = new URL(appUrl);
      if (app.protocol !== 'https:') errors.push('Production APP_URL must use HTTPS.');
      if (app.username || app.password) errors.push('APP_URL must not contain embedded credentials.');
    } catch { errors.push('Production APP_URL must be an absolute HTTPS URL.'); }

    if (!env.GENESIS_APP_ORIGIN) errors.push('GENESIS_APP_ORIGIN must be set explicitly in production.');
    else {
      try {
        const origin = new URL(env.GENESIS_APP_ORIGIN);
        if (origin.origin !== env.GENESIS_APP_ORIGIN || origin.protocol !== 'https:') errors.push('GENESIS_APP_ORIGIN must be a canonical HTTPS origin without a path.');
        if (appUrl && new URL(appUrl).origin !== origin.origin) errors.push('GENESIS_APP_ORIGIN must match APP_URL origin.');
      } catch { errors.push('GENESIS_APP_ORIGIN is not a valid absolute URL.'); }
    }
  }

  const provider = env.GENESIS_AI_PROVIDER || 'openai';
  if (!['openai', 'ollama'].includes(provider)) errors.push('GENESIS_AI_PROVIDER must be openai or ollama.');
  if (provider === 'openai' && !env.OPENAI_API_KEY) warnings.push('OPENAI_API_KEY is missing; ORACLE completion will be unavailable.');
  if (provider === 'ollama' && !env.OLLAMA_MODEL) warnings.push('OLLAMA_MODEL is missing; local ORACLE completion is not configured.');
  if (!env.GENESIS_BOOTSTRAP_TOKEN) warnings.push('GENESIS_BOOTSTRAP_TOKEN is absent; first-owner registration is disabled. This is correct after owner setup.');
  else if (env.GENESIS_BOOTSTRAP_TOKEN.length < 32) errors.push('GENESIS_BOOTSTRAP_TOKEN must contain at least 32 characters.');

  if (production && !env.GENESIS_BACKUP_KEY) warnings.push('GENESIS_BACKUP_KEY is absent; the optional encrypted backup helper is not configured.');
  if (production) warnings.push('Environment checks do not verify database reachability, migrations, backups, restore, TLS termination, or application behavior.');

  return { ok: errors.length === 0, errors, warnings };
}

function main() {
  const result = inspectReleaseEnvironment();
  for (const error of result.errors) process.stderr.write(`BLOCKER: ${error}\n`);
  for (const warning of result.warnings) process.stdout.write(`WARNING: ${warning}\n`);
  process.stdout.write(result.ok ? 'GENESIS release environment preflight: PASS\n' : 'GENESIS release environment preflight: FAIL\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
