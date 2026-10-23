import { useState, type FocusEvent, type KeyboardEvent } from 'react';
import { activeContexts, contextName, type Snapshot } from '../../domain/list-view';
import { PencilIcon, PlusIcon } from '../icons';
import { navigate } from '../router';
import { useServices } from '../services';
import { CategoryEditor } from './CategoryEditor';

/**
 * The catalog's context chips: a "+" before them creates a context, and the pencil renames one,
 * moves it among the tabs, edits its categories or deactivates it. The pencil shows on hover on the computer, and on
 * the open chip on the phone.
 */
export function ContextChips({ snapshot, current }: { snapshot: Snapshot; current: string | null }) {
  const { contexts } = useServices();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [categoriesOf, setCategoriesOf] = useState<string | null>(null);
  const list = activeContexts(snapshot.contexts);
  const open = (contextId: string | null | undefined) => navigate({ name: 'catalog', contextId }, { replace: true });
  const categoryContext = list.find((c) => c.id === categoriesOf);

  return (
    <>
      <nav className="chips" aria-label="Contextos">
        {adding ? (
          <input
            className="chip chip--input"
            aria-label="Nome do novo contexto"
            placeholder="Novo contexto"
            autoFocus
            onBlur={(event) => {
              const name = event.target.value;
              setAdding(false);
              void contexts.create(name).then((context) => context && open(context.id));
            }}
            onKeyDown={(event) => onEditKey(event, () => setAdding(false))}
          />
        ) : (
          <button type="button" className="chip chip--add" aria-label="Novo contexto" title="Novo contexto" onClick={() => setAdding(true)}>
            <PlusIcon />
          </button>
        )}
        {list.map((context, index) =>
          editing === context.id ? (
            <span
              key={context.id}
              className="ctx-chip is-editing"
              onBlur={(event: FocusEvent<HTMLSpanElement>) => {
                if (event.currentTarget.contains(event.relatedTarget)) return;
                const input = event.currentTarget.querySelector('input');
                setEditing(null);
                if (input) void contexts.rename(context.id, input.value);
              }}
            >
              <input
                className="chip chip--input"
                defaultValue={context.name}
                aria-label={`Nome de ${context.name}`}
                autoFocus
                onKeyDown={(event) => onEditKey(event, () => setEditing(null))}
              />
              <button type="button" className="icon-button" aria-label="Para a esquerda" disabled={index === 0} onClick={() => void contexts.move(context.id, -1)}>
                ←
              </button>
              <button type="button" className="icon-button" aria-label="Para a direita" disabled={index === list.length - 1} onClick={() => void contexts.move(context.id, 1)}>
                →
              </button>
              <button type="button" className="link-button" onClick={() => setCategoriesOf(context.id)}>
                Categorias
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setEditing(null);
                  void contexts.setActive(context.id, false).then(() => current === context.id && open(undefined));
                }}
              >
                Desativar
              </button>
            </span>
          ) : (
            <span key={context.id} className="ctx-chip">
              <button
                type="button"
                className={context.id === current ? 'chip is-on' : 'chip'}
                aria-current={context.id === current ? 'page' : undefined}
                onClick={() => open(context.id)}
              >
                {context.name}
              </button>
              <button type="button" className="ctx-chip__edit" aria-label={`Mudar o nome de ${context.name}`} title="Mudar o nome" onClick={() => setEditing(context.id)}>
                <PencilIcon />
              </button>
            </span>
          ),
        )}
        <button type="button" className={current === null ? 'chip is-on' : 'chip'} aria-current={current === null ? 'page' : undefined} onClick={() => open(null)}>
          {contextName(snapshot, null)}
        </button>
      </nav>
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
