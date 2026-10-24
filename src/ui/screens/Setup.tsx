import { useEffect, useMemo, useRef, useState } from 'react';
import type { SetupChoice } from '../../application/contexts';
import { activeContexts, type Snapshot } from '../../domain/list-view';
import { itemContextIds } from '../../domain/item';
import { CAPSULE_COUNT, pick, refill, startCapsules, typeItem, unpick, type CapsulesState } from '../../domain/setup-capsules';
import { SUGGESTED_CONTEXTS } from '../../domain/suggestion';
import { cleanName, nameKey } from '../../domain/text';
import { capitalize } from '../../domain/entry-text';
import { Say } from '../components/Say';
import { useServices, useSyncState } from '../services';
import { Tata } from '../Tata';
import { tata } from '../tata-lines';
import { backFromLogin, welcomeGate } from '../welcome-gate';

/** How long a tapped capsule fades before the next suggestion takes its place (spec/setup.md). */
const CAPSULE_FADE_MS = 300;

interface Chosen {
  /** The suggested context's id, or `outro:<name>` for one she named. */
  readonly key: string;
  readonly suggestedId: string | null;
  readonly name: string;
}

type Step = { kind: 'welcome' } | { kind: 'contexts' } | { kind: 'capsules'; index: number } | { kind: 'summary' };

/**
 * The first-use setup (spec/setup.md): welcome, the contexts, one capsules screen per chosen
 * context and a summary. Every step can be skipped; redone from the settings, it starts from
 * what is already there and only adds.
 */
