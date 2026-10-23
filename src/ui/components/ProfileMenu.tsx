import { useEffect, useRef, useState } from 'react';
import type { AccountApi } from '../../application/ports';
import type { Settings } from '../../application/settings';
import { initials } from '../initials';
import { navigate, type Route } from '../router';
import { useServices, useSettings, useSyncState } from '../services';
import { SyncIndicator } from '../SyncIndicator';
import { HandChoice } from './HandChoice';

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
 * The avatar in the top corner of the phone's screens, with my initials; it opens the menu with
 * the account, the sync, the contexts and the settings (spec/itens-e-contextos.md).
 */
export function ProfileMenu() {
  const { account, settings, loginPath, logoutPath } = useServices();
  const { email: savedEmail } = useSettings();
  const sync = useSyncState();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => refreshEmail(account, settings), [account, settings]);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [open]);

  const email = sync.status === 'signed-out' ? null : savedEmail;
  const letters = email ? initials(email) : '';
  const go = (route: Route) => {
    dialog.current?.close();
    navigate(route);
  };

  return (
    <>
      <button type="button" className="avatar" aria-label="Meu perfil e ajustes" title={email ?? 'Meu perfil e ajustes'} onClick={() => setOpen(true)}>
        {letters || <span className="avatar__empty" aria-hidden="true" />}
      </button>
      {open && (
        <dialog ref={dialog} className="sheet sheet--top" onClose={() => setOpen(false)} aria-label="Meu perfil e ajustes">
          <div className="sheet__body">
            <div className="profile__head">
              <span className="avatar avatar--big" aria-hidden="true">
                {letters || <span className="avatar__empty" />}
              </span>
              <div className="profile__who">
                <strong>{email ?? 'Sem login'}</strong>
                <SyncIndicator />
              </div>
            </div>
            <button type="button" className="profile__row" onClick={() => go({ name: 'catalog' })}>
              Editar contextos
            </button>
            <div className="profile__row">
              <HandChoice />
            </div>
            <button type="button" className="profile__row" onClick={() => go({ name: 'settings' })}>
              Backup
            </button>
            <button type="button" className="profile__row" onClick={() => go({ name: 'setup' })}>
              Refazer o setup
            </button>
            {email ? (
              // Same-origin navigation: Cloudflare Access ends the session that lets the app into /api.
              <a className="profile__row" href={logoutPath} onClick={() => void settings.set('email', null)}>
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
            <button type="button" className="pill" onClick={() => dialog.current?.close()}>
              Fechar
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
