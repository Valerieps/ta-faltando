import { useEffect } from 'react';
import type { AccountApi } from '../../application/ports';
import type { Settings } from '../../application/settings';
import { initials } from '../initials';
import { navigate } from '../router';
import { useServices, useSettings, useSyncState } from '../services';

/** Asked once per page load; the answer stays in the device settings for when there is no internet. */
const asked = new WeakSet<AccountApi>();

function refreshEmail(account: AccountApi, settings: Settings) {
  if (asked.has(account)) return;
  asked.add(account);
  void account.email().then((email) => {
    if (email !== undefined && email !== settings.getState().email) void settings.set('email', email);
  });
}

/** The account's e-mail, or null when signed out; asks the server once per page load. */
export function useAccountEmail(): string | null {
  const { account, settings } = useServices();
  const { email } = useSettings();
  const sync = useSyncState();

  useEffect(() => {
    refreshEmail(account, settings);
  }, [account, settings]);

  return sync.status === 'signed-out' ? null : email;
}

/**
 * The phone's bar on top of the lists and the catalog: the app's name, and the circle with my
 * initials in the right corner, which opens Perfil (spec/itens-e-contextos.md).
 */
export function TopBar() {
  const email = useAccountEmail();
  const letters = email ? initials(email) : '';
  return (
    <header className="topbar">
      <span className="topbar__brand">Tá faltando</span>
      <button type="button" className="avatar" aria-label="Perfil" title={email ?? 'Perfil'} onClick={() => navigate({ name: 'profile' })}>
        {letters || <span className="avatar__empty" />}
      </button>
    </header>
  );
}
