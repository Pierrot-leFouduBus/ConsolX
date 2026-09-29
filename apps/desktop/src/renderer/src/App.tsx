// Placeholder screen, replaced by the terminal in phase 1.
export function App() {
  const { versions } = window.consolx

  return (
    <main className="app">
      <h1>ConsolX</h1>
      <p>
        Electron {versions.electron} · Chromium {versions.chrome} · Node {versions.node}
      </p>
    </main>
  )
}
