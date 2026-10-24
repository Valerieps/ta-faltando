import { useEffect, useState } from 'react';
import { contextCategories } from '../../domain/context-categories';
import { type ListEntry } from '../../domain/list-entry';
import { activeContexts, contextName, groupByCategory, itemsById, listEntries, listsByMissing, type Snapshot } from '../../domain/list-view';
import { BottomNav } from '../components/BottomNav';
import { ContextSheet } from '../components/ContextSheet';
import { ItemSheet } from '../components/ItemSheet';
import { Say } from '../components/Say';
import { GroupOrder, ShoppingRow } from '../components/ShoppingRows';
import { TopBar } from '../components/TopBar';
import { Uncontexted } from '../components/Uncontexted';
import { holdPlace, useFading, useSettling, withFading } from '../components/useFading';
import { CaretDownIcon, ChevronIcon, GroupIcon, PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices, useSettings } from '../services';
import type { SwipeAction } from '../shopping-gestures';
import { tata } from '../tata-lines';

// The list whose struck items leave once the screen lets go of it.
let leaving: { contextId: string; timer: ReturnType<typeof setTimeout> } | null = null;

/**
 * Holds a list while it is open; the returned release calls `finish` for it on the next tick,
 * unless the same list is held again first (React's StrictMode remounts at once).
 */
export function holdList(contextId: string, finish: (contextId: string) => void): () => void {
  if (leaving?.contextId === contextId) clearTimeout(leaving.timer);
  return () => {
    leaving = { contextId, timer: setTimeout(() => finish(contextId)) };
  };
}

/**
 * The phone's lists, used inside the store too (spec/modo-compra.md): the circle and the swipes
 * strike items and count them as bought; leaving a list takes its struck items out. The list's
 * name opens a menu of the contexts plus "Sem contexto", those with missing items first; the menu
 * also edits the open context and creates a new one (spec/itens-e-contextos.md, "Tela das listas").
 */
export function ListsScreen({ snapshot, contextId: requested }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const { lists, contexts: contextUseCases, haptic } = useServices();
  const { hand } = useSettings();
  const contexts = activeContexts(snapshot.contexts);
  const contextId = requested === undefined || (requested !== null && !contexts.some((c) => c.id === requested)) ? (contexts[0]?.id ?? null) : requested;
  const context = contexts.find((c) => c.id === contextId);
  const { fading, fade, undo } = useFading();
  const { settling, settle, release } = useSettling();
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (contextId === null) return;
    return holdList(contextId, (id) => void lists.finishPurchase([id]));
  }, [contextId, lists]);

  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
  const items = itemsById(snapshot.items);
  const name = contextName(snapshot, contextId);
  const trash = (entryId: string) => {
    const entry = snapshot.entries.find((e) => e.id === entryId);
    if (entry) void fade(entry, () => lists.removeEntry(entry.id));
  };

  async function act(entry: ListEntry, action: SwipeAction) {
    switch (action) {
      case 'check':
        haptic();
        settle(entry.id);
        return lists.setChecked(entry.id, true);
      case 'uncheck':
        release(entry.id);
        return lists.setChecked(entry.id, false);
      case 'buy':
        return fade(entry, () => lists.markBought(entry.id));
      case 'undo':
        return undo(entry.id);
    }
  }

  const toggleGroup = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };
  const rowProps = {
    items,
    hand,
    fading,
    onAction: act,
    onOpen: (entry: ListEntry) => setOpen({ itemId: entry.itemId, entryId: entry.id }),
    onUndo: (id: string) => void act(fading.get(id)!, 'undo'),
  };
  const rows = (list: readonly ListEntry[]) => (
    <ul className="rows">
      {holdPlace(list, settling).map((entry) => (
        <ShoppingRow key={entry.id} entry={entry} {...rowProps} />
      ))}
    </ul>
  );

  const catalogLink = (
    <button type="button" className="link-button" onClick={() => navigate({ name: 'catalog', contextId })}>
      Abrir o catálogo de {name}
    </button>
  );

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
          <button
            type="button"
            className={context.groupByCategory ? 'pill pill--icon list-head__switch is-on' : 'pill pill--icon list-head__switch'}
            aria-label="Agrupar por categoria"
            aria-pressed={context.groupByCategory}
            onClick={() => void contextUseCases.setGroupByCategory(context.id, !context.groupByCategory)}
          >
            <GroupIcon />
          </button>
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
            {catalogLink}
          </div>
        ) : context?.groupByCategory ? (
          <>
            {groupByCategory(entries, items, contextCategories(context, snapshot.items)).map((group) => {
              const id = group.categoryId ?? 'outros';
              const groupOpen = !collapsed.has(id);
              return (
                <section key={id} className="group">
                  <button type="button" className="group__head" aria-expanded={groupOpen} onClick={() => toggleGroup(id)}>
                    <ChevronIcon open={groupOpen} />
                    <span className="label">{group.name}</span>
                    <span className="count count--quiet">{group.missing}</span>
                  </button>
                  {groupOpen && rows(group.entries)}
                </section>
              );
            })}
            <button type="button" className="link-button" onClick={() => setOrdering(true)}>
              Arrumar a ordem dos grupos
            </button>
            {catalogLink}
          </>
        ) : (
          <>
            {rows(entries)}
            {catalogLink}
          </>
        )}
      </div>

      <BottomNav current="lists" contextId={contextId} snapshot={snapshot} />

      {editing && context && <ContextSheet context={context} snapshot={snapshot} onClose={() => setEditing(false)} />}
      {ordering && context && <GroupOrder context={context} categories={contextCategories(context, snapshot.items)} onClose={() => setOrdering(false)} />}
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
