import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdList } from './ListsScreen';

describe('leaving a list', () => {
  afterEach(() => vi.useRealTimers());

  it('finishes the purchase of the list it leaves', () => {
    vi.useFakeTimers();
    const finish = vi.fn();
    const release = holdList('mercado', finish);
    release();
    holdList('farmacia', finish);
    vi.runAllTimers();
    expect(finish).toHaveBeenCalledExactlyOnceWith('mercado');
  });

  it('does not finish when the same list is held again at once', () => {
    vi.useFakeTimers();
    const finish = vi.fn();
    holdList('mercado', finish)();
    holdList('mercado', finish);
    vi.runAllTimers();
    expect(finish).not.toHaveBeenCalled();
  });
});
