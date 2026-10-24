import { describe, expect, it } from 'vitest';
import { keyboardWatcher } from './useKeyboardClosed';

describe('keyboardWatcher', () => {
  it('says closed when the height grows back after the keyboard opened', () => {
    const watch = keyboardWatcher(800);
    expect(watch(790)).toBeNull();
    expect(watch(450)).toBeNull();
    expect(watch(800)).toBe('closed');
  });

  it('ignores small changes before the keyboard opens', () => {
    const watch = keyboardWatcher(800);
    expect(watch(760)).toBeNull();
    expect(watch(800)).toBeNull();
  });
});
