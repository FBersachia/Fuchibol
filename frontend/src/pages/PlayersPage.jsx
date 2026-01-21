import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';
import { getAuth } from '../services/auth';

const emptyCreate = { name: '', gender: 'h', elo: 500, is_goalkeeper: false };

export function PlayersPage() {
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';
  const [players, setPlayers] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState({ ...emptyCreate, user_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const loadPlayers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/players');
      setPlayers(data);
      if (isAdmin) {
        const usersData = await apiFetch('/users');
        setUsers(usersData);
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar jugadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const list = term
      ? players.filter((player) => player.name.toLowerCase().includes(term))
      : players;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [players, filter]);

  const onCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onCreateSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        name: createForm.name.trim(),
        gender: createForm.gender,
        elo: Number(createForm.elo),
        is_goalkeeper: createForm.is_goalkeeper,
        user_id: createForm.user_id ? Number(createForm.user_id) : null,
      };
      const created = await apiFetch('/players', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPlayers((prev) => [...prev, created]);
      setCreateForm({ ...emptyCreate, user_id: '' });
    } catch (err) {
      setError(err.message || 'No se pudo crear jugador.');
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
      setEditForm({
        name: player.name,
        gender: player.gender,
        elo: player.elo,
        wins: player.wins,
        losses: player.losses,
        is_goalkeeper: player.is_goalkeeper,
        user_id: player.user_id ? String(player.user_id) : '',
      });
  };

  const onEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      const payload = {
        name: editForm.name.trim(),
        gender: editForm.gender,
        elo: Number(editForm.elo),
        wins: Number(editForm.wins),
        losses: Number(editForm.losses),
        is_goalkeeper: editForm.is_goalkeeper,
        user_id: editForm.user_id ? Number(editForm.user_id) : null,
      };
      const updated = await apiFetch(`/players/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setPlayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
      cancelEdit();
    } catch (err) {
      setError(err.message || 'No se pudo guardar jugador.');
    }
  };

  const removePlayer = async (id) => {
    setError('');
    try {
      await apiFetch(`/players/${id}`, { method: 'DELETE' });
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar jugador.');
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-sm">
          <label className="field">
            <span>Buscar por nombre</span>
            <input
              className="input"
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>

          {isAdmin ? (
            <form className="card stack gap-sm" onSubmit={onCreateSubmit}>
              <div className="grid grid-3">
                <label className="field">
                  <span>Nombre</span>
                  <input
                    className="input"
                    name="name"
                    value={createForm.name}
                    onChange={onCreateChange}
                    required
                  />
                </label>
                <label className="field">
                  <span>Genero</span>
                  <select
                    className="input"
                    name="gender"
                    value={createForm.gender}
                    onChange={onCreateChange}
                  >
                    <option value="h">H</option>
                    <option value="m">M</option>
                  </select>
                </label>
                <label className="field">
                  <span>Elo</span>
                  <input
                    className="input"
                    type="number"
                    name="elo"
                    value={createForm.elo}
                    onChange={onCreateChange}
                    min="0"
                    placeholder="500"
                    required
                  />
                </label>
                <label className="field">
                  <span>Usuario</span>
                  <select
                    className="input"
                    name="user_id"
                    value={createForm.user_id}
                    onChange={onCreateChange}
                  >
                    <option value="">Sin usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field checkbox">
                <input
                  type="checkbox"
                  name="is_goalkeeper"
                  checked={createForm.is_goalkeeper}
                  onChange={onCreateChange}
                />
                <span>Arquero</span>
              </label>
              <button className="button" type="submit">
                Crear
              </button>
            </form>
          ) : null}
        </div>

        {error ? <p className="notice error">{error}</p> : null}

        {loading ? (
          <p className="notice">Cargando...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Genero</th>
                  <th>Elo</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Arquero</th>
                  {isAdmin ? <th>Usuario</th> : null}
                  {isAdmin ? <th>Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const isEditing = editingId === player.id;
                  return (
                    <tr key={player.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            name="name"
                            value={editForm.name}
                            onChange={onEditChange}
                          />
                        ) : (
                          player.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="input input--table"
                            name="gender"
                            value={editForm.gender}
                            onChange={onEditChange}
                          >
                            <option value="h">H</option>
                            <option value="m">M</option>
                          </select>
                        ) : (
                          player.gender
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            type="number"
                            name="elo"
                            value={editForm.elo}
                            onChange={onEditChange}
                            min="0"
                          />
                        ) : (
                          player.elo
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            type="number"
                            name="wins"
                            value={editForm.wins}
                            onChange={onEditChange}
                            min="0"
                          />
                        ) : (
                          player.wins
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            type="number"
                            name="losses"
                            value={editForm.losses}
                            onChange={onEditChange}
                            min="0"
                          />
                        ) : (
                          player.losses
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            type="checkbox"
                            name="is_goalkeeper"
                            checked={editForm.is_goalkeeper}
                            onChange={onEditChange}
                          />
                        ) : player.is_goalkeeper ? (
                          'Si'
                        ) : (
                          'No'
                        )}
                      </td>
                      {isAdmin ? (
                        <td>
                          {isEditing ? (
                            <select
                              className="input input--table"
                              name="user_id"
                              value={editForm.user_id}
                              onChange={onEditChange}
                            >
                              <option value="">Sin usuario</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            player.User?.name ||
                            users.find((user) => user.id === player.user_id)?.name ||
                            '—'
                          )}
                        </td>
                      ) : null}
                      {isAdmin ? (
                        <td>
                          {isEditing ? (
                            <div className="actions">
                              <button
                                className="button button--ghost"
                                type="button"
                                onClick={() => saveEdit(player.id)}
                              >
                                Guardar
                              </button>
                              <button className="button button--ghost" type="button" onClick={cancelEdit}>
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="actions">
                              <button
                                className="button button--ghost"
                                type="button"
                                onClick={() => startEdit(player)}
                              >
                                Editar
                              </button>
                              <button
                                className="button button--ghost"
                                type="button"
                                onClick={() => removePlayer(player.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
