import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import { getAuth } from '../services/auth';

const emptyDistinction = { type: '', player_id: '' };

export function ResultsPage() {
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';
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
  const [courts, setCourts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [manualDate, setManualDate] = useState('');
  const [manualCourtId, setManualCourtId] = useState('');
  const [teamAIds, setTeamAIds] = useState([]);
  const [teamBIds, setTeamBIds] = useState([]);
  const [manualWinner, setManualWinner] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const [viewMode, setViewMode] = useState('result');
  const [manualStep, setManualStep] = useState('A');

  const loadMatches = async () => {
    try {
      const data = await apiFetch('/matches');
      setMatches(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar partidos.');
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const loadManualData = async () => {
      setManualError('');
      try {
        const [courtsData, playersData] = await Promise.all([
          apiFetch('/courts'),
          apiFetch('/players'),
        ]);
        setCourts(courtsData || []);
        setPlayers(playersData || []);
      } catch (err) {
        setManualError(err.message || 'No se pudieron cargar datos para crear partidos.');
      }
    };
    loadManualData();
  }, [isAdmin]);

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
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [players]
  );

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

  const onToggleTeamA = (playerId) => {
    setTeamAIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
    setTeamBIds((prev) => prev.filter((id) => id !== playerId));
    if (manualError) setManualError('');
    if (manualSuccess) setManualSuccess('');
  };

  const onToggleTeamB = (playerId) => {
    setTeamBIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
    setTeamAIds((prev) => prev.filter((id) => id !== playerId));
    if (manualError) setManualError('');
    if (manualSuccess) setManualSuccess('');
  };

  const onCreatePlayedMatch = async (event) => {
    event.preventDefault();
    setManualError('');
    setManualSuccess('');

    if (!manualCourtId) {
      setManualError('Selecciona la cancha.');
      return;
    }
    if (!manualDate) {
      setManualError('Selecciona la fecha.');
      return;
    }
    if (teamAIds.length === 0 || teamBIds.length === 0) {
      setManualError('Selecciona los jugadores de ambos equipos.');
      return;
    }
    if (teamAIds.length !== teamBIds.length) {
      setManualError('Los equipos deben tener la misma cantidad de jugadores.');
      return;
    }
    if (!manualWinner) {
      setManualError('Selecciona el equipo ganador.');
      return;
    }

    setManualSaving(true);
    try {
      await apiFetch('/matches/played', {
        method: 'POST',
        body: JSON.stringify({
          match_date: manualDate,
          court_id: Number(manualCourtId),
          team_a_player_ids: teamAIds,
          team_b_player_ids: teamBIds,
          winning_team: manualWinner,
        }),
      });
      setManualSuccess('Partido cargado.');
      setManualDate('');
      setManualCourtId('');
      setTeamAIds([]);
      setTeamBIds([]);
      setManualWinner('');
      await loadMatches();
    } catch (err) {
      setManualError(err.message || 'No se pudo cargar el partido.');
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-xs">
          <p className="eyebrow">Resultados</p>
          <h1>Gestion de resultados</h1>
          <p className="muted">Carga resultados y partidos jugados para mantener el historial.</p>
        </div>

        <div className="stack gap-md">
          <div className="card stack gap-sm">
            <h2>Modo de carga</h2>
            {isAdmin ? (
              <div className="toggle">
                <button
                  className={viewMode === 'manual' ? 'button toggle-btn is-active' : 'button button--ghost toggle-btn'}
                  type="button"
                  onClick={() => setViewMode('manual')}
                >
                  Cargar partido manualmente
                </button>
                <button
                  className={viewMode === 'result' ? 'button toggle-btn is-active' : 'button button--ghost toggle-btn'}
                  type="button"
                  onClick={() => setViewMode('result')}
                >
                  Cargar resultado
                </button>
              </div>
            ) : null}
          </div>

          {isAdmin && viewMode === 'manual' ? (
            <form className="card stack gap-sm" onSubmit={onCreatePlayedMatch}>
              <h2>Cargar partido jugado</h2>
              <div className="grid grid-2">
                <label className="field">
                  <span>Cancha</span>
                  <select
                    className="input"
                    value={manualCourtId}
                    onChange={(event) => {
                      setManualCourtId(event.target.value);
                      if (manualError) setManualError('');
                      if (manualSuccess) setManualSuccess('');
                    }}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Fecha</span>
                  <input
                    className="input"
                    type="date"
                    value={manualDate}
                    onChange={(event) => {
                      setManualDate(event.target.value);
                      if (manualError) setManualError('');
                      if (manualSuccess) setManualSuccess('');
                    }}
                    required
                  />
                </label>
              </div>
              <div className="stack gap-sm">
                <p className="muted">
                  Paso {manualStep === 'A' ? '1' : '2'} de 2:{' '}
                  {manualStep === 'A' ? 'Equipo A' : 'Equipo B'}
                </p>
                {manualStep === 'A' ? (
                  <>
                    <p className="muted">Jugadores equipo A ({teamAIds.length})</p>
                    <div className="pill-grid">
                      {sortedPlayers.map((player) => (
                        <label key={player.id} className="pill">
                          <input
                            type="checkbox"
                            checked={teamAIds.includes(player.id)}
                            onChange={() => onToggleTeamA(player.id)}
                          />
                          <span>{player.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="actions">
                      <button
                        className="button"
                        type="button"
                        onClick={() => {
                          if (teamAIds.length === 0) {
                            setManualError('Selecciona jugadores para el equipo A.');
                            return;
                          }
                          setManualStep('B');
                          if (manualError) setManualError('');
                        }}
                      >
                        Continuar a equipo B
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="muted">Jugadores equipo B ({teamBIds.length})</p>
                    <div className="pill-grid">
                      {sortedPlayers
                        .filter((player) => !teamAIds.includes(player.id))
                        .map((player) => (
                          <label key={player.id} className="pill">
                            <input
                              type="checkbox"
                              checked={teamBIds.includes(player.id)}
                              onChange={() => onToggleTeamB(player.id)}
                            />
                            <span>{player.name}</span>
                          </label>
                        ))}
                    </div>
                    <div className="actions">
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={() => {
                          setManualStep('A');
                          if (manualError) setManualError('');
                        }}
                      >
                        Volver a equipo A
                      </button>
                    </div>
                  </>
                )}
              </div>
              <label className="field">
                <span>Equipo ganador</span>
                <select
                  className="input"
                  value={manualWinner}
                  onChange={(event) => {
                    setManualWinner(event.target.value);
                    if (manualError) setManualError('');
                    if (manualSuccess) setManualSuccess('');
                  }}
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="A">Equipo A</option>
                  <option value="B">Equipo B</option>
                </select>
              </label>

              {manualError ? <p className="notice error">{manualError}</p> : null}
              {manualSuccess ? <p className="notice">{manualSuccess}</p> : null}

              <button className="button" type="submit" disabled={manualSaving}>
                {manualSaving ? 'Cargando...' : 'Cargar partido'}
              </button>
            </form>
          ) : null}

          {viewMode === 'result' ? (
            <form className="stack gap-md" onSubmit={onSave}>
              <h2>Cargar resultado</h2>
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
          ) : null}
        </div>
      </section>
    </main>
  );
}
