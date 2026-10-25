import { useId, useMemo, useState, type KeyboardEvent, type Ref } from 'react';
import type { AddResult } from '../../application/lists';
import { parseEntryText } from '../../domain/entry-text';
import { contextName, destinationFor, type Snapshot } from '../../domain/list-view';
import { searchItems } from '../../domain/search';
import { useServices } from '../services';

interface Props {
  snapshot: Snapshot;
  onAdded: (result: AddResult) => void;
  /** The phone's field sits on the keyboard, so the suggestions open upward. */
  opens: 'up' | 'down';
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
  /** The context open in the phone's catalog: a name not yet in the catalog goes to it. */
  openContextId?: string | null;
  /** The context of a + in "Todos os itens": whatever is typed goes to its catalog and list. */
  into?: string;
}

/**
 * The field of the "+" button: autocomplete from the catalog, tolerant to accents and typos,
 * showing where each item goes before the enter (spec/itens-e-contextos.md). Enter adds exactly
 * what was typed and clears the field for the next item.
 */
export function AddField({ snapshot, onAdded, opens, autoFocus, inputRef, placeholder = 'Digite e aperte enter', openContextId, into }: Props) {
  const { lists } = useServices();
  const [text, setText] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const listId = useId();

  const parsed = parseEntryText(text);
  const matches = useMemo(() => searchItems(snapshot.items, parsed.name), [snapshot.items, parsed.name]);
  const typedDestination = parsed.name ? destinationFor(snapshot, parsed.name, openContextId) : undefined;

  async function add(value: string) {
    setText('');
    setHighlight(-1);
    const destination = destinationFor(snapshot, parseEntryText(value).name, openContextId);
    const result = into === undefined ? await lists.add(value, 'manual', destination.item ? undefined : destination.contextId) : await lists.addTo(value, into);
    if (result) onAdded(result);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (matches.length === 0) return;
      event.preventDefault();
      // Upward lists show the best match nearest the field, at the bottom.
      const step = (event.key === 'ArrowDown') === (opens === 'down') ? 1 : -1;
      // Cycles through "nothing highlighted" (-1) and each match.
      const places = matches.length + 1;
      setHighlight((h) => ((h + 1 + step + places) % places) - 1);
    } else if (event.key === 'Escape') {
      setHighlight(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = matches[highlight];
      if (chosen) void add(chooseWithDetails(chosen.name, text));
      else if (parsed.name) void add(text);
    }
  }

  const options = matches.map((item, index) => (
    <li
      key={item.id}
      id={`${listId}-${index}`}
      role="option"
      aria-selected={index === highlight}
      className={index === highlight ? 'autocomplete__option is-on' : 'autocomplete__option'}
      // Keeps the focus (and the phone keyboard) in the field.
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => void add(chooseWithDetails(item.name, text))}
    >
      <span>{item.name}</span>
      <span className="autocomplete__where">{contextName(snapshot, into ?? destinationFor(snapshot, item.name).contextId)}</span>
    </li>
  ));
  const showNew = parsed.name !== '' && !matches.some((m) => m.id === typedDestination?.item?.id);

  return (
    <div className={`add-field add-field--${opens}`}>
      {(matches.length > 0 || showNew) && (
        <ul className="autocomplete" id={listId} role="listbox" aria-label="Sugestões do catálogo">
          {opens === 'up' ? [...options].reverse() : options}
          {showNew && (
            <li className="autocomplete__new" aria-hidden="true">
              <span>Enter anota “{parsed.name}”</span>
              <span className="autocomplete__where">{contextName(snapshot, into ?? typedDestination!.contextId)}</span>
            </li>
          )}
        </ul>
      )}
      <div className="field">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="sentences"
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Item que está faltando"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={listId}
          aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setHighlight(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

/** A tapped suggestion keeps the quantity and note typed with it ("2 leit" → "2 Leite"). */
function chooseWithDetails(name: string, typed: string): string {
  const parsed = parseEntryText(typed);
  return `${parsed.quantity ?? ''} ${name}${parsed.note ? `: ${parsed.note}` : ''}`;
}
