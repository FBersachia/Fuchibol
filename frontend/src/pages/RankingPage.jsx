import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export function RankingPage() {
  const [limit, setLimit] = useState(20);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  const loadRanking = async (value) => {
    setError('');
    try {
      const data = await apiFetch(`/ranking?limit=${value}`);
      setRanking(data.ranking || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar ranking.');
    }
  };

  useEffect(() => {
    loadRanking(limit);
  }, []);

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-md">
          <label className="field">
            <span>Top N</span>
            <input
              className="input"
              type="number"
              min="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              onBlur={() => loadRanking(limit)}
            />
          </label>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Elo</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>MVP</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((player) => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{player.elo}</td>
                    <td>{player.wins}</td>
                    <td>{player.losses}</td>
                    <td>{player.distinctions?.mvp || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
