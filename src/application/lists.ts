import { findItemByName, type Item } from '../domain/item';
import { pendingEntryFor, type ListEntry } from '../domain/list-entry';
import { created, deleted, type Author } from '../domain/synced-record';
import type { TableName } from '../domain/tables';
import { cleanName } from '../domain/text';
import type { Clock, IdGenerator, LocalStore } from './ports';

/** Use cases for the catalog and the lists (spec/itens-e-contextos.md). */
export class Lists {
  constructor(
    private readonly store: LocalStore,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /**
   * Puts an item on the list of its default context, or on "Sem contexto" when it has none. A
   * name not in the catalog enters it. An item already pending there is left as it is.
   */
  async add(name: string): Promise<ListEntry | null> {
    const clean = cleanName(name);
    if (!clean) return null;
    const author = await this.author();

    let item = findItemByName(await this.store.list('items'), clean);
    if (!item) {
      const newItem: Item = {
        ...created(this.ids.newId(), author),
        name: clean,
        defaultContextId: null,
        category: null,
        createdVia: 'manual',
      };
      await this.store.save('items', newItem);
      item = newItem;
    }

    const existing = pendingEntryFor(await this.store.list('listEntries'), item.id, item.defaultContextId);
    if (existing) return existing;

    const entry: ListEntry = {
      ...created(this.ids.newId(), author),
      itemId: item.id,
      contextId: item.defaultContextId,
      quantity: null,
      note: null,
      status: 'pending',
      addedAt: author.now,
      boughtAt: null,
    };
    await this.store.save('listEntries', entry);
    return entry;
  }

  /** Deletes a record; the tombstone carries the delete to the other device. */
  async remove(table: TableName, id: string): Promise<void> {
    const record = await this.store.get(table, id);
    if (!record || record.deletedAt !== null) return;
    await this.store.save(table, deleted(record, await this.author()));
  }

  private async author(): Promise<Author> {
    return { deviceId: await this.store.deviceId(), now: this.clock.now() };
  }
}
