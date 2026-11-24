import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Warehouse</h1>
      {error && <p>Backend niet bereikbaar: {error}</p>}
      {!error && !health && <p>Laden...</p>}
      {health && <p>Status backend: {health.status}</p>}
    </main>
  );
}

export default App;