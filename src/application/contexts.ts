import type { Context } from '../domain/context';
import { capitalize } from '../domain/entry-text';
import { findItemByName, type Item } from '../domain/item';
import { activeContexts } from '../domain/list-view';
import type { Selected } from '../domain/setup-capsules';
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
    await this.change(contextId, { categoryOrder: categoryOrder.filter((id): id is string => id !== null) });
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
      await this.store.save('items', changed(existing, { defaultContextId: contextId, category: existing.category ?? selected.category }, author));
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
    return true;
  }

  private nextOrder(contexts: readonly Context[]): number {
    return contexts.reduce((max, c) => Math.max(max, c.order + 1), 0);
  }

  private async change(contextId: string, changes: Partial<Omit<Context, 'id' | 'updatedAt' | 'updatedBy' | 'deletedAt'>>): Promise<void> {
    const context = await this.store.get('contexts', contextId);
    if (context && context.deletedAt === null) await this.store.save('contexts', changed(context, changes, await this.author()));
  }

  private async author(): Promise<Author> {
    return { deviceId: await this.store.deviceId(), now: this.clock.now() };
  }
}
