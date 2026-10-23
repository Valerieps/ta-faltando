import type { SyncState } from '../application/synchronizer';

const changes = (n: number) => (n === 1 ? '1 mudança' : `${n} mudanças`);

/** The discreet line that says whether there are changes that did not go up (spec/sincronizacao.md). */
export function syncStatusText({ status, pending }: SyncState): string {
  switch (status) {
    case 'signed-out':
      return pending > 0 ? `${changes(pending)} esperando o login` : 'Entre para sincronizar';
    case 'offline':
      return pending > 0 ? `Sem internet · ${changes(pending)} para subir` : 'Sem internet';
    case 'error':
      return pending > 0 ? `Não sincronizou · ${changes(pending)} para subir` : 'Não sincronizou';
    case 'syncing':
      return 'Sincronizando…';
    case 'idle':
      return pending > 0 ? `${changes(pending)} para subir` : 'Sincronizado';
  }
}
