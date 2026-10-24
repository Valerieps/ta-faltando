import { useEffect, useRef } from 'react';
import { contextCategories } from '../../domain/context-categories';
import { itemContextIds } from '../../domain/item';
import { activeContexts, contextName, type Snapshot } from '../../domain/list-view';
import { OTHER_CATEGORY_NAME, categoryName } from '../../domain/suggestion';
import { TrashIcon } from '../icons';
import { AddChip } from './AddChip';
import { useServices } from '../services';

/**
 * The item's detail, opened by a tap on it: quantity, note, the item's contexts (one or more), the
 * list it is on "só desta vez" and the category used to group shopping mode
 * (spec/itens-e-contextos.md).
 */
export function ItemSheet({
  snapshot,
  itemId,
  entryId,
  onClose,
  onRemoveEntry,
}: {
  snapshot: Snapshot;
  itemId: string;
  entryId?: string;
  onClose: () => void;
  onRemoveEntry?: (entryId: string) => void;
}) {
  const { lists, contexts: contextService } = useServices();
  const dialog = useRef<HTMLDialogElement>(null);
  const item = snapshot.items.find((i) => i.id === itemId);
  const entry = entryId ? snapshot.entries.find((e) => e.id === entryId) : undefined;

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  // The item was deleted on the other device while the sheet was open.
  useEffect(() => {
    if (!item) onClose();
  }, [item, onClose]);
  if (!item) return null;

  const contexts = activeContexts(snapshot.contexts);
  const linked = itemContextIds(item);
  const isLinked = (id: string) => linked.includes(id);
  // An entry added through one of the item's contexts is on all of their lists.
  const onceIn = entry && entry.contextId !== null && !isLinked(entry.contextId) ? entry.contextId : undefined;

  async function addContext(name: string) {
    const context = await contextService.create(name);
    if (context) await lists.setContextLinked(item!.id, context.id, true);
  }

  // The category is the item's, the same in every context; the choices are those of its contexts.
  const homes = contexts.filter((c) => isLinked(c.id));
  const others = contexts.filter((c) => !isLinked(c.id));
  const own = [...new Set(homes.flatMap((c) => contextCategories(c, snapshot.items)))];
  const category = item.category !== null && own.includes(item.category) ? item.category : null;
  const categories = [...own.map((id) => ({ id: id as string | null, name: categoryName(id) })), { id: null, name: OTHER_CATEGORY_NAME }];

  async function addCategory(name: string) {
    let id: string | null = null;
    for (const home of homes) id = (await contextService.addCategory(home.id, name)) ?? id;
    if (id) await lists.setCategory(item!.id, id);
  }

  return (
    <dialog ref={dialog} className="sheet" onClose={onClose} aria-labelledby="item-sheet-title">
      <form method="dialog" className="sheet__body" onSubmit={(event) => event.preventDefault()}>
        <div className="sheet__head">
          <input
            id="item-sheet-title"
            className="sheet__title"
            defaultValue={item.name}
            aria-label="Nome do item"
            onBlur={(event) => event.target.value !== item.name && void lists.renameItem(item.id, event.target.value)}
          />
          <button type="button" className="pill" onClick={() => dialog.current?.close()}>
            Pronto
          </button>
        </div>

        {entry && (
          <div className="sheet__row">
            <label className="sheet__field">
              <span className="label">Quantidade</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={entry.quantity ?? ''}
                onBlur={(event) => {
                  const value = event.target.value === '' ? null : Number(event.target.value);
                  const quantity = value !== null && value > 0 ? value : null;
                  if (quantity !== entry.quantity) void lists.updateEntry(entry.id, { quantity, note: entry.note });
                }}
              />
            </label>
            <label className="sheet__field sheet__field--wide">
              <span className="label">Observação</span>
              <input
                type="text"
                defaultValue={entry.note ?? ''}
                placeholder="sem lactose, a marca de sempre…"
                onBlur={(event) => {
                  const note = event.target.value.trim() || null;
                  if (note !== entry.note) void lists.updateEntry(entry.id, { quantity: entry.quantity, note });
                }}
              />
            </label>
          </div>
        )}

        <fieldset className="sheet__group">
          <legend className="label">Contextos</legend>
          <div className="chips">
            {contexts.map((c) => (
              <button
                key={c.id}
                type="button"
                className={isLinked(c.id) ? 'chip is-on' : 'chip'}
                aria-pressed={isLinked(c.id)}
                onClick={() => void lists.setContextLinked(item.id, c.id, !isLinked(c.id))}
              >
                {c.name}
              </button>
            ))}
            <AddChip label="Novo contexto" onAdd={addContext} />
          </div>
          {homes.length === 0 && <p className="muted">Sem contexto: toque num contexto para vincular o item.</p>}
        </fieldset>

        {entry && others.length > 0 && (
          <fieldset className="sheet__group">
            <legend className="label">Só desta vez em</legend>
            <div className="chips">
              {others.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={c.id === onceIn ? 'chip is-on' : 'chip'}
                  aria-pressed={c.id === onceIn}
                  onClick={() => void lists.moveEntry(entry.id, c.id === onceIn ? (homes[0]?.id ?? null) : c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="muted">
              {onceIn ? `Nesta vez, só na lista de ${contextName(snapshot, onceIn)}.` : 'Está nas listas dos contextos do item.'}
            </p>
          </fieldset>
        )}

        <fieldset className="sheet__group">
          <legend className="label">Categoria</legend>
          {homes.length === 0 && <p className="muted">Escolha um contexto para escolher a categoria.</p>}
          {homes.length > 0 && (
            <div className="chips">
              {categories.map((c) => (
                <button
                  key={c.id ?? 'none'}
                  type="button"
                  className={c.id === category ? 'chip is-on' : 'chip'}
                  aria-pressed={c.id === category}
                  onClick={() => void lists.setCategory(item.id, c.id)}
                >
                  {c.name}
                </button>
              ))}
              <AddChip label="Nova categoria" onAdd={addCategory} />
            </div>
          )}
        </fieldset>

        <div className="sheet__actions">
          {entry && onRemoveEntry && (
            <button
              type="button"
              className="pill"
              onClick={() => {
                onRemoveEntry(entry.id);
                dialog.current?.close();
              }}
            >
              Tirar da lista
            </button>
          )}
          <button
            type="button"
            className="icon-button sheet__trash"
            aria-label={`Tirar ${item.name} do catálogo`}
            title="Tirar do catálogo"
            onClick={() => void lists.removeItem(item.id).then(() => dialog.current?.close())}
          >
            <TrashIcon />
          </button>
        </div>
      </form>
    </dialog>
  );
}
