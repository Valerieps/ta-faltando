import { useState } from 'react';
import { activeContexts, contextName, itemsById, listEntries, listsByMissing, type Snapshot } from '../../domain/list-view';
import { BottomNav } from '../components/BottomNav';
import { ContextSheet } from '../components/ContextSheet';
import { ItemSheet } from '../components/ItemSheet';
import { ListRows } from '../components/ListRows';
import { Say } from '../components/Say';
import { TopBar } from '../components/TopBar';
import { Uncontexted } from '../components/Uncontexted';
import { useFading, withFading } from '../components/useFading';
import { CartIcon, CaretDownIcon, PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices } from '../services';
import { tata } from '../tata-lines';

/**
 * The phone's lists: the list's name opens a menu of the contexts plus "Sem contexto", those with
 * missing items first; no gestures and no striking here, only the trash
 * (spec/itens-e-contextos.md, "Tela das listas"). The menu also edits the open context and creates
 * a new one, and the big button enters shopping mode in it.
 */
export function ListsScreen({ snapshot, contextId: requested }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const { lists, contexts: contextUseCases } = useServices();
  const contexts = activeContexts(snapshot.contexts);
  const contextId = requested === undefined || (requested !== null && !contexts.some((c) => c.id === requested)) ? (contexts[0]?.id ?? null) : requested;
  const context = contexts.find((c) => c.id === contextId);
  const { fading, fade, undo } = useFading();
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
  const items = itemsById(snapshot.items);
  const name = contextName(snapshot, contextId);
  const trash = (entryId: string) => {
    const entry = snapshot.entries.find((e) => e.id === entryId);
    if (entry) void fade(entry, () => lists.removeEntry(entry.id));
  };

  return (
    <main className="screen lists">
      <TopBar />
      <header className="screen__head">
        <button
          type="button"
          className="list-picker"
          aria-haspopup="menu"
          aria-expanded={choosing}
          onClick={() => setChoosing(!choosing)}
        >
          <h1 className="title">{name}</h1>
          <CaretDownIcon />
        </button>
        {context && (
          <label className="switch list-head__switch">
            <input type="checkbox" checked={context.groupByCategory} onChange={(event) => void contextUseCases.setGroupByCategory(context.id, event.target.checked)} />
            <span>Agrupar por categoria</span>
          </label>
        )}
        {choosing && (
          <ListMenu
            snapshot={snapshot}
            current={contextId}
            onClose={() => setChoosing(false)}
            onEdit={context ? () => setEditing(true) : undefined}
          />
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

      {context && (
        <div className="reach">
          <button type="button" className="btn btn--icon" onClick={() => navigate({ name: 'shop', contextId: context.id })}>
            <CartIcon /> Comprar no {name}
          </button>
        </div>
      )}
      <BottomNav current="lists" contextId={contextId} />

      {editing && context && <ContextSheet context={context} snapshot={snapshot} onClose={() => setEditing(false)} />}
      {open && <ItemSheet snapshot={snapshot} itemId={open.itemId} entryId={open.entryId} onClose={() => setOpen(null)} onRemoveEntry={trash} />}
    </main>
  );
}

/**
 * The list picker's menu: the lists with missing items on top, then the empty ones, each with
 * its count; below them, editing the open context and creating a new one.
 */
function ListMenu({ snapshot, current, onClose, onEdit }: { snapshot: Snapshot; current: string | null; onClose: () => void; onEdit?: () => void }) {
  const { contexts: contextUseCases } = useServices();
  const [adding, setAdding] = useState(false);
  const ordered = listsByMissing(snapshot);
  const go = (contextId: string | null) => {
    onClose();
    navigate({ name: 'lists', contextId }, { replace: true });
  };

  return (
    <>
      <div className="list-menu__backdrop" aria-hidden="true" onClick={onClose} />
      <div className="list-menu" role="menu" aria-label="Listas" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
        {ordered.map(({ contextId: id, missing: count }, index) => (
          <button
            key={id ?? 'none'}
            type="button"
            role="menuitemradio"
            aria-checked={id === current}
            autoFocus={index === 0}
            className={[
              'list-menu__item',
              id === current ? 'is-on' : '',
              count === 0 && index > 0 && (ordered[index - 1]?.missing ?? 0) > 0 ? 'list-menu__item--split' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => go(id)}
          >
            <span>{contextName(snapshot, id)}</span>
            <span className={count === 0 ? 'count count--quiet' : 'count'}>{count}</span>
          </button>
        ))}
        <div className="list-menu__actions">
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              className="list-menu__item"
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              Editar {contextName(snapshot, current)}
            </button>
          )}
          {adding ? (
            <input
              className="list-menu__input"
              aria-label="Nome do novo contexto"
              placeholder="Novo contexto"
              autoFocus
              enterKeyHint="done"
              onBlur={(event) => {
                const newName = event.target.value.trim();
                setAdding(false);
                if (newName) void contextUseCases.create(newName).then((created) => created && go(created.id));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.currentTarget.blur();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  event.currentTarget.value = '';
                  setAdding(false);
                }
              }}
            />
          ) : (
            <button type="button" role="menuitem" className="list-menu__item list-menu__item--add" onClick={() => setAdding(true)}>
              <PlusIcon /> Novo contexto
            </button>
          )}
        </div>
      </div>
    </>
  );
}
