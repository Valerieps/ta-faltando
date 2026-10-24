import { useEffect, useRef } from 'react';

/** How much the visible height must shrink before we take it as the keyboard being open. */
const KEYBOARD_MIN_PX = 120;

/**
 * Follows the visible height to tell when the phone keyboard opens and then closes. Android hides
 * the keyboard (back button, the keyboard's own arrow) without taking the focus off the field, so
 * no blur ever fires; the height growing back is the only sign.
 */
export function keyboardWatcher(fullHeight: number) {
  let shown = false;
  return (height: number): 'closed' | null => {
    if (height < fullHeight - KEYBOARD_MIN_PX) shown = true;
    else if (shown) return 'closed';
    return null;
  };
}

/** Calls `onClosed` when the keyboard, opened while `active`, closes. */
export function useKeyboardClosed(active: boolean, onClosed: () => void) {
  const callback = useRef(onClosed);
  callback.current = onClosed;

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    // Read before the keyboard opens: the field is focused inside the tap, the resize comes later.
    const watch = keyboardWatcher(Math.max(viewport.height, window.innerHeight));
    const onResize = () => {
      if (watch(viewport.height) === 'closed') callback.current();
    };
    viewport.addEventListener('resize', onResize);
    return () => viewport.removeEventListener('resize', onResize);
  }, [active]);
}
