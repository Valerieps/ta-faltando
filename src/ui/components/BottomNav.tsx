import type { ReactNode } from 'react';
import { BookIcon, ListIcon, PlusIcon } from '../icons';
import { navigate, type Route } from '../router';

export type Tab = 'catalog' | 'lists';

/**
 * The phone's bottom bar: Catálogo, the round + that opens the capture, and Listas
 * (spec/itens-e-contextos.md). Moving between the tabs replaces the screen, so back leaves the
 * app instead of walking the tabs; the capture is pushed, so back returns here.
 * `contextId` carries the open context from the lists to the catalog and back.
 */
export function BottomNav({ current, contextId }: { current?: Tab; contextId?: string | null }) {
  const tab = (name: Tab, label: string, icon: ReactNode, to: Route) => (
    <button
      type="button"
      className={name === current ? 'bottom-nav__tab is-on' : 'bottom-nav__tab'}
      aria-current={name === current ? 'page' : undefined}
      onClick={() => navigate(to, { replace: true })}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <nav className="bottom-nav" aria-label="Telas">
      {tab('catalog', 'Catálogo', <BookIcon />, { name: 'catalog', contextId })}
      <span className="bottom-nav__middle">
        <button type="button" className="fab" aria-label="Anotar" title="Anotar" onClick={() => navigate({ name: 'capture' })}>
          <PlusIcon />
        </button>
      </span>
      {tab('lists', 'Listas', <ListIcon />, { name: 'lists', contextId })}
    </nav>
  );
}
