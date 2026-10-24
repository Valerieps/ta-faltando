import { useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { AddResult } from '../../application/lists';
import { contextName, type Snapshot } from '../../domain/list-view';
import { BookIcon, ListIcon, PlusIcon } from '../icons';
import { navigate, type Route } from '../router';
import { tata } from '../tata-lines';
import { AddField } from './AddField';
import { Say } from './Say';

export type Tab = 'catalog' | 'lists';

/**
 * The phone's bottom bar: Catálogo, the round + and Listas (spec/itens-e-contextos.md). Moving
 * between the tabs replaces the screen, so back leaves the app instead of walking the tabs.
 * The + opens the add field in place of the bar, on the keyboard, without leaving the screen;
 * leaving the field brings the bar back. `contextId` carries the open context between the tabs.
 */
export function BottomNav({ current, contextId, snapshot }: { current?: Tab; contextId?: string | null; snapshot: Snapshot }) {
  const [adding, setAdding] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function open() {
    setSaid(null);
    // Rendered and focused inside the tap, so the phone opens the keyboard.
    flushSync(() => setAdding(true));
    input.current?.focus();
  }

  function onAdded(result: AddResult) {
    setSaid(tata.added(result, result.entry.contextId === null ? null : contextName(snapshot, result.entry.contextId)));
  }

  if (adding) {
    return (
      <div
        className="bottom-add"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setAdding(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setAdding(false);
        }}
      >
        {said && <Say>{said}</Say>}
        <AddField snapshot={snapshot} onAdded={onAdded} opens="up" inputRef={input} />
      </div>
    );
  }

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
        <button type="button" className="fab" aria-label="Anotar" title="Anotar" onClick={open}>
          <PlusIcon />
        </button>
      </span>
      {tab('lists', 'Listas', <ListIcon />, { name: 'lists', contextId })}
    </nav>
  );
}
