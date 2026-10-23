import { describe, expect, it } from 'vitest';
import { initials } from './initials';

describe('initials', () => {
  it('takes the first letter of the first two words of the name part', () => {
    expect(initials('souza.pereira.valeria@gmail.com')).toBe('SP');
    expect(initials('ana_maria@example.com')).toBe('AM');
  });

  it('takes two letters of a single word, skipping digits', () => {
    expect(initials('valeria@gmail.com')).toBe('VA');
    expect(initials('v2a@gmail.com')).toBe('VA');
    expect(initials('élida.1990@gmail.com')).toBe('ÉL');
  });

  it('gives nothing when there are no letters', () => {
    expect(initials('123@example.com')).toBe('');
  });
});
