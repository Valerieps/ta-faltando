import { BottomNav } from '../components/BottomNav';
import { SettingsPanel } from '../components/SettingsPanel';
import { useAccountEmail } from '../components/TopBar';
import { initials } from '../initials';
import { useServices, useSyncState } from '../services';
import { signOut } from '../sign-out';
import { SyncIndicator } from '../SyncIndicator';

/**
 * The phone's Perfil, opened from the circle in the top bar: my account and the sync on top,
 * then every setting (the hand, the backup, redoing the setup), and leaving the account at the
 * end (spec/itens-e-contextos.md).
 */
export function ProfileScreen() {
  const { settings, loginPath, logoutPath } = useServices();
  const sync = useSyncState();
  const email = useAccountEmail();
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
      <BottomNav />
    </main>
  );
}
