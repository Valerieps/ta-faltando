import { useState } from 'react';
import type { Context } from '../../domain/context';
import { splitBatch } from '../../domain/entry-text';
import type { ListEntry } from '../../domain/list-entry';
import { activeContexts, contextName, itemsById, itemsWithoutContext, listEntries, missingCount, totalMissing, type Snapshot } from '../../domain/list-view';
import { AddField } from '../components/AddField';
import { BatchReview } from '../components/BatchReview';
import { Catalog } from '../components/Catalog';
import { ContextManager } from '../components/ContextManager';
import { ItemSheet } from '../components/ItemSheet';
import { ListRows } from '../components/ListRows';
import { Say } from '../components/Say';
import { SettingsPanel } from '../components/SettingsPanel';
import { Uncontexted } from '../components/Uncontexted';
import { useFading, withFading } from '../components/useFading';
import { navigate, routeHash, type Route } from '../router';
import { useServices } from '../services';
import { SyncIndicator } from '../SyncIndicator';
import { Tata } from '../Tata';
import { tata } from '../tata-lines';

type Page = 'lists' | 'catalog' | 'contexts' | 'uncontexted' | 'settings';

/** The phone's screens that have no page of their own here open the lists (no shopping mode on the computer). */
function pageOf(route: Route): Page {
  switch (route.name) {
    case 'catalog':
    case 'contexts':
    case 'uncontexted':
    case 'settings':
      return route.name;
    default:
      return 'lists';
  }
}

/**
 * The computer: a side menu, the lists in columns, and the batch box fixed on the right
 * (spec/itens-e-contextos.md; identity draft, "Computador").
 */
export function DesktopApp({ snapshot, route }: { snapshot: Snapshot; route: Route }) {
  const page = pageOf(route);
  const loose = itemsWithoutContext(snapshot).length;
  const links: { page: Page; label: string; count?: number; quiet?: boolean; to: Route }[] = [
    { page: 'lists', label: 'Listas', count: totalMissing(snapshot), to: { name: 'home' } },
    { page: 'catalog', label: 'Catálogo', to: { name: 'catalog' } },
    { page: 'contexts', label: 'Contextos', to: { name: 'contexts' } },
    { page: 'uncontexted', label: 'Sem contexto', count: loose, quiet: true, to: { name: 'uncontexted' } },
    { page: 'settings', label: 'Ajustes', to: { name: 'settings' } },
  ];

  return (
    <div className="desk">
      <nav className="side" aria-label="Menu">
        <span className="side__mark">
          <Tata size={26} />
          Tá faltando
        </span>
        {links.map((link) => (
          <a
            key={link.page}
            href={routeHash(link.to)}
            className={page === link.page ? 'side__link is-on' : 'side__link'}
            aria-current={page === link.page ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              navigate(link.to);
            }}
          >
            {link.label}
            {link.count !== undefined && link.count > 0 && <span className={link.quiet ? 'count count--quiet' : 'count'}>{link.count}</span>}
          </a>
        ))}
        <div className="side__sync">
          <SyncIndicator />
        </div>
      </nav>

      <main className="desk__main">
        {page === 'lists' && <ListsPage snapshot={snapshot} />}
        {page === 'catalog' && <CatalogPage snapshot={snapshot} contextId={route.name === 'catalog' ? route.contextId : undefined} />}
        {page === 'contexts' && (
          <>
            <h1 className="title">Contextos</h1>
            <ContextManager snapshot={snapshot} />
          </>
        )}
        {page === 'uncontexted' && (
          <>
            <h1 className="title">Sem contexto</h1>
            <Uncontexted snapshot={snapshot} />
          </>
        )}
        {page === 'settings' && (
          <>
            <h1 className="title">Ajustes</h1>
            <SettingsPanel showHand={false} />
          </>
        )}
      </main>

      {page === 'lists' && (
        <aside className="desk__batch" aria-label="Adicionar em lote">
          <BatchPanel snapshot={snapshot} />
        </aside>
      )}
    </div>
  );
}

