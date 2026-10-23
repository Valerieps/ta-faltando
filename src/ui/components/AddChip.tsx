import { useState } from 'react';
import { PlusIcon } from '../icons';

/** A "+" at the end of the chips that opens a field for a new name; Enter or leaving it adds. */
export function AddChip({ label, onAdd }: { label: string; onAdd: (name: string) => Promise<void> }) {
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
