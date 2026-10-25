import { useState } from 'react';
import { findItemByName, itemContextIds, type Item } from '../../domain/item';
import { catalogOf, contextName, pendingEntryOf, searchCatalog, type Snapshot } from '../../domain/list-view';
import { CartIcon, PencilIcon } from '../icons';
import { useServices } from '../services';
import { ContextPicker } from './ContextPicker';
import { ItemSheet } from './ItemSheet';

/**
 * "Pelo catálogo": everything I usually buy in a context; a tap puts the item on the list or
 * takes it off, and the ones already on the list show a filled cart (spec/itens-e-contextos.md).
 * The search on top looks in every context, and enter puts a new name in the open one.
 */
export function Catalog({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null }) {
  const { lists } = useServices();
  const [filter, setFilter] = useState('');
  const [detail, setDetail] = useState<string | null>(null);
  const searching = filter.trim() !== '';
  const items = searching ? searchCatalog(snapshot.items, filter) : catalogOf(snapshot, contextId);
  const name = contextName(snapshot, contextId);

  async function toggle(item: Item) {
    const entry = pendingEntryOf(snapshot, item.id);
    if (entry) await lists.removeEntry(entry.id);
    else await lists.addItem(item.id, searching ? undefined : contextId);
  }

  async function addNew() {
    if (!searching) return;
    const existing = findItemByName(snapshot.items, filter);
    const item = existing ?? (await lists.addToCatalog(filter, contextId));
    setFilter('');
    if (item && !pendingEntryOf(snapshot, item.id)) await lists.addItem(item.id, existing ? undefined : contextId);
  }

  const contextsOf = (item: Item) => itemContextIds(item).map((id) => contextName(snapshot, id)).join(', ') || contextName(snapshot, null);

  return (
    <div className="catalog">
      <div className="field field--quiet">
        <input
          type="search"
          value={filter}
          placeholder="Buscar em todos os contextos"
          aria-label="Buscar no catálogo"
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
      {!searching && <ContextPicker snapshot={snapshot} current={contextId} />}
      {items.length === 0 && (
        <p className="muted">{searching ? `Enter põe “${filter.trim()}” no catálogo de ${name} e na lista.` : `O catálogo de ${name} ainda está vazio.`}</p>
      )}
      <ul className="catalog__items">
        {items.map((item) => {
          const checked = pendingEntryOf(snapshot, item.id) !== undefined;
          return (
            <li key={item.id} className="row">
              <button type="button" className="row__main" aria-pressed={checked} onClick={() => void toggle(item)}>
                <span className={checked ? 'cart is-on' : 'cart'} aria-hidden="true">
                  <CartIcon />
                </span>
                <span className="row__name">
                  {item.name}
                  {searching && <span className="muted"> · {contextsOf(item)}</span>}
                </span>
              </button>
              <button type="button" className="icon-button" aria-label={`Editar ${item.name}`} onClick={() => setDetail(item.id)}>
                <PencilIcon />
              </button>
            </li>
          );
        })}
      </ul>
      {detail && <ItemSheet snapshot={snapshot} itemId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
