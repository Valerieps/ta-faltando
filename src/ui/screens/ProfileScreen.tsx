import { useEffect } from 'react';
import type { AccountApi } from '../../application/ports';
import type { Settings } from '../../application/settings';
import { BottomNav } from '../components/BottomNav';
import { SettingsPanel } from '../components/SettingsPanel';
import { initials } from '../initials';
import { useServices, useSettings, useSyncState } from '../services';
import { signOut } from '../sign-out';
import { SyncIndicator } from '../SyncIndicator';

/** Asked once per page load; the answer stays in the device settings for when there is no internet. */
const asked = new WeakSet<AccountApi>();

function refreshEmail(account: AccountApi, settings: Settings) {
  if (asked.has(account)) return;
  asked.add(account);
  void account.email().then((email) => {
    if (email !== undefined && email !== settings.getState().email) void settings.set('email', email);
  });
}

/**
 * The phone's Perfil tab: my account and the sync on top, then every setting (the hand, the
 * backup, redoing the setup), and leaving the account at the end (spec/itens-e-contextos.md).
 */
export function ProfileScreen() {
  const { account, settings, loginPath, logoutPath } = useServices();
  const { email: savedEmail } = useSettings();
  const sync = useSyncState();

  useEffect(() => refreshEmail(account, settings), [account, settings]);

  const email = sync.status === 'signed-out' ? null : savedEmail;
  const letters = email ? initials(email) : '';

  return (
    <main className="screen">
      <h1 className="title">Perfil</h1>
      <div className="screen__body">
        <div className="profile__head">
          <span className="avatar avatar--big" aria-hidden="true">
            {letters || <span className="avatar__empty" />}
          </span>
          <div className="profile__who">
            <strong>{email ?? 'Sem login'}</strong>
            <SyncIndicator />
          </div>
        </div>
        <SettingsPanel showHand showSync={false} />
        {email ? (
          // Same-origin navigation: Cloudflare Access ends the session that lets the app into /api.
          <a
            className="profile__row"
            href={logoutPath}
            onClick={(event) => {
              event.preventDefault();
              void signOut(settings, logoutPath);
            }}
          >
            Sair
          </a>
        ) : (
          // Signed out, the sync line above already has its own "Entrar".
          sync.status !== 'signed-out' && (
            <a className="profile__row" href={loginPath}>
              Entrar com Google
            </a>
          )
        )}
      </div>
      <BottomNav current="profile" />
    </main>
  );
}
