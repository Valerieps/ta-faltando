import { describe, expect, it } from 'vitest';
import type { Item } from './item';
import { editDistance, searchItems } from './search';

const item = (name: string, deletedAt: number | null = null): Item => ({
  id: name,
  updatedAt: 1,
  updatedBy: 'd',
  deletedAt,
  name,
  defaultContextId: null,
  category: null,
  createdVia: 'manual',
});

const catalog = ['Água sanitária', 'Detergente', 'Detergente de roupa', 'Leite', 'Leite condensado', 'Pão de forma', 'Café'].map((n) => item(n));
const names = (query: string) => searchItems(catalog, query).map((i) => i.name);

describe('autocomplete', () => {
  it('ignores case and accents', () => {
    expect(names('agua sanitaria')).toEqual(['Água sanitária']);
    expect(names('CAFE')).toEqual(['Café']);
  });

  it('puts the exact name first, then the shortest that starts with the text', () => {
    expect(names('leite')).toEqual(['Leite', 'Leite condensado']);
    expect(names('detergen')).toEqual(['Detergente', 'Detergente de roupa']);
  });

  it('finds a word in the middle of the name', () => {
    expect(names('forma')).toEqual(['Pão de forma']);
  });

  it('tolerates typos, more for longer words', () => {
    expect(names('detregente')).toContain('Detergente');
    expect(names('lete')).toContain('Leite');
    expect(names('xy')).toEqual([]);
  });

  it('skips deleted items and empty text', () => {
    expect(searchItems([item('Leite', 5)], 'leite')).toEqual([]);
    expect(searchItems(catalog, '  ')).toEqual([]);
  });

  it('counts a swap of two letters as one typo', () => {
    expect(editDistance('cafe', 'caef')).toBe(1);
    expect(editDistance('leite', 'leite')).toBe(0);
  });
});
