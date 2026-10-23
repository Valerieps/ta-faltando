import { capitalize } from './entry-text';
import { findSuggestion, type Suggestion } from './suggestion';
import { cleanName, nameKey } from './text';

/** The setup always shows this many capsules (spec/setup.md). */
export const CAPSULE_COUNT = 8;

export interface Selected {
  readonly name: string;
  readonly category: string | null;
  /** Came from the queue, so unselecting it puts it back at the front of the queue. */
  readonly fromQueue: boolean;
}

/** The capsules screen of one context: fixed slots, the rest of the queue, and what was chosen. */
export interface CapsulesState {
  /** null is an empty place: the queue ran out. */
  readonly slots: readonly (Suggestion | null)[];
  readonly queue: readonly Suggestion[];
  readonly selected: readonly Selected[];
}

const keyOf = (s: { name: string }) => nameKey(s.name);

/** Opens the screen with the first 8 of the queue, skipping items chosen elsewhere. */
export function startCapsules(queue: readonly Suggestion[], excluded: ReadonlySet<string>): CapsulesState {
  return refill({ slots: Array(CAPSULE_COUNT).fill(null), queue, selected: [] }, excluded);
}

/**
 * Drops from the slots and the queue what was chosen in another context (each item has one
 * default context) and fills the empty places from the front of the queue. Places that keep
 * their suggestion do not move (spec/setup.md: "as outras cápsulas não mudam de posição").
 */
export function refill(state: CapsulesState, excluded: ReadonlySet<string>): CapsulesState {
  const chosen = new Set([...excluded, ...state.selected.map(keyOf)]);
  const queue = state.queue.filter((s) => !chosen.has(keyOf(s)));
  const slots = state.slots.map((slot) => (slot && !chosen.has(keyOf(slot)) ? slot : null));
  for (let i = 0; i < slots.length && queue.length > 0; i++) {
    if (slots[i] === null) slots[i] = queue.shift()!;
  }
  return { ...state, slots, queue };
}

/** Taps a capsule: it joins "Selecionados" and the next suggestion takes its place. */
export function pick(state: CapsulesState, slot: number, excluded: ReadonlySet<string>): CapsulesState {
  const suggestion = state.slots[slot];
  if (!suggestion) return state;
  const selected = [...state.selected, { name: capitalize(suggestion.name), category: suggestion.category, fromQueue: true }];
  const slots = state.slots.map((s, i) => (i === slot ? null : s));
  return refill({ ...state, slots, selected }, excluded);
}

/** Taps a selected item: it is unselected, and a suggestion goes back to the front of the queue. */
export function unpick(state: CapsulesState, name: string, original: readonly Suggestion[], excluded: ReadonlySet<string>): CapsulesState {
  const key = nameKey(name);
  const removed = state.selected.find((s) => keyOf(s) === key);
  if (!removed) return state;
  const selected = state.selected.filter((s) => s !== removed);
  const suggestion = removed.fromQueue ? original.find((s) => keyOf(s) === key) : undefined;
  const queue = suggestion ? [suggestion, ...state.queue] : state.queue;
  return refill({ ...state, selected, queue }, excluded);
}

/** Types an item: it is selected; a suggestion with that name leaves the capsules and the queue. */
export function typeItem(state: CapsulesState, text: string, excluded: ReadonlySet<string>): CapsulesState {
  const name = capitalize(cleanName(text));
  const key = nameKey(name);
  if (!key || excluded.has(key) || state.selected.some((s) => keyOf(s) === key)) return state;
  const inQueue = [...state.slots, ...state.queue].find((s) => s !== null && keyOf(s) === key);
  const category = inQueue?.category ?? findSuggestion(name)?.category ?? null;
  return refill({ ...state, selected: [...state.selected, { name, category, fromQueue: inQueue !== undefined }] }, excluded);
}
