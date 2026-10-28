import { useState } from 'react';
import { splitBatch, type EntryText } from '../../domain/entry-text';
import type { Snapshot } from '../../domain/list-view';
import { BatchReview } from '../components/BatchReview';
import { Say } from '../components/Say';
import { goBack, navigate } from '../router';
import { tata } from '../tata-lines';

// The phone's secondary screens: a title on top, the content, and the buttons at the bottom,
// by the thumb (identity draft, "Só com a mão direita").

// The text pasted into the + on its way to the batch, taken by the batch when it opens.
let pasted = '';

/** Opens the batch; a list pasted into the + goes straight to the review there. */
export function pasteBatch(text: string): void {
  pasted = text;
  navigate({ name: 'batch' });
}

/** "Em lote": each line or comma becomes an item; pasted lists from another app work too. */
export function BatchScreen({ snapshot }: { snapshot: Snapshot }) {
  const [text, setText] = useState(() => {
    const taken = pasted;
    pasted = '';
    return taken;
  });
  const [review, setReview] = useState<EntryText[] | null>(() => (text ? splitBatch(text) : null));
  const [said, setSaid] = useState<string | null>(null);

  return (
    <main className="screen">
      <h1 className="title">Adicionar em lote</h1>
      <div className="screen__body">
        {said && <Say mood="happy">{said}</Say>}
        {review ? (
          <BatchReview
            entries={review}
            snapshot={snapshot}
            via="batch"
            onCancel={() => setReview(null)}
            onDone={(results) => {
              setReview(null);
              setText('');
              setSaid(tata.addedMany(results.length));
            }}
          />
        ) : (
          <textarea
            className="batch-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'tomate, cebola, 2 limão\nshampoo\nareia do gato e fita dupla-face'}
            aria-label="Itens, um por linha ou separados por vírgula"
            rows={8}
          />
        )}
      </div>
      {!review && (
        <div className="reach">
          <button type="button" className="pill" onClick={goBack}>
            Voltar
          </button>
          <button
            type="button"
            className="btn"
            disabled={splitBatch(text).length === 0}
            onClick={() => {
              setSaid(null);
              setReview(splitBatch(text));
            }}
          >
            Separar os itens
          </button>
        </div>
      )}
    </main>
  );
}
