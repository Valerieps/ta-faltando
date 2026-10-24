import { describe, expect, it } from 'vitest';
import type { ListEntry } from '../../domain/list-entry';
import { holdPlace } from './useFading';

const entry = (id: string, addedAt: number, checkedAt: number | null = null): ListEntry => ({
  id,
  updatedAt: 1,
  updatedBy: 'd',
  deletedAt: null,
  itemId: id,
  contextId: 'c',
  quantity: null,
  note: null,
  status: 'pending',
  addedAt,
  boughtAt: null,
  checkedAt,
});

describe('holdPlace', () => {
  const list = [entry('a', 1), entry('c', 3), entry('b', 2, 9), entry('d', 0, 8)];

  it('keeps the list as it is when nothing is settling', () => {
    expect(holdPlace(list, new Set())).toBe(list);
  });

  it('keeps a just-struck item where it was among the missing ones', () => {
    expect(holdPlace(list, new Set(['b'])).map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
