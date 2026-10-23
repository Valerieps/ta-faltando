/** Trims and collapses inner spaces: the form in which a name is shown and saved. */
export function cleanName(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** The form used to compare names: no case, no accents, single spaces ("Água  Sanitária" = "agua sanitaria"). */
export function nameKey(text: string): string {
  return cleanName(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR');
}
