import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export function CourtsPage() {
  const [courts, setCourts] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const loadCourts = async () => {
    setError('');
    try {
      const data = await apiFetch('/courts');
      setCourts(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar canchas.');
    }
  };

  useEffect(() => {
    loadCourts();
  }, []);

  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const created = await apiFetch('/courts', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      setCourts((prev) => [...prev, created]);
      setName('');
    } catch (err) {
      setError(err.message || 'No se pudo crear cancha.');
    }
  };

  const startEdit = (court) => {
    setEditingId(court.id);
    setEditName(court.name);
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      const updated = await apiFetch(`/courts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName.trim() }),
      });
      setCourts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      setEditName('');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar cancha.');
    }
  };

  const removeCourt = async (id) => {
    setError('');
    try {
      await apiFetch(`/courts/${id}`, { method: 'DELETE' });
      setCourts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar cancha.');
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-xs">
          <p className="eyebrow">Canchas</p>
          <h1>Gestion de canchas</h1>
          <p className="muted">Crea y organiza las canchas disponibles.</p>
        </div>

        <div className="stack gap-md">
          <form className="card stack gap-sm" onSubmit={onCreate}>
            <h2>Agregar cancha</h2>
            <label className="field">
              <span>Nombre</span>
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <button className="button" type="submit">
              Crear
            </button>
          </form>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="stack gap-sm">
            <h2>Listado de canchas</h2>
            <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courts.map((court) => {
                  const isEditing = editingId === court.id;
                  return (
                    <tr key={court.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                          />
                        ) : (
                          court.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="actions">
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => saveEdit(court.id)}
                            >
                              Guardar
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditName('');
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="actions">
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => startEdit(court)}
                            >
                              Editar
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => removeCourt(court.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
