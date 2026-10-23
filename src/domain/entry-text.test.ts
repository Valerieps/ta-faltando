import { describe, expect, it } from 'vitest';
import { capitalize, entryDetails, parseEntryText, splitBatch } from './entry-text';

describe('entry text', () => {
  it('reads a leading quantity and a note after the colon', () => {
    expect(parseEntryText('2 leite: sem lactose')).toEqual({ name: 'Leite', quantity: 2, note: 'sem lactose' });
    expect(parseEntryText('1,5 batata')).toEqual({ name: 'Batata', quantity: 1.5, note: null });
    expect(parseEntryText('3x ovos')).toEqual({ name: 'Ovos', quantity: 3, note: null });
  });

  it('without a colon the whole text is the name', () => {
    expect(parseEntryText('leite sem lactose')).toEqual({ name: 'Leite sem lactose', quantity: null, note: null });
    expect(parseEntryText('álcool 70%')).toEqual({ name: 'Álcool 70%', quantity: null, note: null });
  });

  it('a number alone is a name, not a quantity', () => {
    expect(parseEntryText('7')).toEqual({ name: '7', quantity: null, note: null });
    expect(parseEntryText('  :  ').name).toBe('');
  });

  it('splits a batch at commas, lines and the word "e"', () => {
    const names = splitBatch('tomate, cebola, 2 limão\nshampoo\nareia do gato e fita dupla-face').map((e) => e.name);
    expect(names).toEqual(['Tomate', 'Cebola', 'Limão', 'Shampoo', 'Areia do gato', 'Fita dupla-face']);
  });

  it('drops bullets and numbering from pasted lists', () => {
    expect(splitBatch('- leite\n• ovos\n1. café\n☐ pão\n\n').map((e) => e.name)).toEqual(['Leite', 'Ovos', 'Café', 'Pão']);
  });

  it('splits at "e" only as a word of its own', () => {
    expect(splitBatch('detergente e esponja, feijão').map((e) => e.name)).toEqual(['Detergente', 'Esponja', 'Feijão']);
  });

  it('shows the details next to the name', () => {
    expect(entryDetails({ quantity: 1.5, note: 'maduro' })).toBe('1,5 · maduro');
    expect(entryDetails({ quantity: null, note: null })).toBe('');
    expect(capitalize('ração')).toBe('Ração');
  });
});
