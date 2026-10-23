import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Backup } from './application/backup';
import { Contexts } from './application/contexts';
import { Lists } from './application/lists';
import { Settings } from './application/settings';
import { Synchronizer } from './application/synchronizer';
import { haptic, randomIds, requestPersistentStorage, startSyncTriggers, systemClock } from './infrastructure/browser';
import { DexieStore } from './infrastructure/dexie-store';
import { browserFiles } from './infrastructure/files';
import { HttpAccountApi } from './infrastructure/http-account-api';
import { HttpSyncApi, LOGIN_PATH, LOGOUT_PATH } from './infrastructure/http-sync-api';
import { App } from './ui/App';
import { ServicesProvider, type Services } from './ui/services';
import { takeBackFromLogin } from './ui/welcome-gate';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './ui/theme/tokens.css';
import './ui/theme/global.css';

// Composition root: the only place that picks the infrastructure behind each port.
const store = new DexieStore();
const sync = new Synchronizer(store, new HttpSyncApi(), systemClock);
const settings = new Settings(store, systemClock);
const services: Services = {
  lists: new Lists(store, systemClock, randomIds),
  contexts: new Contexts(store, systemClock, randomIds),
  backup: new Backup(store, systemClock),
  settings,
  sync,
  account: new HttpAccountApi(),
  files: browserFiles,
  haptic,
  now: systemClock.now,
  loginPath: LOGIN_PATH,
  logoutPath: LOGOUT_PATH,
};

takeBackFromLogin(window.location, window.history);
void requestPersistentStorage();
startSyncTriggers(() => void sync.sync(), (listener) => store.onChange(listener));

// The settings decide the first screen (setup or not, the hand), so they load before the first
// render; if they cannot be read, the app still opens with the defaults.
void settings.ready.catch(() => undefined).then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ServicesProvider services={services}>
        <App />
      </ServicesProvider>
    </StrictMode>,
  ),
);
