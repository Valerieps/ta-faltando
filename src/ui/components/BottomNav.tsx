import type { ReactNode } from 'react';
import { BookIcon, ListIcon, PersonIcon } from '../icons';
import { navigate, type Route } from '../router';

export type Tab = 'profile' | 'catalog' | 'lists';

/**
 * The phone's bottom bar: Perfil, Catálogo and Listas (spec/itens-e-contextos.md). Moving
 * between them replaces the screen, so back leaves the app instead of walking the tabs.
 * `contextId` carries the open context from the lists to the catalog and back.
 */
export function BottomNav({ current, contextId }: { current: Tab; contextId?: string | null }) {
  const tabs: { tab: Tab; label: string; icon: ReactNode; to: Route }[] = [
    { tab: 'profile', label: 'Perfil', icon: <PersonIcon />, to: { name: 'profile' } },
    { tab: 'catalog', label: 'Catálogo', icon: <BookIcon />, to: { name: 'catalog', contextId } },
    { tab: 'lists', label: 'Listas', icon: <ListIcon />, to: { name: 'lists', contextId } },
  ];
  return (
    <nav className="bottom-nav" aria-label="Telas">
      {tabs.map(({ tab, label, icon, to }) => (
        <button
          key={tab}
          type="button"
          className={tab === current ? 'bottom-nav__tab is-on' : 'bottom-nav__tab'}
          aria-current={tab === current ? 'page' : undefined}
          onClick={() => navigate(to, { replace: true })}
        >
          {icon}
          {label}
        </button>
      ))}
    </nav>
  );
}
