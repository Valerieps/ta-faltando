import { useSyncExternalStore } from 'react';

/**
 * The app's screens, kept in the URL hash so the Android back gesture moves between them
 * (identity draft: "voltar é o gesto de voltar do Android"). `contextId` null is "Sem contexto".
 */
export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'capture' }
  | { readonly name: 'lists'; readonly contextId?: string | null }
  | { readonly name: 'catalog'; readonly contextId?: string | null }
  | { readonly name: 'batch' }
  | { readonly name: 'uncontexted' }
  | { readonly name: 'settings' }
  | { readonly name: 'profile' }
  | { readonly name: 'setup' };

const NO_CONTEXT = 'sem-contexto';

/** The lists route's `contextId` for "Todos os itens", every context on one screen. */
export const ALL_LISTS = 'todas';

const PATHS = {
  capture: 'anotar',
  lists: 'listas',
  catalog: 'catalogo',
  batch: 'lote',
  uncontexted: NO_CONTEXT,
  settings: 'ajustes',
  profile: 'perfil',
  setup: 'setup',
} as const;

const contextPart = (id: string | null | undefined) =>
  id === undefined ? '' : `/${id === null ? NO_CONTEXT : encodeURIComponent(id)}`;

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'lists':
    case 'catalog':
      return `#/${PATHS[route.name]}${contextPart(route.contextId)}`;
    default:
      return `#/${PATHS[route.name]}`;
  }
}

export function parseRoute(hash: string): Route {
  const [path = '', part] = hash.replace(/^#\/?/, '').split('/');
  const contextId = part === undefined || part === '' ? undefined : part === NO_CONTEXT ? null : decodeURIComponent(part);
  switch (path) {
    case PATHS.lists:
      return { name: 'lists', contextId };
    case PATHS.catalog:
      return { name: 'catalog', contextId };
    case PATHS.capture:
      return { name: 'capture' };
    case PATHS.batch:
      return { name: 'batch' };
    case PATHS.uncontexted:
      return { name: 'uncontexted' };
    case PATHS.settings:
      return { name: 'settings' };
    case PATHS.profile:
      return { name: 'profile' };
    case PATHS.setup:
      return { name: 'setup' };
    default:
      return { name: 'home' };
  }
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('popstate', notify);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('popstate', notify);
  };
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}

/** Opens a screen; `replace` swaps the current one, so back skips it. */
export function navigate(route: Route, { replace = false } = {}): void {
  const hash = routeHash(route);
  if (hash === window.location.hash || (hash === '#/' && window.location.hash === '')) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  notify();
}

/** Back to the previous screen, or home when the app was opened on this one. */
export function goBack(): void {
  if (history.length <= 1) navigate({ name: 'home' }, { replace: true });
  else history.back();
}
