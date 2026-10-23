import { describe, expect, it } from 'vitest';
import { signOut } from './sign-out';

describe('signOut', () => {
  it('forgets the e-mail, then opens the logout', async () => {
    const steps: string[] = [];
    const settings = { set: async (key: string, value: unknown) => void steps.push(`${key}=${String(value)}`) };
    await signOut(settings as never, '/cdn-cgi/access/logout', (path) => steps.push(path));
    expect(steps).toEqual(['email=null', '/cdn-cgi/access/logout']);
  });

  it('still opens the logout when the device fails to save', async () => {
    const opened: string[] = [];
    const settings = { set: () => Promise.reject(new Error('IndexedDB')) };
    await expect(signOut(settings as never, '/cdn-cgi/access/logout', (path) => opened.push(path))).rejects.toThrow();
    expect(opened).toEqual(['/cdn-cgi/access/logout']);
  });
});
