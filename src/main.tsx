import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Lists } from './application/lists';
import { Synchronizer } from './application/synchronizer';
import { randomIds, requestPersistentStorage, startSyncTriggers, systemClock } from './infrastructure/browser';
import { DexieStore } from './infrastructure/dexie-store';
import { HttpSyncApi, LOGIN_PATH } from './infrastructure/http-sync-api';
import { App } from './ui/App';
import { ServicesProvider, type Services } from './ui/services';
import './ui/theme/tokens.css';
import './ui/theme/global.css';

// Composition root: the only place that picks the infrastructure behind each port.
const store = new DexieStore();
const sync = new Synchronizer(store, new HttpSyncApi(), systemClock);
const services: Services = { lists: new Lists(store, systemClock, randomIds), sync, loginPath: LOGIN_PATH };

void requestPersistentStorage();
startSyncTriggers(() => void sync.sync(), (listener) => store.onChange(listener));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <App />
    </ServicesProvider>
  </StrictMode>,
);
