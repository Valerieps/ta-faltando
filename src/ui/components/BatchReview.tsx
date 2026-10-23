import { useState } from 'react';
import type { AddResult } from '../../application/lists';
import { entryDetails, type EntryText } from '../../domain/entry-text';
import type { ItemOrigin } from '../../domain/item';
import { activeContexts, contextName, destinationFor, type Snapshot } from '../../domain/list-view';
import { useServices } from '../services';
import { tata } from '../tata-lines';
import { Say } from './Say';

/**
 * The check before saving a batch or what the mic heard: each item with the list it goes to
 * (spec/itens-e-contextos.md). An item can be taken out before saving.
 */
export function BatchReview({
  entries,
  snapshot,
  via,
  onDone,
  onCancel,
  pickContext = false,
}: {
  entries: readonly EntryText[];
  snapshot: Snapshot;
  via: ItemOrigin;
  onDone: (results: AddResult[]) => void;
  onCancel?: () => void;
  /** Shows each item's context as a dropdown the owner can change (desktop). */
  pickContext?: boolean;
}) {
  const { lists } = useServices();
  const [removed, setRemoved] = useState<ReadonlySet<number>>(new Set());
  const [chosen, setChosen] = useState<ReadonlyMap<number, string | null>>(new Map());
  const [saving, setSaving] = useState(false);
  const keptIndexes = entries.map((_, i) => i).filter((i) => !removed.has(i));
  const kept = keptIndexes.map((i) => entries[i]!);
  const contexts = activeContexts(snapshot.contexts);

  async function save() {
    setSaving(true);
    try {
      onDone(await lists.addMany(kept, via, keptIndexes.map((i) => chosen.get(i))));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="batch-review">
      <Say mood="thinking">{tata.batchSplit(kept.length)}</Say>
      <ul className="parsed">
        {entries.map((entry, i) => {
          if (removed.has(i)) return null;
          const where = chosen.has(i) ? chosen.get(i)! : destinationFor(snapshot, entry.name).contextId;
          const details = entryDetails(entry);
          return (
            <li key={i} className="parsed__row">
              <span className="parsed__name">
                {entry.name}
                {details && <span className="muted"> · {details}</span>}
              </span>
              {pickContext ? (
                <select
                  className={where === null ? 'parsed__where parsed__pick is-none' : 'parsed__where parsed__pick'}
                  value={where ?? ''}
                  aria-label={`Contexto de ${entry.name}`}
                  onChange={(event) => setChosen(new Map(chosen).set(i, event.target.value || null))}
                >
                  {contexts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="">Sem contexto</option>
                </select>
              ) : (
                <span className={where === null ? 'parsed__where is-none' : 'parsed__where'}>{contextName(snapshot, where)}</span>
              )}
              <button type="button" className="icon-button" aria-label={`Tirar ${entry.name}`} onClick={() => setRemoved(new Set(removed).add(i))}>
                ×
              </button>
            </li>
          );
        })}
      </ul>
      <div className="reach">
        {onCancel && (
          <button type="button" className="pill" onClick={onCancel}>
            Voltar
          </button>
        )}
        <button type="button" className="btn" disabled={kept.length === 0 || saving} onClick={() => void save()}>
          {kept.length === 1 ? 'Adicionar 1 item' : `Adicionar ${kept.length} itens`}
        </button>
      </div>
    </div>
  );
}
