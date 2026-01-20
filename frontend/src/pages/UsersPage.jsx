import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const emptyUser = { name: '', email: '', role: 'user', password: '' };

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [createForm, setCreateForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [resetForm, setResetForm] = useState({ id: '', new_password: '' });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setError('');
    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar usuarios.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        password: createForm.password,
      };
      const created = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUsers((prev) => [...prev, created]);
      setCreateForm(emptyUser);
    } catch (err) {
      setError(err.message || 'No se pudo crear usuario.');
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
  };

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      const updated = await apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar usuario.');
    }
  };

  const deleteUser = async (id) => {
    setError('');
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar usuario.');
    }
  };

  const onResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((prev) => ({ ...prev, [name]: value }));
  };

  const onResetPassword = async (event) => {
    event.preventDefault();
    if (!resetForm.id) return;
    setError('');
    try {
      await apiFetch(`/users/${resetForm.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: resetForm.new_password }),
      });
      setResetForm({ id: '', new_password: '' });
    } catch (err) {
      setError(err.message || 'No se pudo resetear password.');
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-md">
          <form className="card stack gap-sm" onSubmit={onCreate}>
            <h2>Crear usuario</h2>
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
                <span>Email</span>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={onCreateChange}
                  required
                />
              </label>
              <label className="field">
                <span>Rol</span>
                <select
                  className="input"
                  name="role"
                  value={createForm.role}
                  onChange={onCreateChange}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Password</span>
              <input
                className="input"
                name="password"
                type="password"
                value={createForm.password}
                onChange={onCreateChange}
                required
              />
            </label>
            <button className="button" type="submit">
              Crear
            </button>
          </form>

          <form className="card stack gap-sm" onSubmit={onResetPassword}>
            <h2>Reset password</h2>
            <div className="grid grid-2">
              <label className="field">
                <span>Usuario</span>
                <select
                  className="input"
                  name="id"
                  value={resetForm.id}
                  onChange={onResetChange}
                >
                  <option value="">Seleccionar</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Nuevo password</span>
                <input
                  className="input"
                  name="new_password"
                  type="password"
                  value={resetForm.new_password}
                  onChange={onResetChange}
                  required
                />
              </label>
            </div>
            <button className="button button--ghost" type="submit">
              Resetear
            </button>
          </form>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditing = editingId === user.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            name="name"
                            value={editForm.name}
                            onChange={onEditChange}
                          />
                        ) : (
                          user.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="input input--table"
                            name="email"
                            value={editForm.email}
                            onChange={onEditChange}
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            className="input input--table"
                            name="role"
                            value={editForm.role}
                            onChange={onEditChange}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          user.role
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="actions">
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => saveEdit(user.id)}
                            >
                              Guardar
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
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
                              onClick={() => startEdit(user)}
                            >
                              Editar
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => deleteUser(user.id)}
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
      </section>
    </main>
  );
}
