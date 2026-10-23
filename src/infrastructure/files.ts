import type { FileAccess } from '../application/ports';

// The File System Access API is not in TypeScript's DOM types, and Android Chrome lacks it.
type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }> }>;

/** The backup file goes where the owner chooses: a save dialog where there is one, a download elsewhere. */
export const browserFiles: FileAccess = {
  async save(fileName, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const picker = (window as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    if (picker) {
      try {
        const handle = await picker({ suggestedName: fileName, types: [{ description: 'Backup do Tá faltando', accept: { 'application/json': ['.json'] } }] });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return false;
        throw error;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  },

  open() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) resolve(null);
        else file.text().then(resolve, () => resolve(null));
      });
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  },
};
