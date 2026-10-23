import { describe, expect, it } from 'vitest';
import { changed, created, deleted, wins } from './synced-record';

const phone = { deviceId: 'a-phone', now: 1000 };

describe('synced records', () => {
  it('the later change wins', () => {
    const old = created('x', phone);
    expect(wins({ ...old, updatedAt: 1001 }, old)).toBe(true);
    expect(wins(old, { ...old, updatedAt: 1001 })).toBe(false);
  });

  it('breaks a tie by device id, the same way on every device', () => {
    const a = created('x', { deviceId: 'a', now: 5 });
    const b = created('x', { deviceId: 'b', now: 5 });
    expect(wins(b, a)).toBe(true);
    expect(wins(a, b)).toBe(false);
    expect(wins(a, a)).toBe(false);
  });

  it('anything wins over nothing', () => {
    expect(wins(created('x', phone), undefined)).toBe(true);
  });

  it('a change moves updatedAt forward even when the clock went back', () => {
    const record = { ...created('x', phone), name: 'leite' };
    const next = changed(record, { name: 'leite zero' }, { deviceId: 'b-desktop', now: 10 });
    expect(next).toMatchObject({ name: 'leite zero', updatedAt: 1001, updatedBy: 'b-desktop' });
    expect(wins(next, record)).toBe(true);
  });

  it('a delete is a tombstone that wins over the record', () => {
    const record = created('x', phone);
    const tombstone = deleted(record, { ...phone, now: 2000 });
    expect(tombstone).toMatchObject({ id: 'x', deletedAt: 2000, updatedAt: 2000 });
    expect(wins(tombstone, record)).toBe(true);
  });
});
