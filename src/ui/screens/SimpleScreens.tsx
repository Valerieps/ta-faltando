import { useState } from 'react';
import { splitBatch, type EntryText } from '../../domain/entry-text';
import { activeContexts, contextName, itemsWithoutContext, type Snapshot } from '../../domain/list-view';
import { BatchReview } from '../components/BatchReview';
import { Catalog } from '../components/Catalog';
import { ContextManager } from '../components/ContextManager';
import { Say } from '../components/Say';
import { SettingsPanel } from '../components/SettingsPanel';
import { Uncontexted } from '../components/Uncontexted';
import { goBack, navigate } from '../router';
import { Tata } from '../Tata';
import { tata } from '../tata-lines';

// The phone's secondary screens: a title on top, the content, and the buttons at the bottom,
// by the thumb (identity draft, "Só com a mão direita").

/** The contexts, with the items without context on top; each context opens its catalog. */
export function ContextsScreen({ snapshot }: { snapshot: Snapshot }) {
  const loose = itemsWithoutContext(snapshot).length;
  return (
    <main className="screen">
      <h1 className="title">Contextos</h1>
      <div className="screen__body">
        {loose > 0 && (
          <section className="panel">
            <div className="panel__head">
              <Tata mood="thinking" size={28} />
              <h2>{loose === 1 ? '1 item sem contexto' : `${loose} itens sem contexto`}</h2>
            </div>
            <Uncontexted snapshot={snapshot} limit={3} />
          </section>
        )}
        <ContextManager snapshot={snapshot} />
      </div>
      <div className="reach">
        <button type="button" className="pill" onClick={() => navigate({ name: 'settings' })}>
          Ajustes
        </button>
        <button type="button" className="pill pill--solid" onClick={() => navigate({ name: 'lists' })}>
          Listas
        </button>
      </div>
    </main>
  );
}

export function CatalogScreen({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const contexts = activeContexts(snapshot.contexts);
  const id = contextId === undefined ? (contexts[0]?.id ?? null) : contextId;
  return (
    <main className="screen">
      <h1 className="title">Catálogo · {contextName(snapshot, id)}</h1>
      <div className="screen__body">
        <Catalog snapshot={snapshot} contextId={id} />
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
