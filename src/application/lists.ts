import { parseEntryText, type EntryText } from '../domain/entry-text';
import { findItemByName, type Item, type ItemOrigin } from '../domain/item';
import { pendingEntryFor, type ListEntry } from '../domain/list-entry';
import { destinationFor, listEntries, type Snapshot } from '../domain/list-view';
import { changed, created, deleted, type Author } from '../domain/synced-record';
import type { TableName } from '../domain/tables';
import type { ChangeOrigin, Clock, IdGenerator, LocalStore } from './ports';

/** What happened when an item was added, so Tatá can say it (identity draft). */
export interface AddResult {
  readonly entry: ListEntry;
  readonly item: Item;
  /** "already": it was on the list and stays as it was; "updated": same, with the new quantity or note. */
  readonly outcome: 'added' | 'already' | 'updated';
}

/** Use cases for the catalog and the lists (spec/itens-e-contextos.md, spec/modo-compra.md). */
export class Lists {
  constructor(
    private readonly store: LocalStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /** Everything the screens show, read in one go. */
  async snapshot(): Promise<Snapshot> {
    const [contexts, items, entries] = await Promise.all([
      this.store.list('contexts'),
      this.store.list('items'),
      this.store.list('listEntries'),
    ]);
    return { contexts, items, entries };
  }

  onChange(listener: (origin: ChangeOrigin) => void): () => void {
    return this.store.onChange(listener);
  }

  /**
   * Puts an item on the list of its default context, or on "Sem contexto" when it has none
   * ("2 leite: sem lactose" brings quantity and note). A name not in the catalog enters it, with
   * the context of its setup suggestion if there is one. An item already pending there stays as
   * it is; a new quantity or note given in the text replaces the old one.
   */
  async add(text: string | EntryText, via: ItemOrigin = 'manual', chosenContextId?: string | null): Promise<AddResult | null> {
    const parsed = typeof text === 'string' ? parseEntryText(text) : text;
    if (!parsed.name) return null;
    const author = await this.author();
    const snapshot = await this.snapshot();
    const destination = destinationFor(snapshot, parsed.name);
    const contextId = chosenContextId === undefined ? destination.contextId : chosenContextId;

    let item = destination.item;
    if (!item) {
      item = {
        ...created(this.ids.newId(), author),
        name: parsed.name,
        defaultContextId: contextId,
        category: destination.category,
        createdVia: via,
      };
      await this.store.save('items', item);
    } else if (contextId !== destination.contextId) {
      await this.changeItem(item.id, { defaultContextId: contextId }, author);
      item = { ...item, defaultContextId: contextId };
    }
    return this.putOnList(snapshot, item, contextId, parsed, author);
  }

  /**
   * Adds several items at once (batch and voice), after the owner checked them. A context she
   * picked in the check (`contextIds[i]`, when not undefined) becomes the item's default context.
   */
  async addMany(texts: readonly EntryText[], via: ItemOrigin, contextIds: readonly (string | null | undefined)[] = []): Promise<AddResult[]> {
    const results: AddResult[] = [];
    for (const [i, text] of texts.entries()) {
      const result = await this.add(text, via, contextIds[i]);
      if (result) results.push(result);
    }
    return results;
  }

  /** Adds a catalog item to its list ("pelo catálogo"). */
  async addItem(itemId: string): Promise<AddResult | null> {
    const item = await this.store.get('items', itemId);
    if (!item || item.deletedAt !== null) return null;
    const snapshot = await this.snapshot();
    return this.putOnList(snapshot, item, destinationFor(snapshot, item.name).contextId, { name: item.name, quantity: null, note: null }, await this.author());
  }

  /** Puts a name in the catalog of a context without adding it to the list. */
  async addToCatalog(name: string, contextId: string | null): Promise<Item | null> {
    const parsed = parseEntryText(name);
    if (!parsed.name) return null;
    const existing = findItemByName(await this.store.list('items'), parsed.name);
    if (existing) return existing;
    const item: Item = {
      ...created(this.ids.newId(), await this.author()),
      name: parsed.name,
      defaultContextId: contextId,
      category: destinationFor(await this.snapshot(), parsed.name).category,
      createdVia: 'manual',
    };
    await this.store.save('items', item);
    return item;
  }

  /** Strikes or unstrikes an entry; it leaves the list when the purchase is finished. */
  async setChecked(entryId: string, checked: boolean): Promise<void> {
    await this.changeEntry(entryId, async (_entry, author) => ({ checkedAt: checked ? author.now : null }));
  }

  /** Counts an entry as bought and takes it off the list right away (the second swipe). */
  async markBought(entryId: string): Promise<void> {
    await this.changeEntry(entryId, async (entry, author) => ({ status: 'bought', boughtAt: author.now, checkedAt: entry.checkedAt ?? author.now }));
  }

  /** Takes an entry off the list without counting it as bought (the trash). */
  async removeEntry(entryId: string): Promise<void> {
    await this.remove('listEntries', entryId);
  }

  /** Puts an entry back as it was before a swipe or the trash ("Desfazer"). */
  async restoreEntry(previous: ListEntry): Promise<void> {
    const current = await this.store.get('listEntries', previous.id);
    if (!current) return;
    const { status, boughtAt, checkedAt = null, contextId, quantity, note } = previous;
    const next = changed(current, { status, boughtAt, checkedAt, contextId, quantity, note }, await this.author());
    await this.store.save('listEntries', { ...next, deletedAt: previous.deletedAt });
  }

  /**
   * "Finalizar compra": the struck entries of these lists count as bought and leave them; the
   * others stay for next time. Returns how many left.
   */
  async finishPurchase(contextIds: readonly (string | null)[]): Promise<number> {
    const snapshot = await this.snapshot();
    const author = await this.author();
    const struck = contextIds.flatMap((id) => listEntries(snapshot, id)).filter((e) => e.checkedAt != null);
    for (const entry of struck) {
      await this.store.save('listEntries', changed(entry, { status: 'bought', boughtAt: author.now }, author));
    }
    return struck.length;
  }

  async updateEntry(entryId: string, changes: { quantity: number | null; note: string | null }): Promise<void> {
    await this.changeEntry(entryId, async () => changes);
  }

  /**
   * Moves an entry to another list, "só daquela vez" or as the item's new default context. If the
   * item is already pending there, this entry leaves instead (one pending entry per list).
   */
  async moveEntry(entryId: string, contextId: string | null, asDefault: boolean): Promise<void> {
    const entry = await this.store.get('listEntries', entryId);
    if (!entry || entry.deletedAt !== null) return;
    const author = await this.author();
    if (asDefault) await this.changeItem(entry.itemId, { defaultContextId: contextId }, author);
    if (entry.contextId === contextId) return;
    if (pendingEntryFor(await this.store.list('listEntries'), entry.itemId, contextId)) {
      await this.store.save('listEntries', deleted(entry, author));
    } else {
      await this.store.save('listEntries', changed(entry, { contextId }, author));
    }
  }

  async setCategory(itemId: string, category: string | null): Promise<void> {
    await this.changeItem(itemId, { category }, await this.author());
  }

  async renameItem(itemId: string, name: string): Promise<void> {
    const parsed = parseEntryText(name);
    if (parsed.name) await this.changeItem(itemId, { name: parsed.name }, await this.author());
  }

  /**
   * Gives these items a default context and moves them, from "Sem contexto", to its list
   * (spec/itens-e-contextos.md, "Itens sem contexto").
   */
  async linkItems(itemIds: readonly string[], contextId: string): Promise<void> {
    const author = await this.author();
    const snapshot = await this.snapshot();
    const orphans = listEntries(snapshot, null);
    for (const itemId of itemIds) {
      await this.changeItem(itemId, { defaultContextId: contextId }, author);
      for (const entry of orphans.filter((e) => e.itemId === itemId)) {
        await this.store.save('listEntries', changed(entry, { contextId }, author));
      }
    }
  }

  /**
   * Changes an item's default context in the catalog; if it is pending on the list of its old
   * context, it moves along.
   */
  async setDefaultContext(itemId: string, contextId: string | null): Promise<void> {
    const item = await this.store.get('items', itemId);
    if (!item || item.deletedAt !== null || item.defaultContextId === contextId) return;
    const entry = listEntries(await this.snapshot(), item.defaultContextId).find((e) => e.itemId === itemId);
    if (entry) await this.moveEntry(entry.id, contextId, true);
    else await this.changeItem(itemId, { defaultContextId: contextId }, await this.author());
  }

  /** Takes an item out of the catalog, and off every list. */
  async removeItem(itemId: string): Promise<void> {
    const author = await this.author();
    for (const entry of (await this.store.list('listEntries')).filter((e) => e.itemId === itemId && e.status === 'pending')) {
      await this.store.save('listEntries', deleted(entry, author));
    }
    await this.remove('items', itemId);
  }

  /** Deletes a record; the tombstone carries the delete to the other device. */
  async remove(table: TableName, id: string): Promise<void> {
    const record = await this.store.get(table, id);
    if (!record || record.deletedAt !== null) return;
    await this.store.save(table, deleted(record, await this.author()));
  }

  private async putOnList(snapshot: Snapshot, item: Item, contextId: string | null, text: EntryText, author: Author): Promise<AddResult> {
    const existing = pendingEntryFor(snapshot.entries, item.id, contextId);
    if (existing) {
      const quantity = text.quantity ?? existing.quantity;
      const note = text.note ?? existing.note;
      if (quantity === existing.quantity && note === existing.note) return { entry: existing, item, outcome: 'already' };
      const entry = changed(existing, { quantity, note }, author);
      await this.store.save('listEntries', entry);
      return { entry, item, outcome: 'updated' };
    }
    const entry: ListEntry = {
      ...created(this.ids.newId(), author),
      itemId: item.id,
      contextId,
      quantity: text.quantity,
      note: text.note,
      status: 'pending',
      addedAt: author.now,
      boughtAt: null,
      checkedAt: null,
    };
    await this.store.save('listEntries', entry);
    return { entry, item, outcome: 'added' };
  }

  private async changeEntry(
    entryId: string,
    changes: (entry: ListEntry, author: Author) => Promise<Partial<Omit<ListEntry, 'id' | 'updatedAt' | 'updatedBy' | 'deletedAt'>>>,
  ): Promise<void> {
    const entry = await this.store.get('listEntries', entryId);
    if (!entry || entry.deletedAt !== null) return;
    const author = await this.author();
    await this.store.save('listEntries', changed(entry, await changes(entry, author), author));
  }

  private async changeItem(itemId: string, changes: Partial<Pick<Item, 'name' | 'defaultContextId' | 'category'>>, author: Author): Promise<void> {
    const item = await this.store.get('items', itemId);
    if (item && item.deletedAt === null) await this.store.save('items', changed(item, changes, author));
  }

  private async author(): Promise<Author> {
    return { deviceId: await this.store.deviceId(), now: this.clock.now() };
  }
}
