/**
 * The avatar's letters from the e-mail's name part: the first letter of its first two words
 * ("souza.pereira@…" → "SP"), or its first two letters when it is one word.
 */
export function initials(email: string): string {
  const letters = (word: string) => [...word].filter((char) => /\p{L}/u.test(char));
  const words = (email.split('@')[0] ?? '').split(/[._+-]+/).filter((word) => letters(word).length > 0);
  const [first = '', second] = words;
  const result = second ? `${letters(first)[0]}${letters(second)[0]}` : letters(first).slice(0, 2).join('');
  return result.toLocaleUpperCase('pt-BR');
}
