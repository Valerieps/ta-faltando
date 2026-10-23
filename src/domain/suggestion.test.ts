import { describe, expect, it } from 'vitest';
import { categoryIdFor, categoryName, isCategory } from './suggestion';

describe('categories she creates', () => {
  it('reuses an app category with the typed name, else creates one named as typed', () => {
    expect(categoryIdFor('  limpeza ')).toBe('limpeza');
    expect(categoryIdFor('festa  junina')).toBe('propria:Festa junina');
    expect(categoryIdFor('outros')).toBeNull();
    expect(categoryIdFor('   ')).toBeNull();
  });

  it('shows its name and counts as a category', () => {
    expect(categoryName('propria:Festa')).toBe('Festa');
    expect(isCategory('propria:Festa')).toBe(true);
    expect(isCategory('propria:')).toBe(false);
    expect(categoryName('nada')).toBe('Outros');
  });
});
