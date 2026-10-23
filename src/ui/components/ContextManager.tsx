import { useState } from 'react';
import { activeContexts, catalogOf, type Snapshot } from '../../domain/list-view';
import { navigate } from '../router';
import { useServices } from '../services';
import { CategoryEditor } from './CategoryEditor';

/**
 * The contexts: each one opens its catalog, and can be renamed, moved among the tabs, have its
 * categories edited or be deactivated; a new one goes at the end.
 */
export function ContextManager({ snapshot }: { snapshot: Snapshot }) {
  const { contexts } = useServices();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [categoriesOf, setCategoriesOf] = useState<string | null>(null);
  const list = activeContexts(snapshot.contexts);
  const inactive = snapshot.contexts.filter((c) => c.deletedAt === null && !c.active);
  const categoryContext = list.find((c) => c.id === categoriesOf);

  return (
    <div className="ctx-manager">
      <ul className="ctx-list">
        {list.map((context, index) => (
          <li key={context.id} className="ctx-list__row">
            {editing === context.id ? (
              <form
                className="ctx-list__edit"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = new FormData(event.currentTarget).get('name');
                  void contexts.rename(context.id, String(name ?? '')).then(() => setEditing(null));
                }}
              >
                <input name="name" defaultValue={context.name} aria-label="Nome do contexto" autoFocus />
                <button type="button" className="icon-button" aria-label="Subir" disabled={index === 0} onClick={() => void contexts.move(context.id, -1)}>
                  ↑
                </button>
                <button type="button" className="icon-button" aria-label="Descer" disabled={index === list.length - 1} onClick={() => void contexts.move(context.id, 1)}>
                  ↓
                </button>
                <button type="button" className="link-button" onClick={() => setCategoriesOf(context.id)}>
                  Categorias
                </button>
                <button type="button" className="link-button" onClick={() => void contexts.setActive(context.id, false).then(() => setEditing(null))}>
                  Desativar
                </button>
                <button type="submit" className="pill pill--solid">
                  Pronto
                </button>
              </form>
            ) : (
              <>
                <button type="button" className="ctx-list__open" onClick={() => navigate({ name: 'catalog', contextId: context.id })}>
                  <span>{context.name}</span>
                  <span className="muted">{catalogOf(snapshot.items, context.id).length} no catálogo</span>
                </button>
                <button type="button" className="link-button" onClick={() => setEditing(context.id)}>
                  Editar
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <form
          className="ctx-list__edit"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get('name') ?? '');
            void contexts.create(name).then(() => setAdding(false));
          }}
        >
          <input name="name" placeholder="Papelaria, açougue…" aria-label="Nome do novo contexto" autoFocus />
          <button type="button" className="link-button" onClick={() => setAdding(false)}>
            Cancelar
          </button>
          <button type="submit" className="pill pill--solid">
            Criar
          </button>
        </form>
      ) : (
        <button type="button" className="pill" onClick={() => setAdding(true)}>
          Novo contexto
        </button>
      )}

      {inactive.length > 0 && (
        <div className="ctx-manager__inactive">
          <span className="label">Desativados</span>
          <div className="chips chips--small">
            {inactive.map((c) => (
              <button key={c.id} type="button" className="chip" onClick={() => void contexts.create(c.name, c.id)}>
                Reativar {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {categoryContext && <CategoryEditor context={categoryContext} snapshot={snapshot} onClose={() => setCategoriesOf(null)} />}
    </div>
  );
}
