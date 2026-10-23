import type { Context } from '../../domain/context';
import { entryDetails } from '../../domain/entry-text';
import type { Item } from '../../domain/item';
import { isChecked, type ListEntry } from '../../domain/list-entry';
import { contextCategories } from '../../domain/context-categories';
import { groupByCategory } from '../../domain/list-view';
import { TrashIcon } from '../icons';

interface RowsProps {
  entries: readonly ListEntry[];
  items: ReadonlyMap<string, Item>;
  context: Context | undefined;
  grouped: boolean;
  fading: ReadonlyMap<string, ListEntry>;
  onTrash: (entry: ListEntry) => void;
  onUndo: (entryId: string) => void;
  onOpen: (entry: ListEntry) => void;
  /** On the computer the lists also strike items (spec/sincronizacao.md); on the phone only the trash. */
  onToggle?: (entry: ListEntry) => void;
}

/** A list's rows, flat or grouped by category, with the trash and the fading "Desfazer". */
export function ListRows(props: RowsProps) {
  const { entries, items, context, grouped } = props;
  if (!grouped) {
    return (
      <ul className="rows">
        {entries.map((entry) => (
          <ListRow key={entry.id} entry={entry} item={items.get(entry.itemId)} {...props} />
        ))}
      </ul>
    );
  }
  return (
    <div className="groups">
      {groupByCategory(entries, items, contextCategories(context, items.values())).map((group) => (
        <section key={group.categoryId ?? 'outros'} className="group">
          <h3 className="label">{group.name}</h3>
          <ul className="rows">
            {group.entries.map((entry) => (
              <ListRow key={entry.id} entry={entry} item={items.get(entry.itemId)} {...props} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ListRow({ entry, item, fading, onTrash, onUndo, onOpen, onToggle }: RowsProps & { entry: ListEntry; item: Item | undefined }) {
  const name = item?.name ?? '…';
  const details = entryDetails(entry);
  const checked = isChecked(entry);
  if (fading.has(entry.id)) {
    return (
      <li className="row is-fading">
        <span className="row__name">{name}</span>
        <button type="button" className="undo" onClick={() => onUndo(entry.id)}>
          Desfazer
        </button>
      </li>
    );
  }
  return (
    <li className={checked ? 'row is-checked' : 'row'}>
      {onToggle && (
        <button type="button" className={checked ? 'check is-on' : 'check'} aria-label={checked ? `Tirar o risco de ${name}` : `Riscar ${name}`} aria-pressed={checked} onClick={() => onToggle(entry)} />
      )}
      <button type="button" className="row__main" onClick={() => onOpen(entry)}>
        <span className="row__name">{name}</span>
        {details && <span className="row__meta">{details}</span>}
      </button>
      <button type="button" className="icon-button trash" aria-label={`Tirar ${name} da lista`} onClick={() => onTrash(entry)}>
        <TrashIcon />
      </button>
    </li>
  );
}
