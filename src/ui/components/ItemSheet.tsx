import { useEffect, useRef, useState } from 'react';
import { activeContexts, contextName, type Snapshot } from '../../domain/list-view';
import { CATEGORIES, OTHER_CATEGORY_NAME, categoryIdFor, categoryName, customCategories } from '../../domain/suggestion';
import { PlusIcon } from '../icons';
import { useServices } from '../services';

/**
 * The item's detail, opened by a tap on it: quantity, note, the list it is on ("só daquela vez" or
 * as the new default) and the category used to group shopping mode (spec/itens-e-contextos.md).
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
  const [moveTo, setMoveTo] = useState<string | null | undefined>(undefined);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  // The item was deleted on the other device while the sheet was open.
  useEffect(() => {
    if (!item) onClose();
  }, [item, onClose]);
  if (!item) return null;

  const current = entry ? entry.contextId : item.defaultContextId;
  const contexts = activeContexts(snapshot.contexts);

  async function chooseContext(contextId: string | null) {
    if (contextId === current) return setMoveTo(undefined);
    if (!entry) return lists.setDefaultContext(item!.id, contextId);
    setMoveTo(contextId);
  }

  async function addContext(name: string) {
    const context = await contextService.create(name);
    if (context) await chooseContext(context.id);
  }

  const categories = [
    ...CATEGORIES.map((c) => ({ id: c.id as string | null, name: c.name })),
    ...customCategories(snapshot.items).map((id) => ({ id: id as string | null, name: categoryName(id) })),
    { id: null, name: OTHER_CATEGORY_NAME },
  ];

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
          <legend className="label">{entry ? 'Lista' : 'Contexto padrão'}</legend>
          <div className="chips">
            {[...contexts.map((c) => c.id), null].map((id) => (
              <button
                key={id ?? 'none'}
                type="button"
                className={id === (moveTo === undefined ? current : moveTo) ? 'chip is-on' : 'chip'}
                aria-pressed={id === current}
                onClick={() => void chooseContext(id)}
              >
                {contextName(snapshot, id)}
              </button>
            ))}
            <AddChip label="Novo contexto" onAdd={addContext} />
          </div>
          {entry && moveTo !== undefined && (
            <div className="sheet__confirm">
              <span>Mover para {contextName(snapshot, moveTo)}:</span>
              <button type="button" className="pill" onClick={() => void lists.moveEntry(entry.id, moveTo, false).then(() => setMoveTo(undefined))}>
                Só desta vez
              </button>
              <button type="button" className="pill pill--solid" onClick={() => void lists.moveEntry(entry.id, moveTo, true).then(() => setMoveTo(undefined))}>
                Sempre
              </button>
            </div>
          )}
        </fieldset>

        <fieldset className="sheet__group">
          <legend className="label">Categoria</legend>
          <div className="chips">
            {categories.map((c) => (
              <button
                key={c.id ?? 'none'}
                type="button"
                className={c.id === item.category ? 'chip is-on' : 'chip'}
                aria-pressed={c.id === item.category}
                onClick={() => void lists.setCategory(item.id, c.id)}
              >
                {c.name}
              </button>
            ))}
            <AddChip label="Nova categoria" onAdd={(name) => lists.setCategory(item.id, categoryIdFor(name))} />
          </div>
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
          {confirmRemove ? (
            <button
              type="button"
              className="pill pill--danger"
              onClick={() => void lists.removeItem(item.id).then(() => dialog.current?.close())}
            >
              Tirar {item.name} do catálogo?
            </button>
          ) : (
            <button type="button" className="link-button" onClick={() => setConfirmRemove(true)}>
              Tirar do catálogo
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}

/** A "+" at the end of the chips that opens a field for a new name; Enter or leaving it adds. */
function AddChip({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button type="button" className="chip chip--add" aria-label={label} title={label} onClick={() => setEditing(true)}>
        <PlusIcon />
      </button>
    );
  }

  function finish(input: HTMLInputElement) {
    const name = input.value.trim();
    setEditing(false);
    if (name) void onAdd(name);
  }

  return (
    <input
      className="chip chip--input"
      aria-label={label}
      placeholder={label}
      autoFocus
      enterKeyHint="done"
      onBlur={(event) => finish(event.target)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setEditing(false);
        }
      }}
    />
  );
}
