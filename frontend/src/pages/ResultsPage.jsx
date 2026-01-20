import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const emptyDistinction = { type: '', player_id: '' };

export function ResultsPage() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchDetail, setMatchDetail] = useState(null);
  const [result, setResult] = useState(null);
  const [winner, setWinner] = useState('');
  const [goalDiff, setGoalDiff] = useState(0);
  const [mvpPlayerId, setMvpPlayerId] = useState('');
  const [distinction, setDistinction] = useState(emptyDistinction);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await apiFetch('/matches');
        setMatches(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar partidos.');
      }
    };
    loadMatches();
  }, []);

  useEffect(() => {
    if (!selectedMatchId) {
      setMatchDetail(null);
      setResult(null);
      return;
    }
    const loadDetail = async () => {
      setError('');
      try {
        const [detail, resultData] = await Promise.all([
          apiFetch(`/matches/${selectedMatchId}`),
          apiFetch(`/matches/${selectedMatchId}/result`),
        ]);
        setMatchDetail(detail);
        setResult(resultData.result);
        if (resultData.result) {
          setWinner(resultData.result.is_draw ? 'draw' : String(resultData.result.winning_team_id));
          setGoalDiff(resultData.result.goal_diff || 0);
          setMvpPlayerId(resultData.result.mvp_player_id ? String(resultData.result.mvp_player_id) : '');
        } else {
          setWinner('');
          setGoalDiff(0);
          setMvpPlayerId('');
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar el partido.');
      }
    };
    loadDetail();
  }, [selectedMatchId]);

  const teams = matchDetail?.Teams || [];
  const teamOptions = teams.map((team) => ({
    id: String(team.id),
    label: team.name,
  }));
  const playersInMatch = useMemo(() => {
    const list = [];
    teams.forEach((team) => {
      (team.Players || []).forEach((player) => list.push(player));
    });
    return list;
  }, [teams]);

  const onSave = async (event) => {
    event.preventDefault();
    if (!selectedMatchId) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        winning_team_id: winner === 'draw' ? null : Number(winner),
        is_draw: winner === 'draw',
        goal_diff: Number(goalDiff),
        mvp_player_id: mvpPlayerId ? Number(mvpPlayerId) : null,
      };
      if (distinction.type && distinction.player_id) {
        payload.distinctions = [
          {
            type: distinction.type,
            player_id: Number(distinction.player_id),
            notes: '',
          },
        ];
      }
      const method = result ? 'PATCH' : 'POST';
      await apiFetch(`/matches/${selectedMatchId}/result`, {
        method,
        body: JSON.stringify(payload),
      });
      setResult(payload);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <form className="stack gap-md" onSubmit={onSave}>
          <label className="field">
            <span>Fecha de partido</span>
            <input
              className="input"
              type="date"
              value={matchDate}
              onChange={(event) => {
                const value = event.target.value;
                setMatchDate(value);
                const match = matches.find((item) => item.match_date === value);
                setSelectedMatchId(match ? String(match.id) : '');
              }}
              required
            />
          </label>
          {matchDate && !selectedMatchId ? (
            <p className="notice">No hay partido creado para esa fecha.</p>
          ) : null}

          <label className="field">
            <span>Resultado</span>
            <select
              className="input"
              value={winner}
              onChange={(event) => setWinner(event.target.value)}
              required
            >
              <option value="">Seleccionar</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.label}
                </option>
              ))}
              <option value="draw">Empate</option>
            </select>
          </label>

          <label className="field">
            <span>Diferencia de gol</span>
            <input
              className="input"
              type="number"
              min="0"
              value={goalDiff}
              onChange={(event) => setGoalDiff(event.target.value)}
            />
          </label>

          <label className="field">
            <span>MVP</span>
            <select
              className="input"
              value={mvpPlayerId}
              onChange={(event) => setMvpPlayerId(event.target.value)}
            >
              <option value="">Sin MVP</option>
              {playersInMatch.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-2">
            <label className="field">
              <span>Distincion</span>
              <select
                className="input"
                value={distinction.type}
                onChange={(event) =>
                  setDistinction((prev) => ({ ...prev, type: event.target.value }))
                }
              >
                <option value="">Sin distincion</option>
                <option value="mvp">MVP</option>
                <option value="mencion">Mencion</option>
              </select>
            </label>
            <label className="field">
              <span>Jugador</span>
              <select
                className="input"
                value={distinction.player_id}
                onChange={(event) =>
                  setDistinction((prev) => ({ ...prev, player_id: event.target.value }))
                }
              >
                <option value="">Seleccionar</option>
                {playersInMatch.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? <p className="notice error">{error}</p> : null}
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </form>
      </section>
    </main>
  );
}
