import { useCallback, useEffect, useRef, useState } from 'react';
import { isChecked, type ListEntry } from '../../domain/list-entry';
import { useServices } from '../services';

/** How long a removed item stays on screen, fading, with "Desfazer" (spec/modo-compra.md). */
export const FADE_MS = 3000;

/** How long a struck item dims in place before moving to the end of its list (`--strike-settle`). */
export const SETTLE_MS = 1500;

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

/**
 * Items just struck: they keep their place while they dim, and only then move to the end of the
 * list, so the eye can follow them.
 */
export function useSettling() {
  const [settling, setSettling] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const release = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setSettling((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const settle = useCallback(
    (id: string) => {
      setSettling((current) => new Set(current).add(id));
      clearTimeout(timers.current.get(id));
      timers.current.set(id, setTimeout(() => release(id), SETTLE_MS));
    },
    [release],
  );

  return { settling, settle, release };
}

/** The entries in list order, with the ones still settling kept where they were before the strike. */
export function holdPlace(entries: readonly ListEntry[], settling: ReadonlySet<string>): readonly ListEntry[] {
  if (settling.size === 0) return entries;
  const last = (e: ListEntry) => Number(isChecked(e) && !settling.has(e.id));
  return [...entries].sort((a, b) => last(a) - last(b) || a.addedAt - b.addedAt);
}
