import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Backup } from '../application/backup';
import { Contexts } from '../application/contexts';
import { Lists } from '../application/lists';
import { Settings } from '../application/settings';
import { Synchronizer } from '../application/synchronizer';
import { MemoryStore } from '../infrastructure/memory-store';
import { ItemSheet } from './components/ItemSheet';
import { DesktopApp } from './desktop/DesktopApp';
import { ListsScreen } from './screens/ListsScreen';
import { Setup } from './screens/Setup';
import { ProfileScreen } from './screens/ProfileScreen';
import { BatchScreen } from './screens/SimpleScreens';
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
    account: { email: async () => 'dona@example.com' },
    files: { save: async () => true, open: async () => null },
    haptic: () => {},
    now: clock.now,
    loginPath: '/api/login',
    logoutPath: '/cdn-cgi/access/logout',
  };
  const snapshot = await lists.snapshot();
  const render = (node: React.ReactNode) => renderToStaticMarkup(<ServicesProvider services={services}>{node}</ServicesProvider>);
  return { snapshot, render, services };
}

describe('screens', () => {
  it('the + opened by the shortcut asks what is missing and offers to paste a list', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId={undefined} adding />);
    expect(html).toContain('placeholder="O que tá faltando?"');
    expect(html).toContain('Colar uma lista');
    expect(html).not.toContain('class="bottom-nav"');
  });

  it('the lists put the picker and the grouping on the name line, the avatar on top and only the + at the bottom', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId="mercado" />);
    expect(html).not.toContain('aria-label="Editar Mercado"');
    expect(html).toMatch(/class="topbar">.*class="avatar" aria-label="Perfil"/);
    const head = html.slice(html.indexOf('class="screen__head"'), html.indexOf('</header>', html.indexOf('class="screen__head"')));
    expect(head).toContain('aria-haspopup="menu"');
    expect(head).toContain('Agrupar por categoria');
    expect(html).not.toContain('class="tabs"');
    const nav = html.slice(html.indexOf('class="bottom-nav"'));
    expect(nav).toContain('aria-label="Anotar"');
    expect(nav).not.toContain('Catálogo');
    expect(nav).not.toContain('Listas');
  });

  it('a list switches between Faltando and Tudo, which is its catalog without a context picker', async () => {
    const { snapshot, render } = await setup();
    const faltando = render(<ListsScreen snapshot={snapshot} contextId="mercado" />);
    expect(faltando).toMatch(/aria-checked="true" class="is-on">Faltando/);
    expect(faltando).not.toContain('Buscar em todos os contextos');
    const tudo = render(<ListsScreen snapshot={snapshot} contextId="mercado" view="tudo" />);
    expect(tudo).toMatch(/aria-checked="true" class="is-on">Tudo/);
    expect(tudo).toContain('Buscar em todos os contextos');
    expect(tudo).not.toContain('aria-label="Contexto"');
    expect(tudo).not.toContain('Terminei');
    // Mercado is grouped by category, and so is its catalog.
    expect(tudo).toMatch(/<h2 class="label">Laticínios<\/h2>.*Leite/);
  });

  it('"Sem contexto" and "Todos os itens" have no Tudo', async () => {
    const { snapshot, render } = await setup();
    expect(render(<ListsScreen snapshot={snapshot} contextId={null} />)).not.toContain('>Tudo<');
    expect(render(<ListsScreen snapshot={snapshot} contextId={undefined} />)).not.toContain('>Tudo<');
  });

  it('the profile holds the account, the sync and every setting', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ProfileScreen snapshot={snapshot} />);
    expect(html).toContain('Mão direita');
    expect(html).toContain('Exportar backup');
    expect(html).toContain('Refazer o setup');
    expect(html).toContain('sync-indicator');
    expect(html).not.toContain('<h3>Sincronização</h3>');
    expect(html).not.toContain('aria-current="page"');
  });

  it('the lists are the shopping mode: the circle strikes, no trash, groups by category and finishes', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId="mercado" />);
    expect(html).toContain('Riscar Detergente');
    expect(html).toContain('Tirar o risco de Leite');
    expect(html).not.toContain('Tirar Detergente da lista');
    expect(html).not.toContain('Buscar');
    expect(html).not.toContain('mão');
    expect(html).not.toContain('Comprar no');
    expect(html).toContain('aria-label="Agrupar por categoria"');
    expect(html).toContain('Laticínios');
    expect(html).not.toContain('aria-label="Desfazer"');
    expect(html).toMatch(/Terminei \(1 riscado\).*Arrumar a ordem dos grupos/);
    expect(html).not.toContain('Abrir o catálogo de Mercado');
  });

  it('"Terminei" shows only while a list has struck items, and in "Todos os itens" too', async () => {
    const { snapshot, render } = await setup();
    expect(render(<ListsScreen snapshot={snapshot} contextId={undefined} />)).toContain('Terminei (1 riscado)');
    const unstruck = { ...snapshot, entries: snapshot.entries.map((e) => ({ ...e, checkedAt: null })) };
    expect(render(<ListsScreen snapshot={unstruck} contextId="mercado" />)).not.toContain('Terminei');
  });

  it('an empty list links to its Tudo', async () => {
    const { snapshot, render } = await setup();
    expect(render(<ListsScreen snapshot={snapshot} contextId="farmacia" />)).toContain('Abrir o catálogo de Farmácia');
  });

  it('the "Sem contexto" tab offers the contexts as buttons', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId={null} />);
    expect(html).toContain('Pilha');
    expect(html).toContain('>Mercado</button>');
  });

  it('the desktop shows the side menu, the columns and the batch box', async () => {
    const { snapshot, render } = await setup();
    const html = render(<DesktopApp snapshot={snapshot} route={{ name: 'home' }} />);
    expect(html).toContain('Adicionar em lote');
    expect(html).toContain('Riscar Detergente');
    expect(html).toContain('Terminei (1 riscado)');
  });

  it('the desktop catalog creates and renames contexts from its dropdown, with no Contextos page', async () => {
    const { snapshot, render } = await setup();
    const html = render(<DesktopApp snapshot={snapshot} route={{ name: 'catalog', contextId: 'mercado' }} />);
    expect(html).toContain('aria-label="Novo contexto"');
    expect(html).toContain('Mudar o nome de Mercado');
    expect(html).toContain('aria-label="Contexto"');
    expect(html).not.toMatch(/side__link[^>]*>Contextos/);
  });

  it('the item sheet takes the item out of the catalog with a trash icon, no confirmation step', async () => {
    const { snapshot, render } = await setup();
    const leite = snapshot.items.find((i) => i.name === 'Leite')!;
    const html = render(<ItemSheet snapshot={snapshot} itemId={leite.id} onClose={() => {}} />);
    expect(html).toContain('aria-label="Tirar Leite do catálogo"');
    expect(html).not.toContain('do catálogo?');
  });

  it('the other screens render', async () => {
    const { snapshot, render, services } = await setup();
    const empty = { contexts: [], items: [], entries: [] };
    // The welcome waits for the first sync, which here runs offline.
    expect(render(<Setup snapshot={empty} redo={false} onFinish={() => {}} />)).not.toContain('Oi, eu sou a Tatá');
    await services.sync.sync();
    const welcome = render(<Setup snapshot={empty} redo={false} onFinish={() => {}} />);
    expect(welcome).toContain('Oi, eu sou a Tatá');
    expect(welcome).not.toContain('outro aparelho');
    expect(render(<Setup snapshot={snapshot} redo onFinish={() => {}} />)).toContain('Onde você costuma comprar?');
    expect(render(<BatchScreen snapshot={snapshot} />)).toContain('Separar os itens');
  });
});
