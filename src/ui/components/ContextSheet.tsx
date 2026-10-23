import { useEffect, useRef, useState } from 'react';
import type { Context } from '../../domain/context';
import { activeContexts, type Snapshot } from '../../domain/list-view';
import { useServices } from '../services';
import { CategoryEditor } from './CategoryEditor';

/**
 * The pencil by a list's name: rename the context, move it among the tabs, edit its categories
 * or deactivate it (spec/itens-e-contextos.md).
 */
export function ContextSheet({ context, snapshot, onClose }: { context: Context; snapshot: Snapshot; onClose: () => void }) {
  const { contexts } = useServices();
  const dialog = useRef<HTMLDialogElement>(null);
  const [categories, setCategories] = useState(false);
  const list = activeContexts(snapshot.contexts);
  const index = list.findIndex((c) => c.id === context.id);

  useEffect(() => {
    if (!categories && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [categories]);

  if (categories) return <CategoryEditor context={context} snapshot={snapshot} onClose={() => setCategories(false)} />;

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} aria-label={`Editar ${context.name}`}>
      <div className="sheet__body">
        <div className="sheet__head">
          <input
            className="sheet__title"
            defaultValue={context.name}
            aria-label="Nome do contexto"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (!value) event.target.value = context.name;
              else if (value !== context.name) void contexts.rename(context.id, value);
            }}
          />
          <button type="button" className="pill pill--solid" onClick={() => dialog.current?.close()}>
            Pronto
          </button>
        </div>
        <div className="sheet__actions">
          <span className="muted">Posição nas abas</span>
          <span className="sheet__row">
            <button type="button" className="icon-button" aria-label="Para a esquerda" disabled={index <= 0} onClick={() => void contexts.move(context.id, -1)}>
              ←
            </button>
            <button type="button" className="icon-button" aria-label="Para a direita" disabled={index === list.length - 1} onClick={() => void contexts.move(context.id, 1)}>
              →
            </button>
          </span>
        </div>
        <div className="sheet__actions">
          <button type="button" className="pill" onClick={() => setCategories(true)}>
            Categorias
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              dialog.current?.close();
              void contexts.setActive(context.id, false);
            }}
          >
            Desativar
          </button>
        </div>
      </div>
    </dialog>
  );
}
