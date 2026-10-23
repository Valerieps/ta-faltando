import { useServices, useSyncState } from './services';
import { syncStatusText } from './sync-status-text';

export function SyncIndicator() {
  const { loginPath } = useServices();
  const state = useSyncState();
  return (
    <p className="sync-indicator" role="status" data-status={state.status}>
      {syncStatusText(state)}
      {state.status === 'signed-out' && (
        // Same-origin navigation: Cloudflare Access shows the Google login and comes back.
        <a className="sync-indicator__login" href={loginPath}>
          Entrar
        </a>
      )}
    </p>
  );
}
