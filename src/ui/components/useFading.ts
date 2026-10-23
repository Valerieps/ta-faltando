import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListEntry } from '../../domain/list-entry';
import { useServices } from '../services';

/** How long a removed item stays on screen, fading, with "Desfazer" (spec/modo-compra.md). */
export const FADE_MS = 3000;

/**
 * Items that just left the list (bought by the second swipe, or the trash). The change is saved
 * at once, so closing the app never loses it; the row keeps showing, fading, for 3 seconds, and
 * "Desfazer" puts the entry back as it was.
 */
export function useFading() {
  const { lists } = useServices();
  const [fading, setFading] = useState<ReadonlyMap<string, ListEntry>>(new Map());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const forget = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setFading((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  /** Shows `previous` fading while `change` takes it off the list. */
  const fade = useCallback(
    async (previous: ListEntry, change: () => Promise<void>) => {
      setFading((current) => new Map(current).set(previous.id, previous));
      clearTimeout(timers.current.get(previous.id));
      timers.current.set(previous.id, setTimeout(() => forget(previous.id), FADE_MS));
      await change();
    },
    [forget],
  );

  const undo = useCallback(
    async (id: string) => {
      const previous = fading.get(id);
      if (!previous) return;
      forget(id);
      await lists.restoreEntry(previous);
    },
    [fading, forget, lists],
  );

  return { fading, fade, undo };
}

/** The live entries of a list plus the ones fading out of it, in list order. */
export function withFading(entries: readonly ListEntry[], fading: ReadonlyMap<string, ListEntry>, contextIds: readonly (string | null)[]): ListEntry[] {
  const live = new Set(entries.map((e) => e.id));
  const extra = [...fading.values()].filter((e) => !live.has(e.id) && contextIds.includes(e.contextId));
  return [...entries, ...extra].sort((a, b) => Number(a.checkedAt != null) - Number(b.checkedAt != null) || a.addedAt - b.addedAt);
}
