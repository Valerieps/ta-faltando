import { describe, expect, it } from 'vitest';
import { categoryIdFor, categoryName, customCategories, isCategory } from './suggestion';

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

  it('lists the ones some item still uses, by name', () => {
    const items = [
      { category: 'propria:Viagem', deletedAt: null },
      { category: 'propria:Festa', deletedAt: null },
      { category: 'propria:Festa', deletedAt: null },
      { category: 'propria:Sumiu', deletedAt: 5 },
      { category: 'limpeza', deletedAt: null },
    ];
    expect(customCategories(items)).toEqual(['propria:Festa', 'propria:Viagem']);
  });
});
