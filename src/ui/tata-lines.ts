// What Tatá says (identity draft, "A Tatá"): one sentence, two at most, in the present, saying
// what she did, never what the owner should have done. No emoji: her face does that.

import type { AddResult } from '../application/lists';
import { entryDetails } from '../domain/entry-text';

type Gender = { readonly to: string; readonly in: string };

const MASCULINE: Gender = { to: 'pro', in: 'no' };
const FEMININE: Gender = { to: 'pra', in: 'na' };
const FEMININE_PLURAL: Gender = { to: 'pras', in: 'nas' };
const MASCULINE_PLURAL: Gender = { to: 'pros', in: 'nos' };

const KNOWN: Record<string, Gender> = {
  mercado: MASCULINE,
  hortifrúti: MASCULINE,
  padaria: FEMININE,
  farmácia: FEMININE,
  'pet shop': MASCULINE,
  'lojas online': FEMININE_PLURAL,
};

/** "pro Mercado", "pra Farmácia", "pras Lojas online"; a context she created is guessed by its ending. */
function gender(context: string): Gender {
  const name = context.toLocaleLowerCase('pt-BR');
  const first = name.split(' ')[0];
  return KNOWN[name] ?? (first.endsWith('as') ? FEMININE_PLURAL : first.endsWith('os') ? MASCULINE_PLURAL : first.endsWith('a') ? FEMININE : MASCULINE);
}

const lower = (text: string) => text.toLocaleLowerCase('pt-BR');
const items = (n: number) => (n === 1 ? '1 item' : `${n} itens`);

export const tata = {
  welcome: 'Oi, eu sou a Tatá. Eu anoto o que tá faltando e coloco cada coisa na lista do lugar certo.',
  ask: 'O que tá faltando?',
  listening: 'Tô ouvindo. Pode falar os itens.',
  heardNothing: 'Não entendi nada dessa vez. Tenta de novo?',
  offline: 'Tô sem internet, mas anotei tudo aqui. Sincronizo quando ela voltar.',
  backupDue: 'Faz um mês desde o último backup. Quer guardar uma cópia agora?',
  noneWithoutContext: 'Tudo tem contexto. Nada pra arrumar aqui.',

  added(result: AddResult, contextName: string | null): string {
    const name = result.item.name;
    if (result.outcome === 'already') return `${name} já tava na lista. Fica tranquila.`;
    if (result.outcome === 'updated') return `${name} já tava na lista. Atualizei pra ${entryDetails(result.entry)}.`;
    if (contextName === null) return `Ainda não sei onde se compra ${lower(name)}. Deixei em Sem contexto, depois você me conta.`;
    return `Anotado. ${name} foi ${gender(contextName).to} ${contextName}.`;
  },

  addedMany: (n: number) => `Anotei ${items(n)}.`,

  emptyList(contextName: string | null): string {
    if (contextName === null) return 'Nada sem contexto. Tá tudo no lugar.';
    return `Nada faltando ${gender(contextName).in} ${contextName}. Por hoje, tá tudo em ordem.`;
  },

  batchSplit: (n: number) => `Separei em ${items(n)}. Confere antes de eu guardar?`,

  finished: (n: number) => (n === 0 ? 'Nada foi riscado, então a lista ficou como estava.' : `Compra feita. Tirei ${items(n)} da lista.`),

  linked: (name: string, contextName: string) => `Pronto. ${name} agora vai ${gender(contextName).to} ${contextName}.`,

  setupContext: (contextName: string) => `O que você costuma comprar ${gender(contextName).in} ${contextName}?`,

  setupDone: (n: number) => (n === 0 ? 'Tudo pronto. O catálogo cresce conforme você anota.' : `Montei o seu catálogo com ${items(n)}.`),
};
