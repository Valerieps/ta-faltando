import { cleanName } from './text';

/** What the owner typed or said for one item: "2 leite: sem lactose" (spec/itens-e-contextos.md). */
export interface EntryText {
  readonly name: string;
  readonly quantity: number | null;
  readonly note: string | null;
}

/** First letter in upper case, the way items are shown ("pão de forma" → "Pão de forma"). */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

const QUANTITY = /^(\d+(?:[.,]\d+)?)\s*x?\s+(.+)$/i;

/**
 * Splits one item's text: a leading number is the quantity, and what follows a colon is the note.
 * Without a colon the whole text is the name, so "leite sem lactose" is an item of its own.
 */
export function parseEntryText(text: string): EntryText {
  const clean = cleanName(text);
  const colon = clean.indexOf(':');
  let name = colon >= 0 ? clean.slice(0, colon).trim() : clean;
  const note = colon >= 0 ? clean.slice(colon + 1).trim() || null : null;

  let quantity: number | null = null;
  const match = QUANTITY.exec(name);
  if (match) {
    const value = Number(match[1].replace(',', '.'));
    if (value > 0) {
      quantity = value;
      name = match[2].trim();
    }
  }
  return { name: name ? capitalize(name) : '', quantity, note };
}

// List bullets and numbering pasted from another app: "- leite", "• ovos", "1. café", "☐ pão".
const BULLET = /^(?:[-*•·☐☑✓✔]+|\d+[.)])\s*/;

/**
 * Splits a batch or a voice transcript into items, at commas, semicolons, line breaks and the
 * word "e" ("leite, ovos e ração" → 3 items).
 */
export function splitBatch(text: string): EntryText[] {
  return text
    .split(/[,;\n\r]+|\s+e\s+/i)
    .map((part) => parseEntryText(cleanName(part).replace(BULLET, '')))
    .filter((entry) => entry.name !== '');
}

/** The text form of an entry, the way it is shown next to the name ("2 · sem lactose"). */
export function entryDetails(entry: { quantity: number | null; note: string | null }): string {
  return [entry.quantity === null ? null : String(entry.quantity).replace('.', ','), entry.note]
    .filter(Boolean)
    .join(' · ');
}
