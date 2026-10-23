import type { Context } from './context';
import type { Item } from './item';
import { CATEGORIES, SUGGESTED_CONTEXTS, categoryName, isCategory } from './suggestion';

type CategorySource = Pick<Context, 'id' | 'categoryOrder' | 'categories'>;

/**
 * The context's categories, in the order of the store's aisles (spec/modo-compra.md). Until she
 * edits them, they are those of the context's setup suggestions and of its items: first in the
 * order she dragged, then the app's order, then hers by name.
 */
export function contextCategories(context: CategorySource | undefined, items: Iterable<Pick<Item, 'defaultContextId' | 'category' | 'deletedAt'>>): string[] {
  if (!context) return [];
  if (context.categories) return context.categories.filter(isCategory);
  const used = new Set<string>();
  for (const suggestion of SUGGESTED_CONTEXTS.find((c) => c.id === context.id)?.queue ?? []) {
    if (isCategory(suggestion.category)) used.add(suggestion.category);
  }
  for (const item of items) {
    if (item.deletedAt === null && item.defaultContextId === context.id && isCategory(item.category)) used.add(item.category);
  }
  const own = context.categoryOrder.filter((id) => used.has(id));
  const app = CATEGORIES.map((c) => c.id).filter((id) => used.has(id) && !own.includes(id));
  const custom = [...used]
    .filter((id) => !own.includes(id) && !app.includes(id))
    .sort((a, b) => categoryName(a).localeCompare(categoryName(b), 'pt-BR'));
  return [...own, ...app, ...custom];
}

/** The category a new item keeps in this context: one the context does not have becomes "Outros". */
export function categoryIn(categories: readonly string[], category: string | null): string | null {
  return category !== null && categories.includes(category) ? category : null;
}
