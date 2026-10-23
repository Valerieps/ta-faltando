import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Backup } from '../application/backup';
import { Contexts } from '../application/contexts';
import { Lists } from '../application/lists';
import { Settings } from '../application/settings';
import { Synchronizer } from '../application/synchronizer';
import { MemoryStore } from '../infrastructure/memory-store';
import { DesktopApp } from './desktop/DesktopApp';
import { Capture } from './screens/Capture';
import { ListsScreen } from './screens/ListsScreen';
import { Setup } from './screens/Setup';
import { ShoppingMode } from './screens/ShoppingMode';
import { BatchScreen, CatalogScreen, ContextsScreen, SettingsScreen } from './screens/SimpleScreens';
import { ServicesProvider, type Services } from './services';

/** Renders each screen over real use cases and a store in memory: a smoke test for the layout code. */
async function setup() {
  const store = new MemoryStore('phone');
  let n = 0;
  const clock = { now: () => 1_000 + n };
  const ids = { newId: () => `id-${++n}` };
  const lists = new Lists(store, clock, ids);
  const contexts = new Contexts(store, clock, ids);
  const settings = new Settings(store, clock);
  await settings.ready;
  await contexts.applySetup([
    { suggestedId: 'mercado', name: 'Mercado', selected: [{ name: 'Leite', category: 'laticinios', fromQueue: true }] },
    { suggestedId: 'farmacia', name: 'Farmácia', selected: [] },
  ]);
  const leite = (await lists.add('2 leite'))!;
  await lists.add('detergente');
  await lists.add('pilha');
  await lists.setChecked(leite.entry.id, true);
  await contexts.setGroupByCategory('mercado', true);

  const services: Services = {
    lists,
    contexts,
    backup: new Backup(store, clock),
    settings,
    sync: new Synchronizer(store, { exchange: async () => ({ kind: 'offline' }) }, clock),
    speech: { supported: true, listen: () => () => {} },
    files: { save: async () => true, open: async () => null },
    haptic: () => {},
    now: clock.now,
    loginPath: '/api/login',
  };
  const snapshot = await lists.snapshot();
  const render = (node: React.ReactNode) => renderToStaticMarkup(<ServicesProvider services={services}>{node}</ServicesProvider>);
  return { snapshot, render };
}

describe('screens', () => {
  it('capture shows the question, the recent items and the lists count', async () => {
    const { snapshot, render } = await setup();
    const html = render(<Capture snapshot={snapshot} />);
    expect(html).toContain('O que tá faltando?');
    expect(html).toContain('Agora há pouco');
    expect(html).toContain('Falar os itens');
    expect(html).toMatch(/Listas <span class="count">2<\/span>/);
  });

  it('the lists show a tab per context plus "Sem contexto", with the trash and no strike', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId="mercado" />);
    expect(html).toContain('Farmácia');
    expect(html).toContain('Sem contexto');
    expect(html).toContain('Tirar Detergente da lista');
    expect(html).not.toContain('Riscar');
    expect(html).toContain('Laticínios');
  });

  it('the "Sem contexto" tab offers the contexts as buttons', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId={null} />);
    expect(html).toContain('Pilha');
    expect(html).toContain('>Mercado</button>');
  });

  it('shopping mode groups by category, counts progress and lists items without context at the end', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ShoppingMode snapshot={snapshot} contextId="mercado" />);
    expect(html).toContain('Finalizar compra');
    expect(html).toContain('1 de 3');
    expect(html).toContain('Tirar o risco de Leite');
    expect(html.indexOf('Sem contexto')).toBeGreaterThan(html.indexOf('Detergente'));
  });

  it('the desktop shows the side menu, the columns and the batch box', async () => {
    const { snapshot, render } = await setup();
    const html = render(<DesktopApp snapshot={snapshot} route={{ name: 'home' }} />);
    expect(html).toContain('Adicionar em lote');
    expect(html).toContain('Riscar Detergente');
    expect(html).toContain('Finalizar compra (1 riscado)');
  });

  it('the other screens render', async () => {
    const { snapshot, render } = await setup();
    expect(render(<Setup snapshot={{ contexts: [], items: [], entries: [] }} redo={false} onFinish={() => {}} />)).toContain('Oi, eu sou a Tatá');
    expect(render(<Setup snapshot={snapshot} redo onFinish={() => {}} />)).toContain('Onde você costuma comprar?');
    expect(render(<ContextsScreen snapshot={snapshot} />)).toContain('1 item sem contexto');
    expect(render(<CatalogScreen snapshot={snapshot} contextId="mercado" />)).toContain('Leite');
    expect(render(<BatchScreen snapshot={snapshot} />)).toContain('Separar os itens');
    expect(render(<SettingsScreen />)).toContain('Exportar backup');
  });
});
