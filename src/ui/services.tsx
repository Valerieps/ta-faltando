import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Backup } from '../application/backup';
import type { Contexts } from '../application/contexts';
import type { Lists } from '../application/lists';
import type { AccountApi, FileAccess } from '../application/ports';
import type { DeviceSettings, Settings } from '../application/settings';
import type { SyncState, Synchronizer } from '../application/synchronizer';
import { EMPTY_SNAPSHOT, type Snapshot } from '../domain/list-view';

/** The use cases the screens call; built once in main.tsx. Screens never touch the database. */
export interface Services {
  readonly lists: Lists;
  readonly contexts: Contexts;
  readonly backup: Backup;
  readonly settings: Settings;
  readonly sync: Synchronizer;
  readonly account: AccountApi;
  readonly files: FileAccess;
  readonly haptic: () => void;
  readonly now: () => number;
  readonly loginPath: string;
  readonly logoutPath: string;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices outside ServicesProvider');
  return services;
}

export function useSyncState(): SyncState {
  const { sync } = useServices();
  return useSyncExternalStore(sync.subscribe, sync.getState, sync.getState);
}

export function useSettings(): DeviceSettings {
  const { settings } = useServices();
  return useSyncExternalStore(settings.subscribe, settings.getState, settings.getState);
}

/** The data the screens show, read again after every change on this device or from sync. */
export function useSnapshot(): { snapshot: Snapshot; loaded: boolean } {
  const { lists } = useServices();
  const [state, setState] = useState({ snapshot: EMPTY_SNAPSHOT, loaded: false });
  useEffect(() => {
    let alive = true;
    let reading = false;
    let again = false;
    const read = async () => {
      if (reading) {
        again = true;
        return;
      }
      reading = true;
      do {
        again = false;
        const snapshot = await lists.snapshot();
        if (alive) setState({ snapshot, loaded: true });
      } while (again && alive);
      reading = false;
    };
    void read();
    const stop = lists.onChange(() => void read());
    return () => {
      alive = false;
      stop();
    };
  }, [lists]);
  return state;
}

/** The computer layout starts at 1024 px (identity draft, "Computador"). */
const DESKTOP = '(min-width: 1024px)';

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia(DESKTOP);
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    },
    () => window.matchMedia(DESKTOP).matches,
  );
}
