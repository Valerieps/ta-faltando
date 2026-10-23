import { useState } from 'react';
import type { AddResult } from '../../application/lists';
import { entryDetails, type EntryText } from '../../domain/entry-text';
import type { ItemOrigin } from '../../domain/item';
import { contextName, destinationFor, type Snapshot } from '../../domain/list-view';
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
}: {
  entries: readonly EntryText[];
  snapshot: Snapshot;
  via: ItemOrigin;
  onDone: (results: AddResult[]) => void;
  onCancel?: () => void;
}) {
  const { lists } = useServices();
  const [removed, setRemoved] = useState<ReadonlySet<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const kept = entries.filter((_, i) => !removed.has(i));

  async function save() {
    setSaving(true);
    try {
      onDone(await lists.addMany(kept, via));
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
          const where = destinationFor(snapshot, entry.name).contextId;
          const details = entryDetails(entry);
          return (
            <li key={i} className="parsed__row">
              <span className="parsed__name">
                {entry.name}
                {details && <span className="muted"> · {details}</span>}
              </span>
              <span className={where === null ? 'parsed__where is-none' : 'parsed__where'}>{contextName(snapshot, where)}</span>
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
