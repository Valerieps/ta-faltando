import { useState } from 'react';
import { itemContextIds } from '../../domain/item';
import { activeContexts, itemsWithoutContext, listEntries, type Snapshot } from '../../domain/list-view';
import { TrashIcon } from '../icons';
import { useServices } from '../services';
import { tata } from '../tata-lines';
import { Say } from './Say';

/**
 * The items with no active context: a tap on a context links the item, another tap unlinks it;
 * several can be selected and linked at once (spec/itens-e-contextos.md, "Itens sem contexto").
 * A linked item stays until the tab is left, so more than one context can be marked.
 */
export function Uncontexted({ snapshot, limit }: { snapshot: Snapshot; limit?: number }) {
  const { lists } = useServices();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [said, setSaid] = useState<string | null>(null);
  const [kept, setKept] = useState<ReadonlySet<string>>(new Set());
  const items = itemsWithoutContext(snapshot, kept);
  const contexts = activeContexts(snapshot.contexts);
  const onList = new Map(listEntries(snapshot, null).map((e) => [e.itemId, e.id]));
  const shown = limit === undefined ? items : items.slice(0, limit);

  async function link(itemIds: readonly string[], contextId: string) {
    setKept((now) => new Set([...now, ...itemIds]));
    await lists.linkItems(itemIds, contextId);
    const context = contexts.find((c) => c.id === contextId)!;
    const names = items.filter((i) => itemIds.includes(i.id)).map((i) => i.name);
    setSaid(names.length === 1 ? tata.linked(names[0], context.name) : tata.linked(`${names.length} itens`, context.name).replace(' vai ', ' vão '));
    setSelected(new Set([...selected].filter((id) => !itemIds.includes(id))));
  }

  if (items.length === 0) return <Say mood="happy">{said ?? tata.noneWithoutContext}</Say>;

  return (
    <div className="loose">
      {said && <Say>{said}</Say>}
      {contexts.length === 0 && <p className="muted">Crie um contexto para vincular estes itens.</p>}
      <ul className="loose__items">
        {shown.map((item) => (
          <li key={item.id} className="loose__item">
            <label className="loose__name">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(item.id);
                  else next.delete(item.id);
                  setSelected(next);
                }}
              />
              <span>{item.name}</span>
              {onList.has(item.id) && <span className="muted">na lista</span>}
            </label>
            {onList.has(item.id) && (
              <button type="button" className="icon-button trash" aria-label={`Tirar ${item.name} da lista`} onClick={() => void lists.removeEntry(onList.get(item.id)!)}>
                <TrashIcon />
              </button>
            )}
            <div className="chips chips--small">
              {contexts.map((c) => {
                const linked = itemContextIds(item).includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={linked ? 'chip is-on' : 'chip'}
                    aria-pressed={linked}
                    onClick={() => void (linked ? lists.setContextLinked(item.id, c.id, false) : link([item.id], c.id))}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {shown.length < items.length && <p className="muted">E mais {items.length - shown.length}.</p>}
      {selected.size > 1 && (
        <div className="loose__bulk">
          <span>Vincular {selected.size} itens a:</span>
          <div className="chips chips--small">
            {contexts.map((c) => (
              <button key={c.id} type="button" className="chip chip--solid" onClick={() => void link([...selected], c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
