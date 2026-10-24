import { useState } from 'react';
import { findItemByName } from '../../domain/item';
import { catalogOf, contextName, listEntries, type Snapshot } from '../../domain/list-view';
import { nameKey } from '../../domain/text';
import { MoreIcon } from '../icons';
import { useServices } from '../services';
import { ItemSheet } from './ItemSheet';

/**
 * "Pelo catálogo": everything I usually buy in a context; a tap puts the item on the list or
 * takes it off, and the ones already on the list show checked (spec/itens-e-contextos.md). The
 * field filters the catalog, and enter puts a new name in it.
 */
export function Catalog({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null }) {
  const { lists } = useServices();
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const entries = listEntries(snapshot, contextId);
  const onList = new Map(entries.map((e) => [e.itemId, e]));
  const key = nameKey(filter);
  const items = catalogOf(snapshot.items, contextId).filter((i) => !key || nameKey(i.name).includes(key));
  const name = contextName(snapshot, contextId);

  async function toggle(itemId: string) {
    const entry = onList.get(itemId);
    if (entry) await lists.removeEntry(entry.id);
    else await lists.addItem(itemId, contextId);
  }

  async function addNew() {
    if (!filter.trim()) return;
    const existing = findItemByName(snapshot.items, filter);
    const item = existing ?? (await lists.addToCatalog(filter, contextId));
    setFilter('');
    if (item && !onList.has(item.id)) await lists.addItem(item.id, contextId);
  }

  return (
    <div className="catalog">
      <div className="field field--quiet">
        <input
          type="search"
          value={filter}
          placeholder={`Buscar ou pôr no catálogo de ${name}`}
          aria-label={`Buscar no catálogo de ${name}`}
          enterKeyHint="done"
          onChange={(event) => setFilter(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void addNew();
            }
          }}
        />
      </div>
      {items.length === 0 && (
        <p className="muted">{key ? `Enter põe “${filter.trim()}” no catálogo e na lista.` : `O catálogo de ${name} ainda está vazio.`}</p>
      )}
      <ul className="catalog__items">
        {items.map((item) => {
          const checked = onList.has(item.id);
          return (
            <li key={item.id} className="row">
              <button type="button" className="row__main" aria-pressed={checked} onClick={() => void toggle(item.id)}>
                <span className={checked ? 'check is-on' : 'check'} aria-hidden="true" />
                <span className="row__name">{item.name}</span>
              </button>
              <button type="button" className="icon-button" aria-label={`Detalhes de ${item.name}`} onClick={() => setDetail(item.id)}>
                <MoreIcon />
              </button>
            </li>
          );
        })}
      </ul>
      {detail && <ItemSheet snapshot={snapshot} itemId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
