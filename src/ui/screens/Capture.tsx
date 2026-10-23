import { useEffect, useRef, useState } from 'react';
import { backupDue } from '../../application/backup';
import type { AddResult } from '../../application/lists';
import { contextName, itemsById, itemsWithoutContext, totalMissing, type Snapshot } from '../../domain/list-view';
import { AddField } from '../components/AddField';
import { ProfileMenu } from '../components/ProfileMenu';
import { Say } from '../components/Say';
import { ShopChooser } from '../components/ShopChooser';
import { CartIcon } from '../icons';
import { navigate } from '../router';
import { useServices, useSettings, useSyncState } from '../services';
import { Tata, type TataMood } from '../Tata';
import { tata } from '../tata-lines';

const RECENT = 4;

/**
 * The phone's home: just the field, focused with the keyboard open, at the bottom next to the
 * thumb; enter adds and clears it for the next item (spec/itens-e-contextos.md).
 */
export function Capture({ snapshot }: { snapshot: Snapshot }) {
  const { now } = useServices();
  const settings = useSettings();
  const sync = useSyncState();
  const input = useRef<HTMLInputElement>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [happy, setHappy] = useState(false);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (!happy) return;
    const timer = setTimeout(() => setHappy(false), 1100);
    return () => clearTimeout(timer);
  }, [happy]);

  function onAdded(result: AddResult) {
    setSaid(tata.added(result, result.entry.contextId === null ? null : contextName(snapshot, result.entry.contextId)));
    setHappy(true);
  }

  const items = itemsById(snapshot.items);
  const recent = [...snapshot.entries]
    .filter((e) => e.deletedAt === null && e.status === 'pending')
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, RECENT);
  const loose = itemsWithoutContext(snapshot).length;
  const offline = sync.status === 'offline';
  const mood: TataMood = happy ? 'happy' : offline ? 'sleeping' : 'attentive';
  const balloon = said ?? (offline ? tata.offline : backupDue(settings.lastBackupAt, settings.firstUseAt, now()) ? tata.backupDue : null);

  return (
    <main className="screen capture">
      <header className="capture__head">
        <Tata mood={mood} size={36} />
        <h1 className="question">{tata.ask}</h1>
        <ProfileMenu />
      </header>

      {recent.length > 0 && (
        <section className="recent" aria-label="Agora há pouco">
          <span className="label">Agora há pouco</span>
          <ul>
            {recent.map((entry) => (
              <li key={entry.id} className="recent__row">
                <span>{items.get(entry.itemId)?.name}</span>
                <span className="muted">{contextName(snapshot, entry.contextId)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="capture__links">
        {loose > 0 && (
          <button type="button" className="link-button" onClick={() => navigate({ name: 'lists', contextId: null })}>
            <span className="count count--quiet">{loose}</span> sem contexto
          </button>
        )}
        <button type="button" className="link-button" onClick={() => navigate({ name: 'batch' })}>
          Colar uma lista
        </button>
      </div>

      <div className="capture__bottom">
        {balloon && (
          <Say>
            {balloon}
            {!said && !offline && balloon === tata.backupDue && (
              <>
                {' '}
                <button type="button" className="link-button" onClick={() => navigate({ name: 'settings' })}>
                  Fazer backup
                </button>
              </>
            )}
          </Say>
        )}
        <div className="reach">
          <AddField
            snapshot={snapshot}
            onAdded={onAdded}
            opens="up"
            autoFocus
            inputRef={input}
          />
          <button type="button" className="pill" onClick={() => navigate({ name: 'lists' })}>
            Listas <span className="count">{totalMissing(snapshot)}</span>
          </button>
          <button type="button" className="pill pill--icon pill--solid" aria-label="Comprar" title="Comprar" onClick={() => setChoosing(true)}>
            <CartIcon />
          </button>
        </div>
      </div>

      {choosing && <ShopChooser snapshot={snapshot} onClose={() => setChoosing(false)} />}
    </main>
  );
}