function ListsPage({ snapshot }: { snapshot: Snapshot }) {
  const [said, setSaid] = useState<string | null>(null);
  const [open, setOpen] = useState<{ itemId: string; entryId: string } | null>(null);
  const { lists } = useServices();
  const { fading, fade, undo } = useFading();
  const contexts = activeContexts(snapshot.contexts);
  const hasLoose = withFading(listEntries(snapshot, null), fading, [null]).length > 0;
  const trash = (entryId: string) => {
    const entry = snapshot.entries.find((e) => e.id === entryId);
    if (entry) void fade(entry, () => lists.removeEntry(entry.id));
  };
  const columnProps = { snapshot, fading, onTrash: trash, onUndo: (id: string) => void undo(id), onOpen: setOpen };

  return (
    <>
      <div className="desk__head">
        <h1 className="title">Listas</h1>
        <div className="desk__add">
          <AddField
            snapshot={snapshot}
            opens="down"
            placeholder="O que tá faltando? Digite e aperte enter"
            onAdded={(result) => setSaid(tata.added(result, result.entry.contextId === null ? null : contextName(snapshot, result.entry.contextId)))}
          />
          {said && <Say>{said}</Say>}
        </div>
      </div>
      {contexts.length === 0 && !hasLoose ? (
        <Say mood="attentive">Ainda não há contextos. Crie um em Contextos, ou refaça o setup nos Ajustes.</Say>
      ) : (
        <div className="cols">
          {contexts.map((context) => (
            <Column key={context.id} context={context} {...columnProps} />
          ))}
          {hasLoose && <Column context={undefined} {...columnProps} />}
        </div>
      )}
      {open && <ItemSheet snapshot={snapshot} itemId={open.itemId} entryId={open.entryId} onClose={() => setOpen(null)} onRemoveEntry={trash} />}
    </>
  );
}

function Column({
  snapshot,
  context,
  fading,
  onTrash,
  onUndo,
  onOpen,
}: {
  snapshot: Snapshot;
  context: Context | undefined;
  fading: ReadonlyMap<string, ListEntry>;
  onTrash: (entryId: string) => void;
  onUndo: (entryId: string) => void;
  onOpen: (open: { itemId: string; entryId: string }) => void;
}) {
  const { lists, contexts } = useServices();
  const id = context?.id ?? null;
  const entries = withFading(listEntries(snapshot, id), fading, [id]);
  const struck = entries.filter((e) => e.checkedAt != null && !fading.has(e.id)).length;
  const name = contextName(snapshot, id);
  return (
    <section className="col" aria-label={name}>
      <div className="col__head">
        <h2>
          {name} <span className={id === null ? 'count count--quiet' : 'count'}>{missingCount(snapshot, id)}</span>
        </h2>
        {context && (
          <button
            type="button"
            className={context.groupByCategory ? 'chip chip--small is-on' : 'chip chip--small'}
            aria-pressed={context.groupByCategory}
            onClick={() => void contexts.setGroupByCategory(context.id, !context.groupByCategory)}
          >
            Agrupar
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="muted">{tata.emptyList(name)}</p>
      ) : (
        <ListRows
          entries={entries}
          items={itemsById(snapshot.items)}
          context={context}
          grouped={context?.groupByCategory ?? false}
          fading={fading}
          onTrash={(entry) => onTrash(entry.id)}
          onUndo={onUndo}
          onOpen={(entry) => onOpen({ itemId: entry.itemId, entryId: entry.id })}
          onToggle={(entry) => void lists.setChecked(entry.id, entry.checkedAt == null)}
        />
      )}
      {struck > 0 && (
        <button type="button" className="pill" onClick={() => void lists.finishPurchase([id])}>
          Finalizar compra ({struck === 1 ? '1 riscado' : `${struck} riscados`})
        </button>
      )}
    </section>
  );
}

function CatalogPage({ snapshot, contextId }: { snapshot: Snapshot; contextId: string | null | undefined }) {
  const contexts = activeContexts(snapshot.contexts);
  const id = contextId === undefined ? (contexts[0]?.id ?? null) : contextId;
  return (
    <>
      <h1 className="title">Catálogo</h1>
      <nav className="chips" aria-label="Contextos">
        {[...contexts.map((c) => c.id), null].map((cid) => (
          <button
            key={cid ?? 'none'}
            type="button"
            className={cid === id ? 'chip is-on' : 'chip'}
            aria-current={cid === id ? 'page' : undefined}
            onClick={() => navigate({ name: 'catalog', contextId: cid }, { replace: true })}
          >
            {contextName(snapshot, cid)}
          </button>
        ))}
      </nav>
      <Catalog key={id ?? 'none'} snapshot={snapshot} contextId={id} />
    </>
  );
}

/** The batch box: the owner pastes, Tatá splits and shows where each item goes before saving. */
function BatchPanel({ snapshot }: { snapshot: Snapshot }) {
  const [text, setText] = useState('');
  const [said, setSaid] = useState<string | null>(null);
  const entries = splitBatch(text);
  return (
    <div className="batch">
      <h2>Adicionar em lote</h2>
      <textarea
        className="batch-text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setSaid(null);
        }}
        placeholder={'tomate, cebola, 2 limão\nshampoo\nareia do gato e fita dupla-face'}
        aria-label="Itens, um por linha ou separados por vírgula"
        rows={6}
      />
      {said && <Say mood="happy">{said}</Say>}
      {entries.length > 0 && (
        <BatchReview
          key={text}
          entries={entries}
          snapshot={snapshot}
          via="batch"
          onDone={(results) => {
            setText('');
            setSaid(tata.addedMany(results.length));
          }}
        />
      )}
    </div>
  );
}
