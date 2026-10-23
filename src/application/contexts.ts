import type { Context } from '../domain/context';
import { contextCategories } from '../domain/context-categories';
import { capitalize } from '../domain/entry-text';
import { findItemByName, type Item } from '../domain/item';
import { activeContexts } from '../domain/list-view';
import type { Selected } from '../domain/setup-capsules';
import { categoryIdFor } from '../domain/suggestion';
import { changed, created, type Author } from '../domain/synced-record';
import { cleanName, nameKey } from '../domain/text';
import type { Clock, IdGenerator, LocalStore } from './ports';

/** One context chosen in the setup, with the items selected for it (spec/setup.md). */
export interface SetupChoice {
  /** The suggested context's fixed id ("mercado"), or null for an "Outro" one. */
  readonly suggestedId: string | null;
  readonly name: string;
  readonly selected: readonly Selected[];
}

/** Use cases for the contexts and the setup. */
export class Contexts {
  constructor(
    private readonly store: LocalStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /** A new context at the end of the tabs; a deactivated one with the same name comes back instead. */
  async create(name: string, id: string | null = null): Promise<Context | null> {
    const clean = capitalize(cleanName(name));
    if (!clean) return null;
    const author = await this.author();
    const all = await this.store.list('contexts');
    const same = all.find((c) => (id !== null && c.id === id) || nameKey(c.name) === nameKey(clean));
    if (same) {
      if (same.active) return same;
      const back = changed(same, { active: true, order: this.nextOrder(all) }, author);
      await this.store.save('contexts', back);
      return back;
    }
    const tombstone = id === null ? undefined : await this.store.get('contexts', id);
    const context: Context = {
      ...created(id ?? this.ids.newId(), author),
      // A suggested context deleted earlier comes back under its fixed id, past the tombstone.
      updatedAt: Math.max(author.now, (tombstone?.updatedAt ?? 0) + 1),
      name: clean,
      icon: null,
      order: this.nextOrder(all),
      active: true,
      groupByCategory: false,
      categoryOrder: [],
    };
    await this.store.save('contexts', context);
    return context;
  }

  async rename(contextId: string, name: string): Promise<void> {
    const clean = capitalize(cleanName(name));
    if (clean) await this.change(contextId, { name: clean });
  }

  /** A deactivated context leaves the tabs; its items show in "Sem contexto" until linked again. */
  async setActive(contextId: string, active: boolean): Promise<void> {
    await this.change(contextId, { active });
  }

  async setGroupByCategory(contextId: string, groupByCategory: boolean): Promise<void> {
    await this.change(contextId, { groupByCategory });
  }

  /** The order of the category groups, to follow the store's aisles (spec/modo-compra.md). */
  async setCategoryOrder(contextId: string, categoryOrder: readonly (string | null)[]): Promise<void> {
    await this.changeCategories(contextId, async (current) => {
      const order = categoryOrder.filter((id): id is string => id !== null && current.includes(id));
      return [...order, ...current.filter((id) => !order.includes(id))];
    });
  }

  /** A new category at the end of the context's; returns its id, or null for "Outros" or a blank name. */
  async addCategory(contextId: string, name: string): Promise<string | null> {
    const id = categoryIdFor(name);
    if (id === null) return null;
    await this.changeCategories(contextId, async (current) => (current.includes(id) ? current : [...current, id]));
    return id;
  }

  /**
   * Renames a category in this context only; its items follow. A name the context already has
   * merges the two.
   */
  async renameCategory(contextId: string, categoryId: string, name: string): Promise<void> {
    const id = categoryIdFor(name);
    if (id === null || id === categoryId) return;
    await this.changeCategories(contextId, async (current) => {
      if (!current.includes(categoryId)) return current;
      await this.recategorize(contextId, categoryId, id);
      return current.includes(id) ? current.filter((c) => c !== categoryId) : current.map((c) => (c === categoryId ? id : c));
    });
  }

  /** Takes a category out of the context; its items go to "Outros". */
  async removeCategory(contextId: string, categoryId: string): Promise<void> {
    await this.changeCategories(contextId, async (current) => {
      await this.recategorize(contextId, categoryId, null);
      return current.filter((c) => c !== categoryId);
    });
  }

  /** Moves a category one place up (-1) or down (+1) among the context's. */
  async moveCategory(contextId: string, categoryId: string, by: -1 | 1): Promise<void> {
    await this.changeCategories(contextId, async (current) => {
      const list = [...current];
      const from = list.indexOf(categoryId);
      const to = from + by;
      if (from < 0 || to < 0 || to >= list.length) return current;
      [list[from], list[to]] = [list[to], list[from]];
      return list;
    });
  }

  /** Moves a context one place up (-1) or down (+1) among the tabs. */
  async move(contextId: string, by: -1 | 1): Promise<void> {
    const list = activeContexts(await this.store.list('contexts'));
    const from = list.findIndex((c) => c.id === contextId);
    const to = from + by;
    if (from < 0 || to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    const author = await this.author();
    for (const [order, context] of list.entries()) {
      if (context.order !== order) await this.store.save('contexts', changed(context, { order }, author));
    }
  }

  /**
   * Saves the setup: creates the chosen contexts and puts the selected items in their catalogs.
   * An item already in the catalog keeps its context, unless it had none.
   */
  async applySetup(choices: readonly SetupChoice[]): Promise<{ name: string; count: number }[]> {
    const summary: { name: string; count: number }[] = [];
    for (const choice of choices) {
      const context = await this.create(choice.name, choice.suggestedId);
      if (!context) continue;
      let count = 0;
      for (const selected of choice.selected) {
        if (await this.putInCatalog(selected, context.id)) count++;
      }
      summary.push({ name: context.name, count });
    }
    return summary;
  }

  private async putInCatalog(selected: Selected, contextId: string): Promise<boolean> {
    const author = await this.author();
    const existing = findItemByName(await this.store.list('items'), selected.name);
    if (existing) {
      if (existing.defaultContextId !== null) return existing.defaultContextId === contextId;
      const category = existing.category ?? selected.category;
      await this.store.save('items', changed(existing, { defaultContextId: contextId, category }, author));
      await bringCategory(this.store, contextId, category, author);
      return true;
    }
    const item: Item = {
      ...created(this.ids.newId(), author),
      name: selected.name,
      defaultContextId: contextId,
      category: selected.category,
      createdVia: selected.fromQueue ? 'setup' : 'manual',
    };
    await this.store.save('items', item);
    await bringCategory(this.store, contextId, item.category, author);
    return true;
  }

  private nextOrder(contexts: readonly Context[]): number {
    return contexts.reduce((max, c) => Math.max(max, c.order + 1), 0);
  }

  private async change(contextId: string, changes: Partial<Omit<Context, 'id' | 'updatedAt' | 'updatedBy' | 'deletedAt'>>): Promise<void> {
    const context = await this.store.get('contexts', contextId);
    if (context && context.deletedAt === null) await this.store.save('contexts', changed(context, changes, await this.author()));
  }

  /** Saves the context's categories, written down from its suggestions and items the first time. */
  private async changeCategories(contextId: string, change: (current: readonly string[]) => Promise<readonly string[]>): Promise<void> {
    const context = await this.store.get('contexts', contextId);
    if (!context || context.deletedAt !== null) return;
    const current = contextCategories(context, await this.store.list('items'));
    const next = await change(current);
    if (context.categories && next.length === current.length && next.every((id, i) => id === current[i])) return;
    await this.store.save('contexts', changed(context, { categories: next }, await this.author()));
  }

  /** The items of this context with that category get another (null is "Outros"). */
  private async recategorize(contextId: string, from: string, to: string | null): Promise<void> {
    const author = await this.author();
    for (const item of await this.store.list('items')) {
      if (item.deletedAt === null && item.defaultContextId === contextId && item.category === from) {
        await this.store.save('items', changed(item, { category: to }, author));
      }
    }
  }

  private async author(): Promise<Author> {
    return { deviceId: await this.store.deviceId(), now: this.clock.now() };
  }
}

/**
 * An item that comes to a context brings its category: a context whose categories she already
 * edited gets it at the end (spec/modo-compra.md).
 */
export async function bringCategory(store: LocalStore, contextId: string | null, category: string | null, author: Author): Promise<void> {
  if (contextId === null || category === null) return;
  const context = await store.get('contexts', contextId);
  if (!context || context.deletedAt !== null || !context.categories || context.categories.includes(category)) return;
  await store.save('contexts', changed(context, { categories: [...context.categories, category] }, author));
}
