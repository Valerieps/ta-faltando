import { SyncIndicator } from './SyncIndicator';

// The app shell. The screens of phase 1a (setup, lists, shopping mode) arrive here (docs/ROADMAP.md).
export function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>Tá faltando</h1>
        <SyncIndicator />
      </header>
      <p className="app__empty">As listas aparecem aqui.</p>
    </main>
  );
}
