import { describe, expect, it } from 'vitest';
import { categoryIn, contextCategories } from './context-categories';

const item = (defaultContextId: string | null, category: string | null, deletedAt: number | null = null) => ({ defaultContextId, category, deletedAt });

describe('contextCategories', () => {
  it('before she edits them: the suggestions and the items of the context, in the app order, hers by name', () => {
    const items = [item('mercado', 'propria:Viagem'), item('mercado', 'propria:Festa'), item('mercado', 'pet'), item('farmacia', 'saude'), item('mercado', 'propria:Sumiu', 5)];
    expect(contextCategories({ id: 'mercado', categoryOrder: [] }, items)).toEqual(['laticinios', 'mercearia', 'limpeza', 'higiene', 'pet', 'propria:Festa', 'propria:Viagem']);
    expect(contextCategories({ id: 'novo', categoryOrder: [] }, items)).toEqual([]);
  });

  it('keeps the order she dragged before categories belonged to each context', () => {
    expect(contextCategories({ id: 'farmacia', categoryOrder: ['higiene', 'nada', 'limpeza'] }, [])).toEqual(['higiene', 'saude']);
  });

  it('once edited, the context has exactly its own', () => {
    expect(contextCategories({ id: 'mercado', categoryOrder: ['limpeza'], categories: ['propria:Festa', 'hortifruti', 'inventada'] }, [item('mercado', 'pet')])).toEqual(['propria:Festa', 'hortifruti']);
    expect(contextCategories(undefined, [])).toEqual([]);
  });
});

describe('categoryIn', () => {
  it('a category the context does not have becomes "Outros"', () => {
    expect(categoryIn(['saude'], 'saude')).toBe('saude');
    expect(categoryIn(['saude'], 'laticinios')).toBeNull();
    expect(categoryIn(['saude'], null)).toBeNull();
  });
});
