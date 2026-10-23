import { describe, expect, it } from 'vitest';
import { CAPSULE_COUNT, pick, startCapsules, typeItem, unpick } from './setup-capsules';
import { SUGGESTED_CONTEXTS, type Suggestion } from './suggestion';

const queue: Suggestion[] = 'a b c d e f g h i j'.split(' ').map((name) => ({ name, contextId: 'x', category: null }));
const none = new Set<string>();
const slots = (state: { slots: readonly (Suggestion | null)[] }) => state.slots.map((s) => s?.name ?? null);

describe('setup capsules', () => {
  it('opens with the first 8 of the queue', () => {
    expect(slots(startCapsules(queue, none))).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });

  it('a tapped capsule is selected and the next suggestion takes its place, without moving the others', () => {
    const state = pick(startCapsules(queue, none), 2, none);
    expect(slots(state)).toEqual(['a', 'b', 'i', 'd', 'e', 'f', 'g', 'h']);
    expect(state.selected.map((s) => s.name)).toEqual(['C']);
  });

  it('unselecting puts the suggestion back at the front of the queue', () => {
    let state = pick(startCapsules(queue, none), 2, none);
    state = unpick(state, 'C', queue, none);
    expect(state.selected).toEqual([]);
    expect(state.queue.map((s) => s.name)).toEqual(['c', 'j']);
    state = pick(state, 0, none);
    expect(slots(state)[0]).toBe('c');
  });

  it('leaves an empty place when the queue runs out', () => {
    let state = startCapsules(queue, none);
    state = pick(pick(pick(state, 0, none), 0, none), 0, none);
    expect(slots(state)[0]).toBeNull();
    expect(state.selected).toHaveLength(3);
  });

  it('skips what was chosen in another context', () => {
    expect(slots(startCapsules(queue, new Set(['a', 'c'])))).toEqual(['b', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
  });

  it('typing selects the item and takes a suggestion with that name out of the capsules', () => {
    const state = typeItem(startCapsules(queue, none), ' b ', none);
    expect(state.selected).toEqual([{ name: 'B', category: null, fromQueue: true }]);
    expect(slots(state)).toEqual(['a', 'i', 'c', 'd', 'e', 'f', 'g', 'h']);
    const typed = typeItem(state, 'papel de presente', none);
    expect(typed.selected.at(-1)).toEqual({ name: 'Papel de presente', category: null, fromQueue: false });
    expect(typeItem(typed, 'B', none)).toBe(typed);
  });

  it('every suggested context has at least 8 suggestions, and no item is in two queues', () => {
    const seen = new Set<string>();
    for (const context of SUGGESTED_CONTEXTS) {
      expect(context.queue.length).toBeGreaterThanOrEqual(CAPSULE_COUNT);
      for (const s of context.queue) {
        expect(seen.has(s.name)).toBe(false);
        seen.add(s.name);
      }
    }
  });
});
