import { useEffect, useRef, useState } from 'react';
import { backupDue } from '../../application/backup';
import type { AddResult } from '../../application/lists';
import { splitBatch, type EntryText } from '../../domain/entry-text';
import { contextName, itemsById, itemsWithoutContext, totalMissing, type Snapshot } from '../../domain/list-view';
import { AddField } from '../components/AddField';
import { BatchReview } from '../components/BatchReview';
import { Say } from '../components/Say';
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
  const { speech, now } = useServices();
  const settings = useSettings();
  const sync = useSyncState();
  const input = useRef<HTMLInputElement>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [happy, setHappy] = useState(false);
  const [listening, setListening] = useState<(() => void) | null>(null);
  const [heard, setHeard] = useState<EntryText[] | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    if (!happy) return;
    const timer = setTimeout(() => setHappy(false), 1100);
    return () => clearTimeout(timer);
  }, [happy]);
  useEffect(() => () => listening?.(), [listening]);

  function onAdded(result: AddResult) {
    setSaid(tata.added(result, result.entry.contextId === null ? null : contextName(snapshot, result.entry.contextId)));
    setHappy(true);
  }

  function listen() {
    setMicError(null);
    setSaid(null);
    let text = '';
    const stop = speech.listen(
      (heardText) => (text = heardText),
      (error) => {
        setListening(null);
        if (error === 'denied') setMicError('O navegador não deixou usar o microfone.');
        else if (error) setMicError('O reconhecimento de voz não funcionou agora.');
        else if (text) setHeard(splitBatch(text));
        else setSaid(tata.heardNothing);
      },
    );
    setListening(() => stop);
  }

  if (heard) {
    return (
      <main className="screen capture">
        <h1 className="question">Conferir</h1>
        <BatchReview
          entries={heard}
          snapshot={snapshot}
          via="voice"
          onCancel={() => setHeard(null)}
          onDone={(results) => {
            setHeard(null);
            setSaid(tata.addedMany(results.length));
            setHappy(true);
          }}
        />
      </main>
    );
  }

  const items = itemsById(snapshot.items);
  const recent = [...snapshot.entries]
    .filter((e) => e.deletedAt === null && e.status === 'pending')
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, RECENT);
  const loose = itemsWithoutContext(snapshot).length;
  const offline = sync.status === 'offline';
  const mood: TataMood = listening ? 'listening' : happy ? 'happy' : offline ? 'sleeping' : 'attentive';
  const balloon = listening ? tata.listening : (said ?? (offline ? tata.offline : backupDue(settings.lastBackupAt, settings.firstUseAt, now()) ? tata.backupDue : null));

  return (
    <main className="screen capture">
      <header className="capture__head">
        <Tata mood={mood} size={36} />
        <h1 className="question">{tata.ask}</h1>
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
        {micError && <p className="error">{micError}</p>}
        {balloon && (
          <Say>
            {balloon}
            {!said && !listening && !offline && balloon === tata.backupDue && (
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
            onMic={speech.supported ? (listening ? () => listening() : listen) : undefined}
          />
          <button type="button" className="pill" onClick={() => navigate({ name: 'lists' })}>
            Listas <span className="count">{totalMissing(snapshot)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
