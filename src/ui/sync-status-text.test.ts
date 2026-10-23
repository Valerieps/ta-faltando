import { describe, expect, it } from 'vitest';
import { syncStatusText } from './sync-status-text';

const text = (status: Parameters<typeof syncStatusText>[0]['status'], pending: number) =>
  syncStatusText({ status, pending, lastSyncedAt: null });

describe('sync status text', () => {
  it('says when everything went up', () => {
    expect(text('idle', 0)).toBe('Sincronizado');
  });

  it('counts the changes that did not go up', () => {
    expect(text('idle', 1)).toBe('1 mudança para subir');
    expect(text('offline', 3)).toBe('Sem internet · 3 mudanças para subir');
    expect(text('signed-out', 2)).toBe('2 mudanças esperando o login');
  });

  it('asks for the login when there is nothing pending', () => {
    expect(text('signed-out', 0)).toBe('Entre para sincronizar');
  });
});
