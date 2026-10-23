import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { Lists } from '../application/lists';
import type { SyncState, Synchronizer } from '../application/synchronizer';

/** The use cases the screens call; built once in main.tsx. Screens never touch the database. */
export interface Services {
  readonly lists: Lists;
  readonly sync: Synchronizer;
  readonly loginPath: string;
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
  return useSyncExternalStore(sync.subscribe, sync.getState);
}
