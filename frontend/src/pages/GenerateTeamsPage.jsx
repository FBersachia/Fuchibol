import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const initialWeights = { w_elo: 1.0, w_genero: 5.0, w_social: 0.5 };

export function GenerateTeamsPage() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [courtId, setCourtId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [useSocial, setUseSocial] = useState(true);
  const [weights, setWeights] = useState(initialWeights);
  const [teamNames, setTeamNames] = useState({ teamA: 'Equipo Negro', teamB: 'Equipo Blanco' });
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [previewParams, setPreviewParams] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [matchesData, playersData, courtsData] = await Promise.all([
          apiFetch('/matches'),
          apiFetch('/players'),
          apiFetch('/courts'),
        ]);
        setMatches(matchesData);
        setPlayers(playersData);
        setCourts(courtsData);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar datos.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedCount = selectedPlayers.length;
  const matchForDate = matches.find((match) => match.match_date === matchDate);

  const onTogglePlayer = (playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const onWeightsChange = (event) => {
    const { name, value } = event.target;
    setWeights((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const onTeamNameChange = (event) => {
    const { name, value } = event.target;
    setTeamNames((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setConfirmed(false);
    setPreviewParams(null);
    try {
      const payload = {
        player_ids: selectedPlayers,
        use_social: useSocial,
        weights,
        team_names: teamNames,
      };
      const data = await apiFetch(`/matches/preview-teams`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(data);
      setPreviewParams({ payload });
    } catch (err) {
      setError(err.message || 'No se pudieron generar equipos.');
    }
  };

  const onConfirm = async () => {
    if (!previewParams) return;
    setConfirming(true);
    setError('');
    try {
      const payload = { ...previewParams.payload };
      let matchId = selectedMatchId;
      if (!matchId) {
        const createdMatch = await apiFetch('/matches', {
          method: 'POST',
          body: JSON.stringify({ match_date: matchDate, court_id: courtId || null }),
        });
        matchId = String(createdMatch.id);
        setMatches((prev) => [createdMatch, ...prev]);
        setSelectedMatchId(matchId);
      } else if (courtId) {
        await apiFetch(`/matches/${matchId}`, {
          method: 'PATCH',
          body: JSON.stringify({ court_id: Number(courtId) }),
        });
      }

      const data = await apiFetch(`/matches/${matchId}/generate-teams`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(data);
      setConfirmed(true);
    } catch (err) {
      setError(err.message || 'No se pudo confirmar equipos.');
    } finally {
      setConfirming(false);
    }
  };

  const teamSummary = useMemo(() => {
    if (!result) return null;
    const sum = (team) => team.players.reduce((acc, p) => acc + p.elo, 0);
    return {
      eloA: sum(result.teamA),
      eloB: sum(result.teamB),
      diff: Math.abs(sum(result.teamA) - sum(result.teamB)),
    };
  }, [result]);

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-xs">
          <p className="eyebrow">Equipos</p>
          <h1>Generar equipos</h1>
          <p className="muted">Configura el partido, selecciona jugadores y genera equipos parejos.</p>
        </div>

        <div className="stack gap-sm">
          {loading ? <p className="notice">Cargando...</p> : null}
          {error ? <p className="notice error">{error}</p> : null}
        </div>

        {!loading ? (
          <form className="stack gap-md" onSubmit={onSubmit}>
            <h2>Configuracion del partido</h2>
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
                  setCourtId(match?.court_id ? String(match.court_id) : '');
                }}
                required
              />
            </label>
            <label className="field">
              <span>Cancha</span>
              <select
                className="input"
                value={courtId}
                onChange={(event) => setCourtId(event.target.value)}
              >
                <option value="">Sin cancha</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </label>
            {matchDate && !matchForDate ? (
              <p className="notice">Se creara un partido nuevo al confirmar equipos.</p>
            ) : null}

            <div className="stack gap-sm">
              <h2>Seleccion de jugadores</h2>
              <p className="muted">Jugadores disponibles ({selectedCount})</p>
              <label className="field checkbox">
                <input
                  type="checkbox"
                  checked={selectedPlayers.length === players.length && players.length > 0}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedPlayers(players.map((player) => player.id));
                    } else {
                      setSelectedPlayers([]);
                    }
                  }}
                />
                <span>Seleccionar todos</span>
              </label>
              <div className="pill-grid">
                {players.map((player) => (
                  <label key={player.id} className="pill">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => onTogglePlayer(player.id)}
                    />
                    <span>
                      {player.name} - {player.elo}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="field checkbox">
              <input
                type="checkbox"
                checked={useSocial}
                onChange={(event) => setUseSocial(event.target.checked)}
              />
              <span>Emparejamiento social</span>
            </label>

            <h2>Parametros de equilibrio</h2>
            <div className="grid grid-3">
              <label className="field">
                <span>Nombre Equipo A</span>
                <input
                  className="input"
                  name="teamA"
                  value={teamNames.teamA}
                  onChange={onTeamNameChange}
                />
              </label>
              <label className="field">
                <span>Nombre Equipo B</span>
                <input
                  className="input"
                  name="teamB"
                  value={teamNames.teamB}
                  onChange={onTeamNameChange}
                />
              </label>
              <label className="field">
                <span className="label-row">
                  w_elo
                  <span
                    className="info"
                    data-tooltip="Que tanto se prioriza que el nivel total (Elo) de ambos equipos quede parejo. Mas alto = mas importante."
                    aria-label="Que tanto se prioriza que el nivel total (Elo) de ambos equipos quede parejo. Mas alto = mas importante."
                  >
                    i
                  </span>
                </span>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  name="w_elo"
                  value={weights.w_elo}
                  onChange={onWeightsChange}
                />
              </label>
              <label className="field">
                <span className="label-row">
                  w_genero
                  <span
                    className="info"
                    data-tooltip="Que tanto se prioriza repartir el genero de forma equilibrada entre equipos (tolerancia 1). Mas alto = mas importante."
                    aria-label="Que tanto se prioriza repartir el genero de forma equilibrada entre equipos (tolerancia 1). Mas alto = mas importante."
                  >
                    i
                  </span>
                </span>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  name="w_genero"
                  value={weights.w_genero}
                  onChange={onWeightsChange}
                />
              </label>
              <label className="field">
                <span className="label-row">
                  w_social
                  <span
                    className="info"
                    data-tooltip="Que tanto se prioriza mezclar jugadores para evitar que repitan equipo con las mismas personas (ultimos 12 meses). Mas alto = mas importante."
                    aria-label="Que tanto se prioriza mezclar jugadores para evitar que repitan equipo con las mismas personas (ultimos 12 meses). Mas alto = mas importante."
                  >
                    i
                  </span>
                </span>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  name="w_social"
                  value={weights.w_social}
                  onChange={onWeightsChange}
                />
              </label>
            </div>

            <button className="button" type="submit" disabled={!matchDate}>
              Generar equipos
            </button>
          </form>
        ) : null}

        {result ? (
          <div className="stack gap-md">
            <h2>Equipos generados</h2>
            <div className="grid grid-2">
              <div className="card">
                <h2>{result.teamA.name || 'Equipo A'}</h2>
                <ul className="list">
                  {result.teamA.players.map((player) => (
                    <li key={player.id}>
                      {player.name} - {player.elo}
                    </li>
                  ))}
                </ul>
                <p className="muted">Total Elo: {teamSummary.eloA}</p>
              </div>
              <div className="card">
                <h2>{result.teamB.name || 'Equipo B'}</h2>
                <ul className="list">
                  {result.teamB.players.map((player) => (
                    <li key={player.id}>
                      {player.name} - {player.elo}
                    </li>
                  ))}
                </ul>
                <p className="muted">Total Elo: {teamSummary.eloB}</p>
              </div>
            </div>
            <div className="meta">
              <p>Diferencia Elo: {teamSummary.diff}</p>
              <p>Diferencia genero: {result.meta.diff_gender}</p>
              <p>Social score: {result.meta.social_score}</p>
            </div>
            <button className="button" type="button" onClick={onConfirm} disabled={!previewParams || confirming}>
              {confirming ? 'Confirmando...' : 'Confirmar equipos'}
            </button>
            {confirmed ? <p className="notice">Equipos confirmados.</p> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
