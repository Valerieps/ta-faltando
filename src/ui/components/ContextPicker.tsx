import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import { activeContexts, contextName, type Snapshot } from '../../domain/list-view';
import { PencilIcon, PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices } from '../services';
import { CategoryEditor } from './CategoryEditor';

/**
 * The catalog's context dropdown: a "+" on its left creates a context, and the pencil on its
 * right renames the open one, moves it among the others, edits its categories or deactivates it.
 */
export function ContextPicker({ snapshot, current }: { snapshot: Snapshot; current: string | null }) {
  const { contexts } = useServices();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categoriesOf, setCategoriesOf] = useState<string | null>(null);
  const list = activeContexts(snapshot.contexts);
  const open = (contextId: string | null | undefined) => navigate({ name: 'catalog', contextId }, { replace: true });
  const index = list.findIndex((c) => c.id === current);
  const context = list[index];
  const categoryContext = list.find((c) => c.id === categoriesOf);

  return (
    <>
      <div className="ctx-picker">
        {!editing && (
          <button type="button" className="ctx-picker__add" aria-label="Novo contexto" title="Novo contexto" onClick={() => setAdding(true)}>
            <PlusIcon />
          </button>
        )}
        {adding ? (
          <input
            className="ctx-picker__select"
            aria-label="Nome do novo contexto"
            placeholder="Novo contexto"
            autoFocus
            onBlur={(event) => {
              const name = event.target.value;
              setAdding(false);
              void contexts.create(name).then((created) => created && open(created.id));
            }}
            onKeyDown={(event) => onEditKey(event, () => setAdding(false))}
          />
        ) : editing && context ? (
          <span
            className="ctx-picker__edit"
            onBlur={(event: FocusEvent<HTMLSpanElement>) => {
              if (event.currentTarget.contains(event.relatedTarget)) return;
              const input = event.currentTarget.querySelector('input');
              setEditing(false);
              if (input) void contexts.rename(context.id, input.value);
            }}
          >
            <input
              className="ctx-picker__select"
              defaultValue={context.name}
              aria-label={`Nome de ${context.name}`}
              autoFocus
              onKeyDown={(event) => onEditKey(event, () => setEditing(false))}
            />
            <button type="button" className="icon-button" aria-label="Para cima" disabled={index === 0} onClick={() => void contexts.move(context.id, -1)}>
              ↑
            </button>
            <button type="button" className="icon-button" aria-label="Para baixo" disabled={index === list.length - 1} onClick={() => void contexts.move(context.id, 1)}>
              ↓
            </button>
            <button type="button" className="link-button" onClick={() => setCategoriesOf(context.id)}>
              Categorias
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setEditing(false);
                void contexts.setActive(context.id, false).then(() => open(undefined));
              }}
            >
              Desativar
            </button>
          </span>
        ) : (
          <>
            <select className="ctx-picker__select" aria-label="Contexto" value={current ?? ''} onChange={(event) => open(event.target.value || null)}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="">{contextName(snapshot, null)}</option>
            </select>
            {context && (
              <button type="button" className="icon-button" aria-label={`Mudar o nome de ${context.name}`} title="Mudar o nome" onClick={() => setEditing(true)}>
                <PencilIcon />
              </button>
            )}
          </>
        )}
      </div>
      {categoryContext && <CategoryEditor context={categoryContext} snapshot={snapshot} onClose={() => setCategoriesOf(null)} />}
    </>
  );
}

/** Enter saves by leaving the field; Escape leaves without saving. */
function onEditKey(event: KeyboardEvent<HTMLInputElement>, cancel: () => void) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.blur();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    // Back to the old text first, in case leaving the field still saves it.
    event.currentTarget.value = event.currentTarget.defaultValue;
    cancel();
  }
}
