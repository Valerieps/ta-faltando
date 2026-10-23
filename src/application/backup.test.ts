import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../infrastructure/memory-store';
import { Backup, BACKUP_REMINDER_MS, backupDue, parseBackup } from './backup';
import { Lists } from './lists';

function setup(device = 'phone') {
  const store = new MemoryStore(device);
  let n = 0;
  let now = 1_000;
  const clock = { now: () => now++ };
  return { store, lists: new Lists(store, clock, { newId: () => `${device}-${++n}` }), backup: new Backup(store, clock) };
}

describe('Backup', () => {
  it('exports every table and reads the file back with its counts', async () => {
    const { lists, backup } = setup();
    await lists.add('leite');
    const file = await backup.exportFile();
    expect(file).toMatchObject({ formato: 'ta-faltando', versao: 1 });
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed).toMatchObject({ ok: true, counts: { contexts: 0, items: 1, listEntries: 1 } });
  });

  it('refuses a file that is not a backup, a broken one, or one from a newer app', () => {
    expect(parseBackup('não é json')).toMatchObject({ ok: false });
    expect(parseBackup('{"formato":"outro"}')).toMatchObject({ ok: false });
    expect(parseBackup('{"formato":"ta-faltando","versao":1,"tabelas":{"items":[{"nome":"x"}]}}')).toMatchObject({ ok: false });
    expect(parseBackup('{"formato":"ta-faltando","versao":99,"tabelas":{}}')).toMatchObject({ ok: false, error: expect.stringContaining('mais nova') });
  });

  it('importing replaces everything: what is not in the file is deleted, what is in it wins', async () => {
    const { store, lists, backup } = setup();
    const { item } = (await lists.add('leite'))!;
    const file = await backup.exportFile();
    await lists.renameItem(item.id, 'Leite zero');
    await lists.add('café');

    const parsed = parseBackup(JSON.stringify(file));
    if (!parsed.ok) throw new Error(parsed.error);
    await backup.importReplacing(parsed.backup);

    const items = await store.list('items');
    expect(items.map((i) => i.name)).toEqual(['Leite']);
    // The restored version is newer than the rename, so it also wins on the other device.
    const pending = await store.pendingChanges(100);
    expect(pending.find((c) => c.record.id === item.id)?.record.updatedAt).toBeGreaterThan(file.tabelas.items[0].updatedAt);
  });

  it('restores a record deleted after the backup', async () => {
    const { store, lists, backup } = setup();
    const { entry } = (await lists.add('ovos'))!;
    const file = await backup.exportFile();
    await lists.removeEntry(entry.id);
    await backup.importReplacing(file);
    expect((await store.get('listEntries', entry.id))?.deletedAt).toBeNull();
  });

  it('reminds once a month, counting from the first use until the first backup', () => {
    expect(backupDue(null, null, 0)).toBe(false);
    expect(backupDue(null, 0, BACKUP_REMINDER_MS - 1)).toBe(false);
    expect(backupDue(null, 0, BACKUP_REMINDER_MS)).toBe(true);
    expect(backupDue(BACKUP_REMINDER_MS, 0, BACKUP_REMINDER_MS + 5)).toBe(false);
  });
});
