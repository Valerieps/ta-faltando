import { useState } from 'react';
import { splitBatch, type EntryText } from '../../domain/entry-text';
import { activeContexts, type Snapshot } from '../../domain/list-view';
import { BatchReview } from '../components/BatchReview';
import { Catalog } from '../components/Catalog';
import { ContextChips } from '../components/ContextChips';
import { Say } from '../components/Say';
import { SettingsPanel } from '../components/SettingsPanel';
import { goBack, navigate } from '../router';
import { tata } from '../tata-lines';

// The phone's secondary screens: a title on top, the content, and the buttons at the bottom,
// by the thumb (identity draft, "Só com a mão direita").

export function CatalogScreen({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const contexts = activeContexts(snapshot.contexts);
  const id = contextId === undefined ? (contexts[0]?.id ?? null) : contextId;
  return (
    <main className="screen">
      <h1 className="title">Catálogo</h1>
      <div className="screen__body">
        <ContextChips snapshot={snapshot} current={id} />
        <Catalog key={id ?? 'none'} snapshot={snapshot} contextId={id} />
      </div>
      <div className="reach">
        <button type="button" className="pill" onClick={goBack}>
          Voltar
        </button>
        <button type="button" className="pill pill--solid" onClick={() => navigate({ name: 'lists', contextId: id })}>
          Ver a lista
        </button>
      </div>
    </main>
  );
}

/** "Em lote": each line or comma becomes an item; pasted lists from another app work too. */
export function BatchScreen({ snapshot }: { snapshot: Snapshot }) {
  const [text, setText] = useState('');
  const [review, setReview] = useState<EntryText[] | null>(null);
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

export function SettingsScreen() {
  return (
    <main className="screen">
      <h1 className="title">Ajustes</h1>
      <div className="screen__body">
        <SettingsPanel showHand />
      </div>
      <div className="reach">
        <button type="button" className="pill pill--solid" onClick={goBack}>
          Voltar
        </button>
      </div>
    </main>
  );
}
