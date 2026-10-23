import { useEffect, useRef, useState } from 'react';
import { activeContexts, contextName, itemsById, listEntries, missingCount, type Snapshot } from '../../domain/list-view';
import { ItemSheet } from '../components/ItemSheet';
import { ListRows } from '../components/ListRows';
import { Say } from '../components/Say';
import { Uncontexted } from '../components/Uncontexted';
import { useFading, withFading } from '../components/useFading';
import { PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices } from '../services';
import { tata } from '../tata-lines';

/**
 * The phone's lists: a tab per context plus "Sem contexto", near the thumb; no gestures and no
 * striking here, only the trash (spec/itens-e-contextos.md, "Tela das listas").
 */
export function ListsScreen({ snapshot, contextId: requested }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const { lists, contexts: contextUseCases } = useServices();
  const contexts = activeContexts(snapshot.contexts);
  const contextId = requested === undefined || (requested !== null && !contexts.some((c) => c.id === requested)) ? (contexts[0]?.id ?? null) : requested;
  const context = contexts.find((c) => c.id === contextId);
  const { fading, fade, undo } = useFading();
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const activeTab = useRef<HTMLButtonElement>(null);

  useEffect(() => activeTab.current?.scrollIntoView({ inline: 'center', block: 'nearest' }), [contextId]);

  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
  const items = itemsById(snapshot.items);
  const name = contextName(snapshot, contextId);
  const trash = (entryId: string) => {
    const entry = snapshot.entries.find((e) => e.id === entryId);
    if (entry) void fade(entry, () => lists.removeEntry(entry.id));
  };

  return (
    <main className="screen lists">
      <h1 className="title">{name}</h1>

      <div className="lists__body">
        {contextId === null ? (
          <Uncontexted snapshot={snapshot} />
        ) : entries.length === 0 ? (
          <div className="empty">
            <Say mood="happy">{tata.emptyList(name)}</Say>
            <button type="button" className="link-button" onClick={() => navigate({ name: 'catalog', contextId })}>
              Abrir o catálogo de {name}
            </button>
          </div>
        ) : (
          <ListRows
            entries={entries}
            items={items}
            context={context}
            grouped={context?.groupByCategory ?? false}
            fading={fading}
            onTrash={(entry) => trash(entry.id)}
            onUndo={(id) => void undo(id)}
            onOpen={(entry) => setOpen({ itemId: entry.itemId, entryId: entry.id })}
          />
        )}
      </div>

      <div className="lists__controls">
        {context && (
          <div className="reach reach--quiet">
            <button type="button" className="link-button" onClick={() => navigate({ name: 'catalog', contextId: context.id })}>
              Catálogo
            </button>
            <label className="switch">
              <input type="checkbox" checked={context.groupByCategory} onChange={(event) => void contextUseCases.setGroupByCategory(context.id, event.target.checked)} />
              <span>Agrupar por categoria</span>
            </label>
          </div>
        )}
        <nav className="tabs" aria-label="Listas">
          {[...contexts.map((c) => c.id), null].map((id) => {
            const on = id === contextId;
            const count = missingCount(snapshot, id);
            return (
              <button
                key={id ?? 'none'}
                ref={on ? activeTab : undefined}
                type="button"
                className={on ? 'tab is-on' : 'tab'}
                aria-current={on ? 'page' : undefined}
                onClick={() => navigate({ name: 'lists', contextId: id }, { replace: true })}
              >
                {contextName(snapshot, id)} <span className={on || count === 0 ? 'count' : 'count count--quiet'}>{count}</span>
              </button>
            );
          })}
        </nav>
        <div className="reach">
          <button type="button" className="pill" onClick={() => navigate({ name: 'contexts' })}>
            Contextos
          </button>
          <button type="button" className="pill pill--icon" aria-label="Anotar" onClick={() => navigate({ name: 'home' })}>
            <PlusIcon />
          </button>
          <button type="button" className="btn" disabled={!context} onClick={() => context && navigate({ name: 'shop', contextId: context.id })}>
            Comprar
          </button>
        </div>
      </div>

      {open && <ItemSheet snapshot={snapshot} itemId={open.itemId} entryId={open.entryId} onClose={() => setOpen(null)} onRemoveEntry={trash} />}
    </main>
  );
}