export function Setup({ snapshot, redo, onFinish }: { snapshot: Snapshot; redo: boolean; onFinish: () => void }) {
  const { contexts, loginPath } = useServices();
  const existing = activeContexts(snapshot.contexts);
  const [step, setStep] = useState<Step>(redo ? { kind: 'contexts' } : { kind: 'welcome' });
  const [chosen, setChosen] = useState<readonly Chosen[]>(() =>
    existing.map((c) => {
      const suggested = SUGGESTED_CONTEXTS.find((s) => s.id === c.id || nameKey(s.name) === nameKey(c.name));
      return { key: suggested?.id ?? `outro:${c.name}`, suggestedId: suggested?.id ?? null, name: c.name };
    }),
  );
  const [capsules, setCapsules] = useState<Readonly<Record<string, CapsulesState>>>({});
  const [saving, setSaving] = useState(false);

  // Data arrived from the other device while the welcome was open: the setup was done there.
  useEffect(() => {
    if (!redo && step.kind === 'welcome' && existing.length > 0) onFinish();
  }, [redo, step.kind, existing.length, onFinish]);

  // The Google login comes before the welcome, so a new device brings its data first.
  const [loginDeclined, setLoginDeclined] = useState(false);
  const gate = welcomeGate(useSyncState(), backFromLogin() || loginDeclined);

  // Items already in the catalog, with a context, never show as suggestions.
  const inCatalog = useMemo(
    () => new Set(snapshot.items.filter((i) => i.deletedAt === null && itemContextIds(i).length > 0).map((i) => nameKey(i.name))),
    [snapshot.items],
  );
  const excludedFor = (key: string) =>
    new Set([...inCatalog, ...Object.entries(capsules).flatMap(([k, s]) => (k === key ? [] : s.selected.map((x) => nameKey(x.name))))]);

  function openCapsules(index: number) {
    const context = chosen[index];
    if (!context) return setStep({ kind: 'summary' });
    const queue = SUGGESTED_CONTEXTS.find((s) => s.id === context.suggestedId)?.queue ?? [];
    const excluded = excludedFor(context.key);
    setCapsules((all) => ({ ...all, [context.key]: all[context.key] ? refill(all[context.key], excluded) : startCapsules(queue, excluded) }));
    setStep({ kind: 'capsules', index });
  }

  async function finish() {
    setSaving(true);
    try {
      const choices: SetupChoice[] = chosen.map((c) => ({ suggestedId: c.suggestedId, name: c.name, selected: capsules[c.key]?.selected ?? [] }));
      await contexts.applySetup(choices);
      onFinish();
    } finally {
      setSaving(false);
    }
  }

  if (step.kind === 'welcome') {
    if (gate === 'wait') return <main className="screen setup" aria-busy="true" />;
    if (gate === 'login') {
      return (
        <main className="screen setup">
          <div className="setup__hero">
            <Tata mood="happy" size={96} />
            <h1 className="question">Tá faltando</h1>
            <Say>{tata.login}</Say>
            <p className="muted">Se você já usa o app em outro aparelho, as suas listas e o seu catálogo chegam aqui.</p>
          </div>
          <div className="reach">
            <button type="button" className="pill" onClick={() => setLoginDeclined(true)}>
              Agora não
            </button>
            {/* Same-origin navigation: Cloudflare Access shows the Google login and comes back. */}
            <a className="btn" href={loginPath}>
              Entrar com Google
            </a>
          </div>
        </main>
      );
    }
    return (
      <main className="screen setup">
        <div className="setup__hero">
          <Tata mood="happy" size={96} />
          <h1 className="question">Tá faltando</h1>
          <Say>{tata.welcome}</Say>
          <p className="muted">
            Em uns 2 minutos a gente escolhe onde você costuma comprar e o que costuma comprar em cada lugar. Você pode pular qualquer passo e refazer depois
            nos ajustes.
          </p>
        </div>
        <div className="reach">
          <button type="button" className="pill" onClick={onFinish}>
            Pular
          </button>
          <button type="button" className="btn" onClick={() => setStep({ kind: 'contexts' })}>
            Começar
          </button>
        </div>
      </main>
    );
  }

  if (step.kind === 'contexts') {
    return <ContextChoice chosen={chosen} onChange={setChosen} onSkip={() => setStep({ kind: 'summary' })} onNext={() => openCapsules(0)} />;
  }

  if (step.kind === 'capsules') {
    const context = chosen[step.index];
    const original = SUGGESTED_CONTEXTS.find((s) => s.id === context.suggestedId)?.queue ?? [];
    const state = capsules[context.key];
    const already = snapshot.items.filter((i) => i.deletedAt === null && existing.some((c) => itemContextIds(i).includes(c.id) && nameKey(c.name) === nameKey(context.name)));
    const update = (next: (s: CapsulesState, excluded: ReadonlySet<string>) => CapsulesState) =>
      setCapsules((all) => ({ ...all, [context.key]: next(all[context.key], excludedFor(context.key)) }));
    return (
      <Capsules
        key={context.key}
        title={tata.setupContext(context.name)}
        progress={`${step.index + 1} de ${chosen.length}`}
        state={state}
        already={already.map((i) => i.name)}
        onPick={(slot) => update((s, ex) => pick(s, slot, ex))}
        onUnpick={(name) => update((s, ex) => unpick(s, name, original, ex))}
        onType={(text) => update((s, ex) => typeItem(s, text, ex))}
        onBack={() => (step.index === 0 ? setStep({ kind: 'contexts' }) : openCapsules(step.index - 1))}
        onNext={() => openCapsules(step.index + 1)}
      />
    );
  }

  const total = chosen.reduce((n, c) => n + (capsules[c.key]?.selected.length ?? 0), 0);
  return (
    <main className="screen setup">
      <h1 className="question">Resumo</h1>
      <Say mood="happy">{tata.setupDone(total)}</Say>
      {chosen.length === 0 ? (
        <p className="muted">Nenhum contexto escolhido. Tudo o que você anotar vai para Sem contexto até você criar um.</p>
      ) : (
        <ul className="ctx-list">
          {chosen.map((c) => {
            const n = capsules[c.key]?.selected.length ?? 0;
            return (
              <li key={c.key} className="ctx-list__row">
                <span>{c.name}</span>
                <span className="muted">{n === 1 ? '1 item' : `${n} itens`}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="reach">
        <button type="button" className="pill" onClick={() => (chosen.length ? openCapsules(chosen.length - 1) : setStep({ kind: 'contexts' }))}>
          Voltar
        </button>
        <button type="button" className="btn" disabled={saving} onClick={() => void finish()}>
          Começar
        </button>
      </div>
    </main>
  );
}

function ContextChoice({
  chosen,
  onChange,
  onSkip,
  onNext,
}: {
  chosen: readonly Chosen[];
  onChange: (chosen: readonly Chosen[]) => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const [other, setOther] = useState('');
  const has = (key: string) => chosen.some((c) => c.key === key);
  const toggle = (c: Chosen) => onChange(has(c.key) ? chosen.filter((x) => x.key !== c.key) : [...chosen, c]);
  const others = chosen.filter((c) => c.suggestedId === null);

  function addOther() {
    const name = capitalize(cleanName(other));
    if (!name) return;
    const suggested = SUGGESTED_CONTEXTS.find((s) => nameKey(s.name) === nameKey(name));
    const c: Chosen = suggested ? { key: suggested.id, suggestedId: suggested.id, name: suggested.name } : { key: `outro:${name}`, suggestedId: null, name };
    if (!has(c.key)) onChange([...chosen, c]);
    setOther('');
  }

  return (
    <main className="screen setup">
      <div className="setup__head">
        <Tata size={36} />
        <h1 className="question">Onde você costuma comprar?</h1>
      </div>
      <div className="cards" role="group" aria-label="Contextos sugeridos">
        {SUGGESTED_CONTEXTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={has(s.id) ? 'card is-on' : 'card'}
            aria-pressed={has(s.id)}
            onClick={() => toggle({ key: s.id, suggestedId: s.id, name: s.name })}
          >
            {s.name}
          </button>
        ))}
        {others.map((c) => (
          <button key={c.key} type="button" className="card is-on" aria-pressed="true" onClick={() => toggle(c)}>
            {c.name}
          </button>
        ))}
      </div>
      <form
        className="field field--quiet"
        onSubmit={(event) => {
          event.preventDefault();
          addOther();
        }}
      >
        <input value={other} onChange={(event) => setOther(event.target.value)} placeholder="Outro: papelaria, açougue…" aria-label="Outro contexto" enterKeyHint="done" />
        <button type="submit" className="pill" disabled={!other.trim()}>
          Pôr
        </button>
      </form>
      <div className="reach">
        <button type="button" className="pill" onClick={onSkip}>
          Pular
        </button>
        <button type="button" className="btn" disabled={chosen.length === 0} onClick={onNext}>
          Próximo
        </button>
      </div>
    </main>
  );
}

function Capsules({
  title,
  progress,
  state,
  already,
  onPick,
  onUnpick,
  onType,
  onBack,
  onNext,
}: {
  title: string;
  progress: string;
  state: CapsulesState;
  already: readonly string[];
  onPick: (slot: number) => void;
  onUnpick: (name: string) => void;
  onType: (text: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [text, setText] = useState('');
  const [leaving, setLeaving] = useState<ReadonlySet<number>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function tap(slot: number) {
    if (leaving.has(slot)) return;
    setLeaving((l) => new Set(l).add(slot));
    timers.current.push(
      setTimeout(() => {
        onPick(slot);
        setLeaving((l) => {
          const next = new Set(l);
          next.delete(slot);
          return next;
        });
      }, CAPSULE_FADE_MS),
    );
  }

  return (
    <main className="screen setup">
      <div className="setup__head">
        <span className="muted">{progress}</span>
        <h1 className="question">{title}</h1>
      </div>
      <div className="capsules" role="group" aria-label="Sugestões">
        {Array.from({ length: CAPSULE_COUNT }, (_, slot) => {
          const suggestion = state.slots[slot];
          if (!suggestion) return <span key={`empty-${slot}`} className="capsule capsule--empty" aria-hidden="true" />;
          return (
            <button key={suggestion.name} type="button" className={leaving.has(slot) ? 'capsule is-leaving' : 'capsule'} onClick={() => tap(slot)}>
              {capitalize(suggestion.name)}
            </button>
          );
        })}
      </div>
      <form
        className="field field--quiet"
        onSubmit={(event) => {
          event.preventDefault();
          onType(text);
          setText('');
        }}
      >
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite outro item e aperte enter" aria-label="Outro item" enterKeyHint="done" />
      </form>
      <section className="selected" aria-label="Selecionados">
        <span className="label">Selecionados</span>
        {state.selected.length === 0 && already.length === 0 && <p className="muted">Toque nas sugestões que você costuma comprar.</p>}
        <div className="chips">
          {state.selected.map((s) => (
            <button key={s.name} type="button" className="chip is-on" aria-label={`Desfazer ${s.name}`} onClick={() => onUnpick(s.name)}>
              {s.name} ×
            </button>
          ))}
          {already.map((name) => (
            <span key={name} className="chip chip--static">
              {name}
            </span>
          ))}
        </div>
      </section>
      <div className="reach">
        <button type="button" className="pill" onClick={onBack}>
          Voltar
        </button>
        <button type="button" className="btn" onClick={onNext}>
          {state.selected.length === 0 ? 'Pular' : 'Próximo'}
        </button>
      </div>
    </main>
  );
}
