import type { Settings } from '../application/settings';

/**
 * "Sair": forgets the saved e-mail, then opens Cloudflare Access's logout. It navigates by itself
 * instead of following the link's href: forgetting the e-mail re-renders the menu during the
 * click, and React reuses the same <a> for "Entrar com Google", so the click would follow the
 * login link instead.
 */
export async function signOut(
  settings: Pick<Settings, 'set'>,
  logoutPath: string,
  go: (path: string) => void = (path) => window.location.assign(path),
): Promise<void> {
  try {
    await settings.set('email', null);
  } finally {
    go(logoutPath);
  }
}
