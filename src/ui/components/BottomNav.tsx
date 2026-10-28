import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { backupDue } from '../../application/backup';
import type { AddResult } from '../../application/lists';
import { contextName, type Snapshot } from '../../domain/list-view';
import { PlusIcon } from '../icons';
import { navigate } from '../router';
import { pasteBatch } from '../screens/SimpleScreens';
import { useServices, useSettings, useSyncState } from '../services';
import { tata } from '../tata-lines';
import { AddField } from './AddField';
import { Say } from './Say';
import { useKeyboardClosed } from './useKeyboardClosed';

/**
 * The phone's round +, on the side of the chosen hand, the only way to add on the phone
 * (spec/itens-e-contextos.md). It opens the add field in its place, on the keyboard, without
 * leaving the screen; leaving the field, or closing the keyboard, brings the + back. Beside the
 * field, "Colar uma lista" opens the batch, and so does pasting a list into it. On the Tudo of a
 * list, `openContextId` is that list's context: a new name typed in the + goes to it.
 */
export function BottomNav({ snapshot, openContextId, startOpen = false }: { snapshot: Snapshot; openContextId?: string; startOpen?: boolean }) {
  const { now } = useServices();
  const settings = useSettings();
  const sync = useSyncState();
  const [adding, setAdding] = useState(startOpen);
  const [said, setSaid] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useKeyboardClosed(adding, () => setAdding(false));

  // Opened by the icon's shortcut: the field shows at once, and the phone may open the keyboard.
  useEffect(() => {
    if (startOpen) input.current?.focus();
  }, [startOpen]);

  function open() {
    setSaid(null);
    // Rendered and focused inside the tap, so the phone opens the keyboard.
    flushSync(() => setAdding(true));
    input.current?.focus();
  }

  function onAdded(result: AddResult) {
    setSaid(tata.added(result, result.entry.contextId === null ? null : contextName(snapshot, result.entry.contextId)));
  }

  if (!adding) {
    return (
      <nav className="bottom-nav" aria-label="Anotar">
        <button type="button" className="fab" aria-label="Anotar" title="Anotar" onClick={open}>
          <PlusIcon />
        </button>
      </nav>
    );
  }

  const offline = sync.status === 'offline';
  const backupLate = !offline && backupDue(settings.lastBackupAt, settings.firstUseAt, now());
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
      {said ? (
        <Say>{said}</Say>
      ) : offline ? (
        <Say mood="sleeping">{tata.offline}</Say>
      ) : (
        backupLate && (
          <Say mood="attentive">
            {tata.backupDue}{' '}
            <button type="button" className="link-button" onClick={() => navigate({ name: 'profile' })}>
              Fazer backup
            </button>
          </Say>
        )
      )}
      <AddField snapshot={snapshot} onAdded={onAdded} opens="up" inputRef={input} placeholder={tata.ask} openContextId={openContextId} onPasteList={pasteBatch} />
      <button type="button" className="link-button bottom-add__batch" onClick={() => pasteBatch('')}>
        Colar uma lista
      </button>
    </div>
  );
}
