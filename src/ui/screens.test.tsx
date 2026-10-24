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
import { ProfileScreen } from './screens/ProfileScreen';
import { BatchScreen, CatalogScreen } from './screens/SimpleScreens';
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
  it('capture shows the question, the recent items and the lists count', async () => {
    const { snapshot, render } = await setup();
    const html = render(<Capture snapshot={snapshot} />);
    expect(html).toContain('O que tá faltando?');
    expect(html).toContain('Agora há pouco');
    expect(html).not.toContain('Falar os itens');
    expect(html).toMatch(/Listas <span class="count">2<\/span>/);
    expect(html).toContain('aria-label="Comprar"');
    expect(html).not.toContain('bottom-nav');
  });

  it('the lists put the picker and the grouping on the name line, the avatar on top and the + mid-bar', async () => {
    const { snapshot, render } = await setup();
    const html = render(<ListsScreen snapshot={snapshot} contextId="mercado" />);
    expect(html).not.toContain('aria-label="Editar Mercado"');
    expect(html).toMatch(/class="topbar">.*class="avatar" aria-label="Perfil"/);
    const head = html.slice(html.indexOf('class="screen__head"'), html.indexOf('</header>', html.indexOf('class="screen__head"')));
    expect(head).toContain('aria-haspopup="menu"');
    expect(head).toContain('Agrupar por categoria');
    expect(html).not.toContain('class="tabs"');
    const nav = html.slice(html.indexOf('class="bottom-nav"'));
    expect(nav).not.toContain('Perfil');
    expect(nav.indexOf('Listas')).toBeLessThan(nav.indexOf('aria-label="Anotar"'));
    expect(nav.indexOf('aria-label="Anotar"')).toBeLessThan(nav.indexOf('Catálogo'));
    expect(nav).toMatch(/is-on" aria-current="page">.*Listas/);
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
    expect(html).not.toContain('Finalizar compra');
    expect(html).not.toContain('aria-label="Desfazer"');
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
    expect(html).toContain('Finalizar compra (1 riscado)');
  });

  it('the desktop catalog creates and renames contexts from its dropdown, with no Contextos page', async () => {
    const { snapshot, render } = await setup();
    const html = render(<DesktopApp snapshot={snapshot} route={{ name: 'catalog', contextId: 'mercado' }} />);
    expect(html).toContain('aria-label="Novo contexto"');
    expect(html).toContain('Mudar o nome de Mercado');
    expect(html).toContain('aria-label="Contexto"');
    expect(html).not.toMatch(/side__link[^>]*>Contextos/);
  });

  it('the phone catalog has the same dropdown, under a search of every context', async () => {
    const { snapshot, render } = await setup();
    const html = render(<CatalogScreen snapshot={snapshot} contextId="mercado" />);
    expect(html).toContain('aria-label="Novo contexto"');
    expect(html).toContain('Mudar o nome de Mercado');
    expect(html).toContain('Buscar em todos os contextos');
    expect(html.indexOf('Buscar em todos os contextos')).toBeLessThan(html.indexOf('aria-label="Contexto"'));
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
    expect(render(<CatalogScreen snapshot={snapshot} contextId="mercado" />)).toContain('Leite');
    expect(render(<BatchScreen snapshot={snapshot} />)).toContain('Separar os itens');
  });
});
