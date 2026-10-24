import { describe, expect, it } from 'vitest';
import type { AddResult } from '../application/lists';
import { parseRoute, routeHash, type Route } from './router';
import { swipeAction, swipeDirection } from './shopping-gestures';
import { tata } from './tata-lines';

describe('routes', () => {
  const routes: Route[] = [
    { name: 'home' },
    { name: 'capture' },
    { name: 'lists' },
    { name: 'lists', contextId: 'mercado' },
    { name: 'lists', contextId: null },
    { name: 'catalog', contextId: 'pet-shop' },
    { name: 'batch' },
    { name: 'uncontexted' },
    { name: 'settings' },
    { name: 'profile' },
    { name: 'setup' },
  ];

  it.each(routes)('a screen survives the trip through the URL: %o', (route) => {
    expect(parseRoute(routeHash(route))).toEqual(route.name === 'lists' && !('contextId' in route) ? { name: 'lists', contextId: undefined } : route);
  });

  it('an unknown or empty hash opens home', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/qualquer')).toEqual({ name: 'home' });
  });
});

describe('shopping gestures', () => {
  const fresh = { checked: false, fading: false };
  const struck = { checked: true, fading: false };
  const fading = { checked: true, fading: true };

  it('toward the thumb strikes, and again counts as bought', () => {
    expect(swipeAction(fresh, 'right', 'right')).toBe('check');
    expect(swipeAction(struck, 'right', 'right')).toBe('buy');
    expect(swipeAction(fresh, 'left', 'left')).toBe('check');
  });

  it('the other way undoes the previous gesture', () => {
    expect(swipeAction(struck, 'left', 'right')).toBe('uncheck');
    expect(swipeAction(fading, 'left', 'right')).toBe('undo');
    expect(swipeAction(fading, 'right', 'left')).toBe('undo');
    expect(swipeAction(fresh, 'left', 'right')).toBeNull();
    expect(swipeAction(fading, 'right', 'right')).toBeNull();
  });

  it('a short drag is not a swipe', () => {
    expect(swipeDirection(30, 360)).toBeNull();
    expect(swipeDirection(-80, 360)).toBe('left');
    expect(swipeDirection(90, 200)).toBe('right');
  });
});

describe('what Tatá says', () => {
  const result = (outcome: AddResult['outcome'], name = 'Ração', quantity: number | null = null) =>
    ({ outcome, item: { name }, entry: { quantity, note: null } }) as unknown as AddResult;

  it('says where the item went, with the right preposition', () => {
    expect(tata.added(result('added'), 'Pet shop')).toBe('Anotado. Ração foi pro Pet shop.');
    expect(tata.added(result('added', 'Dipirona'), 'Farmácia')).toBe('Anotado. Dipirona foi pra Farmácia.');
    expect(tata.added(result('added', 'Pilhas'), 'Lojas online')).toBe('Anotado. Pilhas foi pras Lojas online.');
    expect(tata.added(result('added', 'Cola'), 'Papelaria')).toBe('Anotado. Cola foi pra Papelaria.');
  });

  it('never scolds for an item that was already there or has no context', () => {
    expect(tata.added(result('already', 'Café'), 'Mercado')).toBe('Café já tava na lista. Fica tranquila.');
    expect(tata.added(result('updated', 'Café', 3), 'Mercado')).toBe('Café já tava na lista. Atualizei pra 3.');
    expect(tata.added(result('added', 'Pilha'), null)).toBe('Ainda não sei onde se compra pilha. Deixei em Sem contexto, depois você me conta.');
  });

  it('counts items in the singular and plural', () => {
    expect(tata.batchSplit(1)).toBe('Separei em 1 item. Confere antes de eu guardar?');
    expect(tata.emptyList('Mercado')).toBe('Nada faltando no Mercado. Por hoje, tá tudo em ordem.');
  });
});
