import { useEffect, useRef } from 'react';
import type { Context } from '../../domain/context';
import { contextCategories } from '../../domain/context-categories';
import type { Snapshot } from '../../domain/list-view';
import { categoryName } from '../../domain/suggestion';
import { useServices } from '../services';
import { AddChip } from './AddChip';

/**
 * The context's own categories, in the order of the store's aisles: each one can be renamed,
 * moved or deleted (its items go to "Outros"), and a new one goes at the end (spec/modo-compra.md).
 */
export function CategoryEditor({ context, snapshot, onClose }: { context: Context; snapshot: Snapshot; onClose: () => void }) {
  const { contexts } = useServices();
  const dialog = useRef<HTMLDialogElement>(null);
  const categories = contextCategories(context, snapshot.items);
  const count = (id: string) => snapshot.items.filter((i) => i.deletedAt === null && i.defaultContextId === context.id && i.category === id).length;

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} aria-labelledby="category-editor-title">
      <div className="sheet__body">
        <div className="sheet__head">
          <h2 id="category-editor-title">Categorias de {context.name}</h2>
          <button type="button" className="pill pill--solid" onClick={() => dialog.current?.close()}>
            Pronto
          </button>
        </div>
        <p className="muted">Na ordem do caminho da loja. Apagar uma categoria leva os itens dela para Outros.</p>
        {categories.length === 0 && <p className="muted">Nenhuma ainda: os itens ficam em Outros.</p>}
        <ul className="ctx-categories">
          {categories.map((id, index) => {
            const name = categoryName(id);
            return (
              <li key={id} className="ctx-categories__row">
                <input
                  defaultValue={name}
                  aria-label={`Nome da categoria ${name}`}
                  enterKeyHint="done"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value) event.target.value = name;
                    else if (value !== name) void contexts.renameCategory(context.id, id, value);
                  }}
                />
                <span className="muted" title="Itens nesta categoria">
                  {count(id)}
                </span>
                <button type="button" className="icon-button" aria-label={`Subir ${name}`} disabled={index === 0} onClick={() => void contexts.moveCategory(context.id, id, -1)}>
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Descer ${name}`}
                  disabled={index === categories.length - 1}
                  onClick={() => void contexts.moveCategory(context.id, id, 1)}
                >
                  ↓
                </button>
                <button type="button" className="icon-button" aria-label={`Apagar ${name}`} onClick={() => void contexts.removeCategory(context.id, id)}>
                  ×
                </button>
              </li>
            );
          })}
        </ul>
        <div className="chips">
          <AddChip label="Nova categoria" onAdd={async (name) => void (await contexts.addCategory(context.id, name))} />
        </div>
      </div>
    </dialog>
  );
}
