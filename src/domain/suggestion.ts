import data from '../data/sugestoes.json';
import { capitalize } from './entry-text';
import { cleanName, nameKey } from './text';

/** One of the app's categories (spec/setup.md), or one the owner created in the item's detail. */
export interface Category {
  readonly id: string;
  readonly name: string;
}

/** An item from the setup queues, with its context and category (spec/setup.md). */
export interface Suggestion {
  readonly name: string;
  /** The id of the suggested context it belongs to. */
  readonly contextId: string;
  readonly category: string | null;
}

/** A context the setup suggests, with its queue from the most to the least common item. */
export interface SuggestedContext {
  readonly id: string;
  readonly name: string;
  readonly queue: readonly Suggestion[];
}

interface DataFile {
  categorias: { id: string; nome: string }[];
  contextos: { id: string; nome: string; sugestoes: { nome: string; categoria: string | null }[] }[];
}

const file = data as DataFile;

/** The app's categories, in their default order in shopping mode. */
export const CATEGORIES: readonly Category[] = file.categorias.map((c) => ({ id: c.id, name: c.nome }));

/** Items without a category are grouped under this name. */
export const OTHER_CATEGORY_NAME = 'Outros';

export const SUGGESTED_CONTEXTS: readonly SuggestedContext[] = file.contextos.map((c) => ({
  id: c.id,
  name: c.nome,
  queue: c.sugestoes.map((s) => ({ name: s.nome, contextId: c.id, category: s.categoria })),
}));

/**
 * A category the owner created: its id carries its name, so it needs no table of its own; each
 * context lists the ones it has (`Context.categories`).
 */
const CUSTOM_PREFIX = 'propria:';

const isCustomCategory = (id: string | null): id is string => id !== null && id.startsWith(CUSTOM_PREFIX) && id.length > CUSTOM_PREFIX.length;

/** An app category or one the owner created; anything else is grouped under "Outros". */
export const isCategory = (id: string | null): id is string => CATEGORIES.some((c) => c.id === id) || isCustomCategory(id);

/** The id for a typed category name: an app category with that name, else a new one. */
export function categoryIdFor(name: string): string | null {
  const clean = capitalize(cleanName(name));
  if (!clean) return null;
  if (nameKey(clean) === nameKey(OTHER_CATEGORY_NAME)) return null;
  return CATEGORIES.find((c) => nameKey(c.name) === nameKey(clean))?.id ?? CUSTOM_PREFIX + clean;
}

export const categoryName = (id: string | null): string =>
  CATEGORIES.find((c) => c.id === id)?.name ?? (isCustomCategory(id) ? id.slice(CUSTOM_PREFIX.length) : OTHER_CATEGORY_NAME);

/** The suggestion with this name, in any queue, ignoring case and accents. */
export function findSuggestion(name: string): Suggestion | undefined {
  const key = nameKey(name);
  for (const context of SUGGESTED_CONTEXTS) {
    const found = context.queue.find((s) => nameKey(s.name) === key);
    if (found) return found;
  }
  return undefined;
}
