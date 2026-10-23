import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Hand } from '../../application/settings';
import type { Context } from '../../domain/context';
import { entryDetails } from '../../domain/entry-text';
import { isChecked, type ListEntry } from '../../domain/list-entry';
import { contextCategories } from '../../domain/context-categories';
import { groupByCategory, itemsById, listEntries, type Snapshot } from '../../domain/list-view';
import { categoryName } from '../../domain/suggestion';
import { nameKey } from '../../domain/text';
import { Say } from '../components/Say';
import { useFading, withFading } from '../components/useFading';
import { BackIcon, ChevronIcon, GripIcon, GroupIcon, HandIcon, SearchIcon, TrashIcon, UndoIcon } from '../icons';
import { goBack, navigate } from '../router';
import { useServices, useSettings } from '../services';
import { SWIPE_LABEL, swipeAction, swipeDirection, type SwipeAction } from '../shopping-gestures';
import { tata } from '../tata-lines';

/**
 * A context's list in full screen, for one hand inside the store (spec/modo-compra.md). Works
 * offline: everything is on the device.
 */
export function ShoppingMode({ snapshot, contextId }: { snapshot: Snapshot; contextId: string }) {
  const { lists, contexts, settings, haptic } = useServices();
  const { hand } = useSettings();
  const context = snapshot.contexts.find((c) => c.id === contextId && c.deletedAt === null);
  const { fading, fade, undo } = useFading();
  const [last, setLast] = useState<ListEntry | null>(null);
  // Bought by the second swipe during this visit, for the progress and the final count.
  const [boughtIds, setBoughtIds] = useState<ReadonlySet<string>>(new Set());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [finished, setFinished] = useState<number | null>(null);

  if (!context) {
    return (
      <main className="screen">
        <p className="muted">Este contexto não existe mais.</p>
        <button type="button" className="pill" onClick={() => navigate({ name: 'lists' }, { replace: true })}>
          Ver as listas
        </button>
      </main>
    );
  }

  if (finished !== null) {
    return (
      <main className="screen shop shop--done">
        <Say mood="happy" size={72}>
          {tata.finished(finished)}
        </Say>
        <div className="reach">
          <button type="button" className="btn btn--huge" onClick={() => navigate({ name: 'lists', contextId }, { replace: true })}>
            Voltar às listas
          </button>
        </div>
      </main>
    );
  }

  const items = itemsById(snapshot.items);
  const key = nameKey(search ?? '');
  const matches = (e: ListEntry) => !key || nameKey(items.get(e.itemId)?.name ?? '').includes(key);
  const entries = withFading(listEntries(snapshot, contextId), fading, [contextId]).filter(matches);
  const loose = withFading(listEntries(snapshot, null), fading, [null]).filter(matches);
  const all = [...entries, ...loose].filter((e) => !fading.has(e.id));
  const bought = boughtIds.size;
  const done = all.filter(isChecked).length + bought;
  const total = all.length + bought;

  async function act(entry: ListEntry, action: SwipeAction) {
    switch (action) {
      case 'check':
        haptic();
        setLast(entry);
        return lists.setChecked(entry.id, true);
      case 'uncheck':
        setLast(entry);
        return lists.setChecked(entry.id, false);
      case 'buy':
        setLast(entry);
        setBoughtIds((ids) => new Set(ids).add(entry.id));
        return fade(entry, () => lists.markBought(entry.id));
      case 'undo':
        setBoughtIds((ids) => {
          const next = new Set(ids);
          next.delete(entry.id);
          return next;
        });
        return undo(entry.id);
    }
  }

  function trash(entry: ListEntry) {
    setLast(entry);
    void fade(entry, () => lists.removeEntry(entry.id));
  }

  function undoLast() {
    if (!last) return;
    if (fading.has(last.id)) void act(last, 'undo');
    else void lists.restoreEntry(last);
    setLast(null);
  }

  const rowProps = { items, hand, fading, onAction: act, onTrash: trash, onUndo: (id: string) => void act(fading.get(id)!, 'undo') };
  const toggleGroup = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };

  return (
    <main className="screen shop">
      <div className="shop__bar">
        <button type="button" className="link-button" onClick={goBack}>
          <BackIcon /> Sair
        </button>
        <span className="muted">
          {done} de {total}
        </span>
      </div>
      <h1 className="title">{context.name}</h1>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Já no carrinho">
        <i style={{ width: total ? `${(done / total) * 100}%` : 0 }} />
      </div>

      <div className="shop__body">
        {entries.length === 0 && loose.length === 0 && <Say mood="happy">{key ? 'Nada com esse nome na lista.' : tata.emptyList(context.name)}</Say>}
        {context.groupByCategory ? (
          groupByCategory(entries, items, contextCategories(context, snapshot.items)).map((group) => {
            const id = group.categoryId ?? 'outros';
            const open = !collapsed.has(id);
            return (
              <section key={id} className="group">
                <button type="button" className="group__head" aria-expanded={open} onClick={() => toggleGroup(id)}>
                  <ChevronIcon open={open} />
                  <span className="label">{group.name}</span>
                  <span className="count count--quiet">{group.missing}</span>
                </button>
                {open && (
                  <ul className="rows">
                    {group.entries.map((entry) => (
                      <ShoppingRow key={entry.id} entry={entry} {...rowProps} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        ) : (
          <ul className="rows">
            {entries.map((entry) => (
              <ShoppingRow key={entry.id} entry={entry} {...rowProps} />
            ))}
          </ul>
        )}

        {loose.length > 0 && (
          <section className="group group--loose">
            <h2 className="label">Sem contexto</h2>
            <ul className="rows">
              {loose.map((entry) => (
                <ShoppingRow key={entry.id} entry={entry} {...rowProps} />
              ))}
            </ul>
          </section>
        )}

        {context.groupByCategory && (
          <button type="button" className="link-button" onClick={() => setOrdering(true)}>
            Arrumar a ordem dos grupos
          </button>
        )}
      </div>

      <div className="shop__controls">
        {search !== null && (
          <div className="field field--quiet">
            <input type="search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na lista" aria-label="Buscar na lista" />
          </div>
        )}
        <div className="reach">
          <button type="button" className="pill pill--icon" aria-label="Desfazer" disabled={!last} onClick={undoLast}>
            <UndoIcon />
          </button>
          <button
            type="button"
            className={context.groupByCategory ? 'pill pill--icon is-on' : 'pill pill--icon'}
            aria-label="Agrupar por categoria"
            aria-pressed={context.groupByCategory}
            onClick={() => void contexts.setGroupByCategory(context.id, !context.groupByCategory)}
          >
            <GroupIcon />
          </button>
          <button
            type="button"
            className={search !== null ? 'pill pill--icon is-on' : 'pill pill--icon'}
            aria-label="Buscar"
            aria-pressed={search !== null}
            onClick={() => setSearch(search === null ? '' : null)}
          >
            <SearchIcon />
          </button>
          <button type="button" className="pill pill--icon" aria-label={hand === 'right' ? 'Passar para a mão esquerda' : 'Passar para a mão direita'} onClick={() => void settings.set('hand', hand === 'right' ? 'left' : 'right')}>
            <HandIcon />
          </button>
          <button type="button" className="btn btn--huge" onClick={() => void lists.finishPurchase([contextId, null]).then((n) => setFinished(n + bought))}>
            Finalizar compra
          </button>
        </div>
      </div>

      {ordering && <GroupOrder context={context} categories={contextCategories(context, snapshot.items)} onClose={() => setOrdering(false)} />}
    </main>
  );
}

interface RowProps {
  entry: ListEntry;
  items: ReturnType<typeof itemsById>;
  hand: Hand;
  fading: ReadonlyMap<string, ListEntry>;
  onAction: (entry: ListEntry, action: SwipeAction) => void;
  onTrash: (entry: ListEntry) => void;
  onUndo: (entryId: string) => void;
}

/**
 * One item: the tap area (the circle and the trash) on the thumb's side, the name on the other.
 * Swiping toward the thumb strikes, again counts as bought; the other way undoes.
 */
function ShoppingRow({ entry, items, hand, fading, onAction, onTrash, onUndo }: RowProps) {
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; swiping: boolean } | null>(null);
  const swiped = useRef(false);
  const row = useRef<HTMLLIElement>(null);
  const name = items.get(entry.itemId)?.name ?? '…';
  const details = entryDetails(entry);
  const checked = isChecked(entry);
  const isFading = fading.has(entry.id);
  const state = { checked, fading: isFading };
  const width = row.current?.offsetWidth ?? 320;
  const pending = dx === 0 ? null : swipeAction(state, dx > 0 ? 'right' : 'left', hand);

  function down(event: ReactPointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, swiping: false };
    swiped.current = false;
  }
  function move(event: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    const mx = event.clientX - d.x;
    const my = event.clientY - d.y;
    if (!d.swiping) {
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) {
        d.swiping = true;
        (event.currentTarget as Element).setPointerCapture(event.pointerId);
      } else if (Math.abs(my) > 10) {
        drag.current = null;
        return;
      } else return;
    }
    setDx(mx);
  }
  function up() {
    const d = drag.current;
    drag.current = null;
    if (d?.swiping) {
      swiped.current = true;
      const direction = swipeDirection(dx, width);
      const action = direction && swipeAction(state, direction, hand);
      if (action) onAction(entry, action);
    }
    setDx(0);
  }

  const className = ['shop-row', checked && 'is-checked', isFading && 'is-fading', dx !== 0 && 'is-swiping'].filter(Boolean).join(' ');
  return (
    <li ref={row} className={className} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => (drag.current = null, setDx(0))}>
      {pending && <span className={`shop-row__bg shop-row__bg--${pending} shop-row__bg--${dx > 0 ? 'right' : 'left'}`}>{SWIPE_LABEL[pending]}</span>}
      <div className="shop-row__fg" style={dx ? { transform: `translateX(${dx}px)` } : undefined}>
        <span className="shop-row__name">
          {name}
          {details && <span className="row__meta"> · {details}</span>}
        </span>
        {isFading ? (
          <button type="button" className="undo" onClick={() => onUndo(entry.id)}>
            Desfazer
          </button>
        ) : (
          <>
            <button type="button" className="icon-button trash" aria-label={`Tirar ${name} da lista`} onClick={() => !swiped.current && onTrash(entry)}>
              <TrashIcon />
            </button>
            <button
              type="button"
              className={checked ? 'check check--big is-on' : 'check check--big'}
              aria-label={checked ? `Tirar o risco de ${name}` : `Riscar ${name}`}
              aria-pressed={checked}
              onClick={() => !swiped.current && onAction(entry, checked ? 'uncheck' : 'check')}
            />
          </>
        )}
      </div>
    </li>
  );
}

/** The order of the category groups, dragged to follow the store's aisles (spec/modo-compra.md). */
function GroupOrder({ context, categories, onClose }: { context: Context; categories: readonly string[]; onClose: () => void }) {
  const { contexts } = useServices();
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [order, setOrder] = useState(() => [...categories]);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function moveTo(id: string, index: number) {
    setOrder((current) => {
      const next = current.filter((x) => x !== id);
      next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
      return next;
    });
  }

  function dragMove(event: ReactPointerEvent) {
    if (!dragging || !list.current) return;
    const rows = [...list.current.children] as HTMLElement[];
    const index = rows.findIndex((row) => event.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2);
    moveTo(dragging, index < 0 ? rows.length : index);
  }

  async function save() {
    await contexts.setCategoryOrder(context.id, order);
    dialog.current?.close();
  }

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} aria-labelledby="group-order-title">
      <div className="sheet__body">
        <div className="sheet__head">
          <h2 id="group-order-title">Ordem dos grupos</h2>
          <button type="button" className="pill pill--solid" onClick={() => void save()}>
            Pronto
          </button>
        </div>
        <p className="muted">Arraste para seguir o caminho da loja. Outros fica sempre no fim.</p>
        <ol ref={list} className="order" onPointerMove={dragMove} onPointerUp={() => setDragging(null)} onPointerCancel={() => setDragging(null)}>
          {order.map((id, index) => (
            <li key={id} className={dragging === id ? 'order__row is-dragging' : 'order__row'}>
              <span
                className="order__grip"
                aria-hidden="true"
                onPointerDown={(event) => {
                  event.preventDefault();
                  list.current?.setPointerCapture(event.pointerId);
                  setDragging(id);
                }}
              >
                <GripIcon />
              </span>
              <span className="order__name">{categoryName(id)}</span>
              <button type="button" className="icon-button" aria-label={`Subir ${categoryName(id)}`} disabled={index === 0} onClick={() => moveTo(id, index - 1)}>
                ↑
              </button>
              <button type="button" className="icon-button" aria-label={`Descer ${categoryName(id)}`} disabled={index === order.length - 1} onClick={() => moveTo(id, index + 1)}>
                ↓
              </button>
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
