import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { getAuth } from '../services/auth';

const GROUP_KEY = 'fuchibol_group_id';
const emptyGroup = { name: '', slug: '' };

export function GroupsPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserId = auth?.user?.id;

  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(() => localStorage.getItem(GROUP_KEY) || '');

  const [createForm, setCreateForm] = useState({ ...emptyGroup });
  const [creating, setCreating] = useState(false);

  const [editForm, setEditForm] = useState({ ...emptyGroup });
  const [saving, setSaving] = useState(false);

  const [transferLoading, setTransferLoading] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/groups');
      const list = data?.groups || [];
      setGroups(list);

      const stored = localStorage.getItem(GROUP_KEY);
      if (stored && !list.some((group) => String(group.id) === String(stored))) {
        localStorage.removeItem(GROUP_KEY);
        setActiveId('');
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar grupos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const activeGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(activeId)),
    [groups, activeId]
  );
  const activeRole = activeGroup?.role;
  const isAdminOfAny = groups.some((group) => group.role === 'admin');

  useEffect(() => {
    if (activeGroup) {
      setEditForm({ name: activeGroup.name, slug: activeGroup.slug });
    } else {
      setEditForm({ ...emptyGroup });
    }
  }, [activeGroup]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(GROUP_KEY, String(activeId));
    } else {
      localStorage.removeItem(GROUP_KEY);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeGroup || activeRole !== 'admin') {
      setMembers([]);
      setMembersLoading(false);
      return;
    }

    const loadMembers = async () => {
      setMembersLoading(true);
      setError('');
      try {
        const data = await apiFetch('/groups/members', {
          headers: { 'X-Group-Id': String(activeGroup.id) },
        });
        setMembers(data?.members || []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar miembros.');
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [activeGroup, activeRole]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [groups]
  );

  const selectGroup = (group) => {
    localStorage.setItem(GROUP_KEY, String(group.id));
    setActiveId(String(group.id));
    navigate('/players', { replace: true });
  };

  const onCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreateGroup = async (event) => {
    event.preventDefault();
    if (isAdminOfAny) return;

    setCreating(true);
    setError('');
    try {
      const payload = {
        name: createForm.name.trim(),
        slug: createForm.slug.trim().toLowerCase(),
      };
      const created = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreateForm({ ...emptyGroup });
      await loadGroups();
      if (created?.id) {
        setActiveId(String(created.id));
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear grupo.');
    } finally {
      setCreating(false);
    }
  };

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveGroup = async (event) => {
    event.preventDefault();
    if (!activeGroup) return;

    const trimmedName = editForm.name.trim();
    const trimmedSlug = editForm.slug.trim().toLowerCase();
    const payload = {};

    if (trimmedName && trimmedName !== activeGroup.name) {
      payload.name = trimmedName;
    }
    if (trimmedSlug && trimmedSlug !== activeGroup.slug) {
      payload.slug = trimmedSlug;
    }

    if (!Object.keys(payload).length) return;

    setSaving(true);
    setError('');
    try {
      const updated = await apiFetch(`/groups/${activeGroup.id}`, {
        method: 'PATCH',
        headers: { 'X-Group-Id': String(activeGroup.id) },
        body: JSON.stringify(payload),
      });
      setGroups((prev) =>
        prev.map((group) => (group.id === activeGroup.id ? { ...group, ...updated } : group))
      );
    } catch (err) {
      setError(err.message || 'No se pudo actualizar grupo.');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteGroup = async () => {
    if (!activeGroup) return;
    if (!window.confirm('Eliminar este grupo y sus miembros?')) return;

    setDeleteLoading(true);
    setError('');
    try {
      await apiFetch(`/groups/${activeGroup.id}`, {
        method: 'DELETE',
        headers: { 'X-Group-Id': String(activeGroup.id) },
      });
      localStorage.removeItem(GROUP_KEY);
      setActiveId('');
      setMembers([]);
      await loadGroups();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar grupo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onLeaveGroup = async () => {
    if (!activeGroup) return;

    setLeaveLoading(true);
    setError('');
    try {
      await apiFetch('/groups/leave', {
        method: 'POST',
        headers: { 'X-Group-Id': String(activeGroup.id) },
      });
      localStorage.removeItem(GROUP_KEY);
      setActiveId('');
      setMembers([]);
      await loadGroups();
    } catch (err) {
      setError(err.message || 'No se pudo salir del grupo.');
    } finally {
      setLeaveLoading(false);
    }
  };

  const onTransferAdmin = async (userId) => {
    if (!activeGroup) return;
    if (!window.confirm('Transferir admin a este miembro?')) return;

    setTransferLoading(userId);
    setError('');
    try {
      await apiFetch('/groups/transfer-admin', {
        method: 'POST',
        headers: { 'X-Group-Id': String(activeGroup.id) },
        body: JSON.stringify({ user_id: userId }),
      });
      await loadGroups();
      const data = await apiFetch('/groups/members', {
        headers: { 'X-Group-Id': String(activeGroup.id) },
      });
      setMembers(data?.members || []);
    } catch (err) {
      setError(err.message || 'No se pudo transferir admin.');
    } finally {
      setTransferLoading(null);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-md">
          <div className="stack gap-xs">
            <p className="eyebrow">Grupos</p>
            <h1>Selecciona tu grupo</h1>
            <p className="muted">Gestiona y cambia el espacio donde trabajas.</p>
          </div>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="stack gap-sm">
            <h2>Tus grupos</h2>
            {loading ? (
              <p className="notice">Cargando...</p>
            ) : sortedGroups.length === 0 ? (
              <p className="notice">No hay grupos asignados.</p>
            ) : (
              <div className="grid grid-3">
                {sortedGroups.map((group) => {
                  const isActive = String(group.id) === String(activeId);
                  return (
                    <article className="card group-card" key={group.id}>
                      <div className="stack gap-xs">
                        <h2>{group.name}</h2>
                        <p className="muted">@{group.slug}</p>
                        <span className="badge">{group.role}</span>
                      </div>
                      <button
                        className="button"
                        type="button"
                        onClick={() => selectGroup(group)}
                        disabled={isActive}
                      >
                        {isActive ? 'Activo' : 'Ingresar'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <form className="card stack gap-sm" onSubmit={onCreateGroup}>
            <h2>Crear grupo</h2>
            {isAdminOfAny ? (
              <p className="notice">Ya administras un grupo. No podes crear otro.</p>
            ) : null}
            <div className="grid grid-2">
              <label className="field">
                <span>Nombre</span>
                <input
                  className="input"
                  name="name"
                  value={createForm.name}
                  onChange={onCreateChange}
                  required
                  disabled={isAdminOfAny || creating}
                />
              </label>
              <label className="field">
                <span>Slug</span>
                <input
                  className="input"
                  name="slug"
                  value={createForm.slug}
                  onChange={onCreateChange}
                  placeholder="grupo123"
                  required
                  disabled={isAdminOfAny || creating}
                />
              </label>
            </div>
            <button className="button" type="submit" disabled={isAdminOfAny || creating}>
              {creating ? 'Creando...' : 'Crear grupo'}
            </button>
          </form>

          {activeGroup && activeRole === 'admin' ? (
            <div className="stack gap-sm">
              <div className="card stack gap-xs">
                <h2>Panel admin</h2>
                <p className="muted">Gestion del grupo activo.</p>
              </div>

              <form className="card stack gap-sm" onSubmit={onSaveGroup}>
                <h2>Editar grupo activo</h2>
                <div className="grid grid-2">
                  <label className="field">
                    <span>Nombre</span>
                    <input
                      className="input"
                      name="name"
                      value={editForm.name}
                      onChange={onEditChange}
                      required
                      disabled={saving}
                    />
                  </label>
                  <label className="field">
                    <span>Slug</span>
                    <input
                      className="input"
                      name="slug"
                      value={editForm.slug}
                      onChange={onEditChange}
                      required
                      disabled={saving}
                    />
                  </label>
                </div>
                <div className="actions">
                  <button className="button" type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={onDeleteGroup}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Eliminando...' : 'Eliminar grupo'}
                  </button>
                </div>
              </form>

              <div className="card stack gap-sm">
                <h2>Miembros</h2>
                {membersLoading ? (
                  <p className="notice">Cargando miembros...</p>
                ) : members.length === 0 ? (
                  <p className="notice">No hay miembros activos.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Genero</th>
                          <th>Rol</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => {
                          const memberUserId = member.user?.id;
                          const isSelf = memberUserId === currentUserId;
                          const canTransfer = member.role !== 'admin' && memberUserId;
                          return (
                            <tr key={member.id}>
                              <td>
                                {member.user?.name || 'Sin nombre'}
                                {isSelf ? ' (tu)' : ''}
                              </td>
                              <td>{member.user?.email || '-'}</td>
                              <td>{member.user?.gender || '-'}</td>
                              <td>{member.role}</td>
                              <td>
                                {canTransfer ? (
                                  <button
                                    className="button button--ghost"
                                    type="button"
                                    onClick={() => onTransferAdmin(memberUserId)}
                                    disabled={transferLoading === memberUserId}
                                  >
                                    {transferLoading === memberUserId ? 'Transfiriendo...' : 'Transferir admin'}
                                  </button>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="notice">Para salir del grupo primero transferi el rol admin.</p>
              </div>
            </div>
          ) : null}

          {activeGroup && activeRole !== 'admin' ? (
            <div className="card stack gap-sm">
              <h2>Tu membresia</h2>
              <p className="muted">Estas como miembro en {activeGroup.name}.</p>
              <div className="actions">
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={onLeaveGroup}
                  disabled={leaveLoading}
                >
                  {leaveLoading ? 'Saliendo...' : 'Salir del grupo'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
