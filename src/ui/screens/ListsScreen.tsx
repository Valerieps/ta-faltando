import { useEffect, useRef, useState } from 'react';
import { activeContexts, contextName, itemsById, listEntries, missingCount, type Snapshot } from '../../domain/list-view';
import { AddChip } from '../components/AddChip';
import { BottomNav } from '../components/BottomNav';
import { ContextSheet } from '../components/ContextSheet';
import { ItemSheet } from '../components/ItemSheet';
import { ListRows } from '../components/ListRows';
import { Say } from '../components/Say';
import { Uncontexted } from '../components/Uncontexted';
import { useFading, withFading } from '../components/useFading';
import { CartIcon, PencilIcon, PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices } from '../services';
import { tata } from '../tata-lines';

/**
 * The phone's lists: a tab per context plus "Sem contexto", near the thumb; no gestures and no
 * striking here, only the trash (spec/itens-e-contextos.md, "Tela das listas"). The pencil by
 * the name edits the context, the big button enters shopping mode in it, and the round + on the
 * thumb's side opens the capture.
 */
export function ListsScreen({ snapshot, contextId: requested }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const { lists, contexts: contextUseCases } = useServices();
  const contexts = activeContexts(snapshot.contexts);
  const contextId = requested === undefined || (requested !== null && !contexts.some((c) => c.id === requested)) ? (contexts[0]?.id ?? null) : requested;
  const context = contexts.find((c) => c.id === contextId);
  const { fading, fade, undo } = useFading();
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const activeTab = useRef<HTMLButtonElement>(null);

  // Braces: Chrome's scrollIntoView returns a Promise, and an effect may only return a cleanup.
  useEffect(() => {
    activeTab.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [contextId]);

  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
  const items = itemsById(snapshot.items);
  const name = contextName(snapshot, contextId);
  const trash = (entryId: string) => {
    const entry = snapshot.entries.find((e) => e.id === entryId);
    if (entry) void fade(entry, () => lists.removeEntry(entry.id));
  };

  return (
    <main className="screen lists">
      <header className="screen__head">
        <h1 className="title">{name}</h1>
        {context && (
          <button type="button" className="icon-button" aria-label={`Editar ${name}`} title="Editar o contexto" onClick={() => setEditing(true)}>
            <PencilIcon />
          </button>
        )}
      </header>

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
          <AddChip
            label="Novo contexto"
            onAdd={async (newName) => {
              const created = await contextUseCases.create(newName);
              if (created) navigate({ name: 'lists', contextId: created.id }, { replace: true });
            }}
          />
        </nav>
        <div className="reach">
          {context && (
            <button type="button" className="btn btn--icon" onClick={() => navigate({ name: 'shop', contextId: context.id })}>
              <CartIcon /> Comprar no {name}
            </button>
          )}
          <button type="button" className="fab" aria-label="Anotar" title="Anotar" onClick={() => navigate({ name: 'capture' })}>
            <PlusIcon />
          </button>
        </div>
      </div>
      <BottomNav current="lists" contextId={contextId} />

      {editing && context && <ContextSheet context={context} snapshot={snapshot} onClose={() => setEditing(false)} />}
      {open && <ItemSheet snapshot={snapshot} itemId={open.itemId} entryId={open.entryId} onClose={() => setOpen(null)} onRemoveEntry={trash} />}
    </main>
  );
}
