import type { Hand } from '../application/settings';

export type SwipeDirection = 'left' | 'right';

/** What a swipe does to an item in shopping mode (spec/modo-compra.md, "Marcar e finalizar"). */
export type SwipeAction = 'check' | 'buy' | 'uncheck' | 'undo';

/**
 * Toward the thumb (right, with the right hand) strikes the item, and again counts it as
 * bought; the other way undoes the previous gesture.
 */
export function swipeAction(item: { checked: boolean; fading: boolean }, direction: SwipeDirection, hand: Hand): SwipeAction | null {
  const towardThumb = direction === (hand === 'right' ? 'right' : 'left');
  if (item.fading) return towardThumb ? null : 'undo';
  if (towardThumb) return item.checked ? 'buy' : 'check';
  return item.checked ? 'uncheck' : null;
}

/** A swipe counts past this share of the row's width, or this many pixels. */
export const SWIPE_SHARE = 0.3;
export const SWIPE_MIN_PX = 72;

export function swipeDirection(dx: number, width: number): SwipeDirection | null {
  if (Math.abs(dx) < Math.min(SWIPE_MIN_PX, width * SWIPE_SHARE)) return null;
  return dx > 0 ? 'right' : 'left';
}

export const SWIPE_LABEL: Record<SwipeAction, string> = {
  check: '✓ Riscar',
  buy: '✓ Comprado',
  uncheck: 'Tirar o risco',
  undo: 'Desfazer',
};
