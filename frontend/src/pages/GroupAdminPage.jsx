import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { getAuth } from '../services/auth';

const GROUP_KEY = 'fuchibol_group_id';
const emptyGroup = { name: '', slug: '' };

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);

export function GroupAdminPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserId = auth?.user?.id;

  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(() => localStorage.getItem(GROUP_KEY) || '');

  const [editForm, setEditForm] = useState({ ...emptyGroup });
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(null);
  const [editSlugTouched, setEditSlugTouched] = useState(false);

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

  useEffect(() => {
    if (activeGroup) {
      setEditForm({ name: activeGroup.name, slug: activeGroup.slug });
      setEditSlugTouched(false);
    } else {
      setEditForm({ ...emptyGroup });
      setEditSlugTouched(false);
    }
  }, [activeGroup]);

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

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !editSlugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (name === 'slug') {
      setEditSlugTouched(true);
    }
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
      navigate('/groups', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo eliminar grupo.');
    } finally {
      setDeleteLoading(false);
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
            <p className="eyebrow">Admin</p>
            <h1>Panel de grupo</h1>
            <p className="muted">Gestion del grupo activo.</p>
          </div>

          {error ? <p className="notice error">{error}</p> : null}

          {loading ? (
            <p className="notice">Cargando...</p>
          ) : !activeGroup ? (
            <p className="notice">Selecciona un grupo en Grupos para continuar.</p>
          ) : activeRole !== 'admin' ? (
            <p className="notice">No tenes permisos de admin en el grupo activo.</p>
          ) : (
            <div className="stack gap-sm">
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
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
