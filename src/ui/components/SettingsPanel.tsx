import { useState } from 'react';
import { backupDue, parseBackup, type ParsedBackup } from '../../application/backup';
import { navigate } from '../router';
import { useServices, useSettings } from '../services';
import { SyncIndicator } from '../SyncIndicator';
import { tata } from '../tata-lines';
import { HandChoice } from './HandChoice';
import { Say } from './Say';

const DATE = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Settings: the hand (phone only), redoing the setup, and the backup file (spec/backup.md). */
export function SettingsPanel({ showHand }: { showHand: boolean }) {
  const { settings, backup, files, now } = useServices();
  const state = useSettings();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Extract<ParsedBackup, { ok: true }> | null>(null);

  async function exportBackup() {
    const file = await backup.exportFile();
    const day = file.exportadoEm.slice(0, 10);
    if (await files.save(`ta-faltando-${day}.json`, JSON.stringify(file, null, 2))) {
      await settings.set('lastBackupAt', now());
      setMessage('Backup salvo. Guarde o arquivo fora do celular também.');
    }
  }

  async function chooseImport() {
    setMessage(null);
    const text = await files.open();
    if (text === null) return;
    const parsed = parseBackup(text);
    if (parsed.ok) setPending(parsed);
    else setMessage(parsed.error);
  }

  async function confirmImport() {
    if (!pending) return;
    await backup.importReplacing(pending.backup);
    setPending(null);
    setMessage('Importado. O app agora está igual ao backup, e isso vai também para o outro aparelho.');
  }

  return (
    <div className="settings">
      {showHand && (
        <section className="settings__section">
          <h3>Mão</h3>
          <p className="muted">Os botões ficam do lado do polegar, em todas as telas do celular.</p>
          <HandChoice />
        </section>
      )}

      <section className="settings__section">
        <h3>Backup</h3>
        {backupDue(state.lastBackupAt, state.firstUseAt, now()) && <Say mood="attentive">{tata.backupDue}</Say>}
        <p className="muted">
          {state.lastBackupAt === null ? 'Ainda não há backup feito neste aparelho.' : `Último backup neste aparelho: ${DATE.format(state.lastBackupAt)}.`}
        </p>
        <div className="reach reach--start">
          <button type="button" className="pill pill--solid" onClick={() => void exportBackup()}>
            Exportar backup
          </button>
          <button type="button" className="pill" onClick={() => void chooseImport()}>
            Importar backup
          </button>
        </div>
        {pending && (
          <div className="confirm" role="alertdialog" aria-label="Confirmar importação">
            <p>
              O arquivo de {DATE.format(new Date(pending.backup.exportadoEm))} tem {pending.counts.contexts} contextos, {pending.counts.items} itens no catálogo e{' '}
              {pending.counts.listEntries} itens de lista. Importar substitui tudo o que está no app, aqui, no servidor e no outro aparelho.
            </p>
            <div className="reach reach--start">
              <button type="button" className="pill pill--danger" onClick={() => void confirmImport()}>
                Substituir tudo
              </button>
              <button type="button" className="pill" onClick={() => setPending(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {message && <p role="status">{message}</p>}
      </section>

      <section className="settings__section">
        <h3>Setup</h3>
        <p className="muted">Escolher contextos e sugestões de novo. O que já está no catálogo fica.</p>
        <button type="button" className="pill" onClick={() => navigate({ name: 'setup' })}>
          Refazer o setup
        </button>
      </section>

      <section className="settings__section">
        <h3>Sincronização</h3>
        <SyncIndicator />
      </section>
    </div>
  );
}
