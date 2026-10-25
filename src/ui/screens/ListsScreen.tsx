import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { contextCategories } from '../../domain/context-categories';
import { type ListEntry } from '../../domain/list-entry';
import { activeContexts, allLists, contextName, groupByCategory, itemsById, listEntries, listsByMissing, totalMissing, type Snapshot } from '../../domain/list-view';
import { AddField } from '../components/AddField';
import { BottomNav } from '../components/BottomNav';
import { ContextSheet } from '../components/ContextSheet';
import { ItemSheet } from '../components/ItemSheet';
import { Say } from '../components/Say';
import { GroupOrder, ShoppingRow } from '../components/ShoppingRows';
import { TopBar } from '../components/TopBar';
import { Uncontexted } from '../components/Uncontexted';
import { holdPlace, useFading, useSettling, withFading } from '../components/useFading';
import { CaretDownIcon, ChevronIcon, GroupIcon, PlusIcon } from '../icons';
import { ALL_LISTS, navigate } from '../router';
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
 * name opens a menu of "Todas as listas", the contexts and "Sem contexto", those with missing
 * items first; the menu also edits the open context and creates a new one
 * (spec/itens-e-contextos.md, "Tela das listas").
 */
export function ListsScreen({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  return contextId === ALL_LISTS ? <AllLists snapshot={snapshot} /> : <OneList snapshot={snapshot} contextId={contextId} />;
}

/** One list: a context's, or "Sem contexto". */
function OneList({ snapshot, contextId: requested }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const { lists, contexts: contextUseCases } = useServices();
  const contexts = activeContexts(snapshot.contexts);
  const contextId = requested === undefined || (requested !== null && !contexts.some((c) => c.id === requested)) ? (contexts[0]?.id ?? null) : requested;
  const context = contexts.find((c) => c.id === contextId);
  const { fading, rows, sheet } = useShoppingRows(snapshot);
  const [editing, setEditing] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [collapsed, toggleGroup] = useCollapsed();

  useEffect(() => {
    if (contextId === null) return;
    return holdList(contextId, (id) => void lists.finishPurchase([id]));
  }, [contextId, lists]);

  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
  const items = itemsById(snapshot.items);
  const name = contextName(snapshot, contextId);

  const catalogLink = (
    <button type="button" className="link-button" onClick={() => navigate({ name: 'catalog', contextId })}>
      Abrir o catálogo de {name}
    </button>
  );

  return (
    <main className="screen lists">
      <TopBar />
      <ListHead snapshot={snapshot} current={contextId} title={name} onEdit={context ? () => setEditing(true) : undefined}>
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
      </ListHead>

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
      {sheet}
    </main>
  );
}

/**
 * "Todas as listas": every list on one screen, one section per context like a category group,
 * those with missing items first. The + beside a context's name opens a field whose items go to
 * that context's catalog and list. Leaving the screen takes the struck items out of every list.
 */
function AllLists({ snapshot }: { snapshot: Snapshot }) {
  const { lists } = useServices();
  const { fading, rows, sheet } = useShoppingRows(snapshot);
  const [collapsed, toggleGroup] = useCollapsed();
  const [adding, setAdding] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return holdList(ALL_LISTS, () => void lists.snapshot().then((now) => lists.finishPurchase([...activeContexts(now.contexts).map((c) => c.id), null])));
  }, [lists]);

  function openField(contextId: string) {
    // Rendered and focused inside the tap, so the phone opens the keyboard.
    flushSync(() => setAdding(contextId));
    input.current?.focus();
  }

  return (
    <main className="screen lists">
      <TopBar />
      <ListHead snapshot={snapshot} current={ALL_LISTS} title="Todas as listas" />

      <div className="lists__body">
        {allLists(snapshot).map(({ contextId, missing }) => {
          const id = contextId ?? 'sem-contexto';
          const name = contextName(snapshot, contextId);
          const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]);
          const groupOpen = !collapsed.has(id);
          return (
            <section key={id} className="group">
              <div className="group__bar">
                <button type="button" className="group__head" aria-expanded={groupOpen} onClick={() => toggleGroup(id)}>
                  <ChevronIcon open={groupOpen} />
                  <span className="label">{name}</span>
                  <span className="count count--quiet">{missing}</span>
                </button>
                {contextId !== null && (
                  <button type="button" className="pill pill--icon" aria-label={`Anotar em ${name}`} title={`Anotar em ${name}`} onClick={() => openField(contextId)}>
                    <PlusIcon />
                  </button>
                )}
              </div>
              {contextId !== null && adding === contextId && (
                <div
                  className="group__add"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAdding(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setAdding(null);
                  }}
                >
                  <AddField snapshot={snapshot} onAdded={() => undefined} opens="down" inputRef={input} into={contextId} placeholder={`Anotar em ${name}`} />
                </div>
              )}
              {groupOpen && entries.length > 0 && rows(entries)}
            </section>
          );
        })}
      </div>

      <BottomNav current="lists" snapshot={snapshot} />
      {sheet}
    </main>
  );
}

/** The groups closed on screen, and the toggle that opens or closes one. */
function useCollapsed(): [ReadonlySet<string>, (id: string) => void] {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };
  return [collapsed, toggle];
}

/** The shopping rows: striking, buying and fading them, and the item sheet a row opens. */
function useShoppingRows(snapshot: Snapshot) {
  const { lists, haptic } = useServices();
  const { hand } = useSettings();
  const { fading, fade, undo } = useFading();
  const { settling, settle, release } = useSettling();
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const items = itemsById(snapshot.items);

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
  const sheet = open && <ItemSheet snapshot={snapshot} itemId={open.itemId} entryId={open.entryId} onClose={() => setOpen(null)} onRemoveEntry={trash} />;
  return { fading, rows, sheet };
}

/** The list's name, which opens the menu of lists, with the buttons that sit beside it. */
function ListHead({ snapshot, current, title, onEdit, children }: { snapshot: Snapshot; current: string | null; title: string; onEdit?: () => void; children?: ReactNode }) {
  const [choosing, setChoosing] = useState(false);
  return (
    <header className="screen__head">
      <button type="button" className="list-picker" aria-haspopup="menu" aria-expanded={choosing} onClick={() => setChoosing(!choosing)}>
        <h1 className="title">{title}</h1>
        <CaretDownIcon />
      </button>
      {children}
      {choosing && <ListMenu snapshot={snapshot} current={current} onClose={() => setChoosing(false)} onEdit={onEdit} />}
    </header>
  );
}

/**
 * The list picker's menu: "Todas as listas" first, then the lists with missing items, then the
 * empty ones, each with its count; below them, editing the open context and creating a new one.
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
        <button
          type="button"
          role="menuitemradio"
          aria-checked={current === ALL_LISTS}
          autoFocus
          className={current === ALL_LISTS ? 'list-menu__item is-on' : 'list-menu__item'}
          onClick={() => go(ALL_LISTS)}
        >
          <span>Todas as listas</span>
          <span className="count">{totalMissing(snapshot)}</span>
        </button>
        {ordered.map(({ contextId: id, missing: count }, index) => (
          <button
            key={id ?? 'none'}
            type="button"
            role="menuitemradio"
            aria-checked={id === current}
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
