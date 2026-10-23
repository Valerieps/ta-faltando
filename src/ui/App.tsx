import { greetingFor } from '../domain/greeting';

// Placeholder screen: replace it with the app's first screen (docs/ROADMAP.md).
export function App() {
  return (
    <main className="app">
      <h1>Tá faltando</h1>
      <p>{greetingFor(new Date())}</p>
    </main>
  );
}
