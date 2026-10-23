import { useCallback, useState } from 'react';
import { activeContexts } from '../domain/list-view';
import { DesktopApp } from './desktop/DesktopApp';
import { navigate, useRoute } from './router';
import { Capture } from './screens/Capture';
import { ListsScreen } from './screens/ListsScreen';
import { Setup } from './screens/Setup';
import { ShoppingMode } from './screens/ShoppingMode';
import { BatchScreen, CatalogScreen, ContextsScreen, SettingsScreen } from './screens/SimpleScreens';
import { useIsDesktop, useServices, useSettings, useSnapshot } from './services';

/**
 * The app shell: the setup on first use, then the phone's screens (capture first) or the
 * computer's layout (lists first). The hand chosen in the settings mirrors the phone's controls.
 */
export function App() {
  const { settings } = useServices();
  const { snapshot, loaded } = useSnapshot();
  const device = useSettings();
  const route = useRoute();
  const desktop = useIsDesktop();
  // Decided once the data is read: the setup shows on a device with no contexts that has not done it.
  const [firstSetup, setFirstSetup] = useState<boolean | null>(null);
  if (loaded && firstSetup === null) setFirstSetup(!device.setupDone && activeContexts(snapshot.contexts).length === 0);

  const finishSetup = useCallback(() => {
    void settings.set('setupDone', true);
    setFirstSetup(false);
    navigate({ name: 'home' }, { replace: true });
  }, [settings]);

  if (!loaded || firstSetup === null) return <div className="shell" aria-busy="true" />;

  let screen;
  if (firstSetup || route.name === 'setup') {
    screen = <Setup snapshot={snapshot} redo={!firstSetup} onFinish={finishSetup} />;
  } else if (desktop) {
    screen = <DesktopApp snapshot={snapshot} route={route} />;
  } else {
    switch (route.name) {
      case 'lists':
      case 'uncontexted':
        screen = <ListsScreen snapshot={snapshot} contextId={route.name === 'uncontexted' ? null : route.contextId} />;
        break;
      case 'contexts':
        screen = <ContextsScreen snapshot={snapshot} />;
        break;
      case 'catalog':
        screen = <CatalogScreen snapshot={snapshot} contextId={route.contextId} />;
        break;
      case 'shop':
        screen = <ShoppingMode snapshot={snapshot} contextId={route.contextId} />;
        break;
      case 'batch':
        screen = <BatchScreen snapshot={snapshot} />;
        break;
      case 'settings':
        screen = <SettingsScreen />;
        break;
      default:
        screen = <Capture snapshot={snapshot} />;
    }
  }

  return (
    <div className="shell" data-hand={device.hand} data-layout={desktop ? 'desktop' : 'phone'}>
      {screen}
    </div>
  );
}
