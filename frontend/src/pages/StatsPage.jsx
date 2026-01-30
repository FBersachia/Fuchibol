import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { getAuth } from '../services/auth';

export function StatsPage() {
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [matches, setMatches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [viewMode, setViewMode] = useState('general');
  const [generalMatches, setGeneralMatches] = useState([]);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [matchDetails, setMatchDetails] = useState({});
  const [editMatchId, setEditMatchId] = useState(null);
  const [editForm, setEditForm] = useState({
    match_date: '',
    status: 'pending',
    notes: '',
    court_id: '',
    goal_diff: 0,
    result_winner: '',
    mvp_player_id: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const [playersData, courtsData] = await Promise.all([apiFetch('/players'), apiFetch('/courts')]);
        setPlayers(playersData);
        setCourts(courtsData);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar jugadores.');
      }
    };
    loadPlayers();
  }, []);

  useEffect(() => {
    if (viewMode !== 'general') {
      return;
    }
    const loadMatches = async () => {
      setGeneralLoading(true);
      setError('');
      try {
        const data = await apiFetch('/matches');
        const completed = (data || []).filter((item) => item.status === 'completed');
        setGeneralMatches(completed);
        const details = await Promise.all(
          completed.map((match) => apiFetch(`/matches/${match.id}`))
        );
        const map = details.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        setMatchDetails(map);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar partidos.');
      } finally {
        setGeneralLoading(false);
      }
    };
    loadMatches();
  }, [viewMode]);

  useEffect(() => {
    if (!selectedPlayerId) {
      setStats(null);
      setHistory([]);
      setMatches([]);
      return;
    }
    const loadData = async () => {
      setError('');
      try {
        const [statsData, historyData, matchesData] = await Promise.all([
          apiFetch(`/players/${selectedPlayerId}/stats`),
          apiFetch(`/players/${selectedPlayerId}/elo-history`),
          apiFetch(`/players/${selectedPlayerId}/matches`),
        ]);
        setStats(statsData);
        setHistory(historyData.history || []);
        setMatches(matchesData.matches || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar estadisticas.');
      }
    };
    loadData();
  }, [selectedPlayerId]);

  const toggleDetail = async (matchId) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(matchId);
    if (matchDetails[matchId]) {
      return;
    }
    setDetailLoading(true);
    setError('');
    try {
      const detail = await apiFetch(`/matches/${matchId}`);
      setMatchDetails((prev) => ({ ...prev, [matchId]: detail }));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle.');
    } finally {
      setDetailLoading(false);
    }
  };

  const startEditMatch = (detail) => {
    const resultWinner = detail.MatchResult
      ? detail.MatchResult.is_draw
        ? 'draw'
        : detail.MatchResult.winning_team_id
        ? String(detail.MatchResult.winning_team_id)
        : ''
      : '';
    setEditMatchId(detail.id);
    setEditForm({
      match_date: detail.match_date || '',
      status: detail.status || 'pending',
      notes: detail.notes || '',
      court_id: detail.court_id ? String(detail.court_id) : '',
      goal_diff: detail.MatchResult?.goal_diff ?? 0,
      result_winner: resultWinner,
      mvp_player_id: detail.MatchResult?.mvp_player_id ? String(detail.MatchResult.mvp_player_id) : '',
    });
  };

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveEdit = async () => {
    if (!editMatchId) return;
    setError('');
    try {
      const detail = matchDetails[editMatchId];
      if (detail?.MatchResult && !editForm.result_winner) {
        setError('Selecciona el resultado.');
        return;
      }
      const payload = {
        match_date: editForm.match_date,
        status: editForm.status,
        notes: editForm.notes || null,
        court_id: editForm.court_id ? Number(editForm.court_id) : null,
      };
      const updated = await apiFetch(`/matches/${editMatchId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (detail?.MatchResult) {
        const isDraw = editForm.result_winner === 'draw';
        const distinctions = (detail.Distinctions || []).map((item) => ({
          player_id: item.player_id,
          type: item.type,
          notes: item.notes || '',
        }));
        await apiFetch(`/matches/${editMatchId}/result`, {
          method: 'PATCH',
          body: JSON.stringify({
            winning_team_id: isDraw ? null : Number(editForm.result_winner),
            is_draw: isDraw,
            goal_diff: Number(editForm.goal_diff),
            mvp_player_id: editForm.mvp_player_id ? Number(editForm.mvp_player_id) : null,
            distinctions,
          }),
        });
      }
      setMatchDetails((prev) => {
        const next = { ...prev };
        const current = next[editMatchId];
        if (current?.MatchResult) {
          current.MatchResult = {
            ...current.MatchResult,
            winning_team_id:
              editForm.result_winner === 'draw' ? null : Number(editForm.result_winner),
            is_draw: editForm.result_winner === 'draw',
            goal_diff: Number(editForm.goal_diff),
            mvp_player_id: editForm.mvp_player_id ? Number(editForm.mvp_player_id) : null,
          };
        }
        next[editMatchId] = { ...current, ...updated };
        return next;
      });
      setGeneralMatches((prev) => prev.map((m) => (m.id === editMatchId ? updated : m)));
      setEditMatchId(null);
    } catch (err) {
      setError(err.message || 'No se pudo editar el partido.');
    }
  };

  const onDeleteMatch = async (matchId) => {
    if (!isAdmin) return;
    const confirmed = window.confirm('¿Eliminar partido? Esta accion no se puede deshacer.');
    if (!confirmed) return;
    setError('');
    try {
      await apiFetch(`/matches/${matchId}`, { method: 'DELETE' });
      setGeneralMatches((prev) => prev.filter((match) => match.id !== matchId));
      setMatchDetails((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      if (expandedMatchId === matchId) setExpandedMatchId(null);
      if (editMatchId === matchId) setEditMatchId(null);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el partido.');
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-xs">
          <p className="eyebrow">Historial</p>
          <h1>Estadisticas</h1>
          <p className="muted">Consulta el detalle de partidos y el rendimiento de los jugadores.</p>
        </div>

        <div className="stack gap-md">
          <div className="card stack gap-sm">
            <h2>Seleccion de vista</h2>
            <div className="toggle">
            <button
              className={viewMode === 'general' ? 'button toggle-btn is-active' : 'button button--ghost toggle-btn'}
              type="button"
              onClick={() => setViewMode('general')}
            >
              Historial general
            </button>
            <button
              className={viewMode === 'player' ? 'button toggle-btn is-active' : 'button button--ghost toggle-btn'}
              type="button"
              onClick={() => setViewMode('player')}
            >
              Historial por jugador
            </button>
            </div>
          </div>

          {error ? <p className="notice error">{error}</p> : null}

          {viewMode === 'general' ? (
            <>
              <h2>Historial general</h2>
              {generalLoading ? <p className="notice">Cargando...</p> : null}
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cancha</th>
                      <th>Resultado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalMatches.map((match) => {
                      const detail = matchDetails[match.id];
                      const courtName =
                        detail?.Court?.name ||
                        courts.find((court) => court.id === match.court_id)?.name ||
                        '—';
                      let resultLabel = '—';
                      if (detail?.MatchResult) {
                        if (detail.MatchResult.is_draw) {
                          resultLabel = 'Empate';
                        } else {
                          const winner = (detail.Teams || []).find(
                            (team) => team.id === detail.MatchResult.winning_team_id
                          );
                          resultLabel = winner ? `Gana ${winner.name}` : 'Ganador';
                        }
                      }

                      return (
                        <tr key={match.id}>
                          <td>{match.match_date}</td>
                          <td>{courtName}</td>
                          <td>{resultLabel}</td>
                          <td>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => toggleDetail(match.id)}
                            >
                              {expandedMatchId === match.id ? 'Ocultar' : 'Ver detalle'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {expandedMatchId ? (
                <div className="card">
                  {detailLoading ? (
                    <p className="notice">Cargando detalle...</p>
                  ) : (
                    (() => {
                      const detail = matchDetails[expandedMatchId];
                      if (!detail) return null;
                      const teams = detail.Teams || [];
                      return (
                        <div className="stack gap-sm">
                          <h2>Detalle {detail.match_date}</h2>
                          <p className="muted">
                            Resultado:{' '}
                            {detail.MatchResult
                              ? detail.MatchResult.is_draw
                                ? 'Empate'
                                : (() => {
                                    const winner = (detail.Teams || []).find(
                                      (team) => team.id === detail.MatchResult.winning_team_id
                                    );
                                    return winner ? `Gana ${winner.name}` : 'Ganador';
                                  })()
                              : 'Pendiente'}
                          </p>
                          {detail.MatchResult ? (
                            <p className="muted">Diferencia de gol: {detail.MatchResult.goal_diff}</p>
                          ) : null}
                          {isAdmin ? (
                            <>
                              <button
                                className="button button--ghost"
                                type="button"
                                onClick={() => startEditMatch(detail)}
                              >
                                Editar partido
                              </button>
                              {(detail.status === 'completed' || detail.MatchResult) ? (
                                <button
                                  className="button button--ghost"
                                  type="button"
                                  onClick={() => onDeleteMatch(detail.id)}
                                >
                                  Eliminar partido
                                </button>
                              ) : null}
                              {editMatchId === detail.id ? (
                                <div className="card">
                                  <div className="grid grid-2">
                                    <label className="field">
                                      <span>Fecha</span>
                                      <input
                                        className="input"
                                        type="date"
                                        name="match_date"
                                        value={editForm.match_date}
                                        onChange={onEditChange}
                                      />
                                    </label>
                                    <label className="field">
                                      <span>Estado</span>
                                      <select
                                        className="input"
                                        name="status"
                                        value={editForm.status}
                                        onChange={onEditChange}
                                      >
                                        <option value="pending">pending</option>
                                        <option value="completed">completed</option>
                                      </select>
                                    </label>
                                    <label className="field">
                                      <span>Cancha</span>
                                      <select
                                        className="input"
                                        name="court_id"
                                        value={editForm.court_id}
                                        onChange={onEditChange}
                                      >
                                        <option value="">Sin cancha</option>
                                        {courts.map((court) => (
                                          <option key={court.id} value={court.id}>
                                            {court.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="field">
                                      <span>Notas</span>
                                      <input
                                        className="input"
                                        name="notes"
                                        value={editForm.notes}
                                        onChange={onEditChange}
                                      />
                                    </label>
                                    {detail.MatchResult ? (
                                      <>
                                        <label className="field">
                                          <span>Resultado</span>
                                          <select
                                            className="input"
                                            name="result_winner"
                                            value={editForm.result_winner}
                                            onChange={onEditChange}
                                          >
                                            <option value="">Seleccionar</option>
                                            {(detail.Teams || []).map((team) => (
                                              <option key={team.id} value={team.id}>
                                                {team.name}
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
                                            name="goal_diff"
                                            value={editForm.goal_diff}
                                            onChange={onEditChange}
                                          />
                                        </label>
                                        <label className="field">
                                          <span>MVP</span>
                                          <select
                                            className="input"
                                            name="mvp_player_id"
                                            value={editForm.mvp_player_id}
                                            onChange={onEditChange}
                                          >
                                            <option value="">Sin MVP</option>
                                            {(detail.Teams || [])
                                              .flatMap((team) => team.Players || [])
                                              .map((player) => (
                                                <option key={player.id} value={player.id}>
                                                  {player.name}
                                                </option>
                                              ))}
                                          </select>
                                        </label>
                                      </>
                                    ) : (
                                      <label className="field">
                                        <span>Diferencia de gol</span>
                                        <input
                                          className="input"
                                          type="number"
                                          min="0"
                                          name="goal_diff"
                                          value={editForm.goal_diff}
                                          onChange={onEditChange}
                                        />
                                      </label>
                                    )}
                                  </div>
                                  <div className="actions">
                                    <button className="button" type="button" onClick={onSaveEdit}>
                                      Guardar
                                    </button>
                                    <button
                                      className="button button--ghost"
                                      type="button"
                                      onClick={() => setEditMatchId(null)}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : null}
                          <div className="grid grid-2">
                            {teams.map((team) => (
                              <div key={team.id} className="card">
                                <h2>{team.name}</h2>
                                <ul className="list">
                                  {(team.Players || []).map((player) => {
                                    const isMvp = detail.MatchResult?.mvp_player_id === player.id;
                                    return (
                                      <li key={player.id}>
                                        {player.name}
                                        {isMvp ? <span className="badge">mvp</span> : null}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <h2>Historial por jugador</h2>
              <label className="field">
                <span>Jugador</span>
                <select
                  className="input"
                  value={selectedPlayerId}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>

              {stats ? (
                <div className="grid grid-4">
                  <div className="card">
                    <p className="muted">Elo</p>
                    <h2>{stats.elo}</h2>
                  </div>
                  <div className="card">
                    <p className="muted">Jugados</p>
                    <h2>{stats.matches_played}</h2>
                  </div>
                  <div className="card">
                    <p className="muted">Ganados</p>
                    <h2>{stats.wins}</h2>
                  </div>
                  <div className="card">
                    <p className="muted">MVP</p>
                    <h2>{stats.mvp_count}</h2>
                  </div>
                </div>
              ) : null}

              {history.length ? (
                <div className="card">
                  <h2>Evolucion Elo</h2>
                  <ul className="list">
                    {history.map((item) => (
                      <li key={item.id}>
                        {item.Match?.match_date} · {item.elo_before} → {item.elo_after} ({item.delta})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {matches.length ? (
                <div className="card">
                  <h2>Historial de partidos</h2>
                  <ul className="list">
                    {matches.map((match) => {
                      const teams = match.Teams || [];
                      const playerTeam = teams.find((team) =>
                        (team.Players || []).some((player) => player.id === Number(selectedPlayerId))
                      );
                      const opponentTeam = teams.find((team) => team.id !== playerTeam?.id);
                      const result = match.MatchResult;
                      const isMvp =
                        result && result.mvp_player_id === Number(selectedPlayerId);
                      let outcome = 'Pendiente';
                      if (result) {
                        if (result.is_draw) {
                          outcome = 'Empate';
                        } else if (playerTeam && result.winning_team_id === playerTeam.id) {
                          outcome = 'Gano';
                        } else {
                          outcome = 'Perdio';
                        }
                      }

                      return (
                        <li key={match.id}>
                          {match.match_date} · {playerTeam?.name || 'Equipo'} vs{' '}
                          {opponentTeam?.name || 'Rival'} · {outcome}{' '}
                          {isMvp ? <span className="badge">mvp</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
