import { describe, expect, it } from 'vitest';
import type { Env } from './d1';
import { handleMe } from './me-handler';

const env = { DB: {} as Env['DB'], ALLOWED_EMAILS: 'dona@example.com,outro@example.com' };

function call(email: string | null) {
  const headers = new Headers();
  if (email) headers.set('Cf-Access-Authenticated-User-Email', email);
  return handleMe(new Request('https://app.test/api/me', { headers }), env);
}

describe('/api/me', () => {
  it('gives the owner her e-mail', async () => {
    const response = call('Dona@Example.com');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ email: 'Dona@Example.com' });
  });

  it('gives any allowed user their own e-mail', async () => {
    expect(await call('outro@example.com').json()).toEqual({ email: 'outro@example.com' });
  });

  it('answers no one else', () => {
    expect(call(null).status).toBe(403);
    expect(call('outra@example.com').status).toBe(403);
  });
});
