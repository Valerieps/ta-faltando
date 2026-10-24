import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Hand } from '../../application/settings';
import type { Context } from '../../domain/context';
import { entryDetails } from '../../domain/entry-text';
import { isChecked, type ListEntry } from '../../domain/list-entry';
import type { itemsById } from '../../domain/list-view';
import { categoryName } from '../../domain/suggestion';
import { GripIcon } from '../icons';
import { useServices } from '../services';
import { SWIPE_LABEL, swipeAction, swipeDirection, type SwipeAction } from '../shopping-gestures';

export interface RowProps {
  entry: ListEntry;
  items: ReturnType<typeof itemsById>;
  hand: Hand;
  fading: ReadonlyMap<string, ListEntry>;
  onAction: (entry: ListEntry, action: SwipeAction) => void;
  onOpen: (entry: ListEntry) => void;
  onUndo: (entryId: string) => void;
}

/**
 * One item: the circle on the left, then the name, which opens the item's detail. Swiping toward
 * the thumb strikes, again counts as bought; the other way undoes.
 */
export function ShoppingRow({ entry, items, hand, fading, onAction, onOpen, onUndo }: RowProps) {
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
        {!isFading && (
          <button
            type="button"
            className={checked ? 'check check--big is-on' : 'check check--big'}
            aria-label={checked ? `Tirar o risco de ${name}` : `Riscar ${name}`}
            aria-pressed={checked}
            onClick={() => !swiped.current && onAction(entry, checked ? 'uncheck' : 'check')}
          />
        )}
        <button type="button" className="shop-row__name" onClick={() => !swiped.current && onOpen(entry)}>
          {name}
          {details && <span className="row__meta"> · {details}</span>}
        </button>
        {isFading && (
          <button type="button" className="undo" onClick={() => onUndo(entry.id)}>
            Desfazer
          </button>
        )}
      </div>
    </li>
  );
}

/** The order of the category groups, dragged to follow the store's aisles (spec/modo-compra.md). */
export function GroupOrder({ context, categories, onClose }: { context: Context; categories: readonly string[]; onClose: () => void }) {
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
