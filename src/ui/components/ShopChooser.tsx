import { useEffect, useRef } from 'react';
import { activeContexts, missingCount, type Snapshot } from '../../domain/list-view';
import { navigate } from '../router';

/** From the capture, the lists that have something missing, to enter shopping mode in one of them. */
export function ShopChooser({ snapshot, onClose }: { snapshot: Snapshot; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lists = activeContexts(snapshot.contexts)
    .map((context) => ({ context, count: missingCount(snapshot, context.id) }))
    .filter(({ count }) => count > 0);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} aria-labelledby="shop-chooser-title">
      <div className="sheet__body">
        <h2 id="shop-chooser-title">Comprar em qual lista?</h2>
        {lists.length === 0 && <p className="muted">Nenhuma lista tem item faltando.</p>}
        <div className="shop-chooser">
          {lists.map(({ context, count }) => (
            <button key={context.id} type="button" className="pill shop-chooser__option" onClick={() => navigate({ name: 'shop', contextId: context.id })}>
              {context.name} <span className="count">{count}</span>
            </button>
          ))}
        </div>
        <button type="button" className="pill" onClick={() => dialog.current?.close()}>
          Cancelar
        </button>
      </div>
    </dialog>
  );
}
