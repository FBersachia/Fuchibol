import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';

const GROUP_KEY = 'fuchibol_group_id';
const emptyGroup = { name: '', slug: '' };

function parseInvite(value) {
  const raw = value.trim();
  if (!raw) return null;

  let pathValue = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathValue = new URL(raw).pathname;
    } catch {
      pathValue = raw;
    }
  }

  const match = pathValue.match(/(?:^|\/)invites\/([^/]+)\/([^/?#]+)/);
  if (match) {
    return { slug: match[1].toLowerCase(), token: match[2] };
  }

  const fallback = raw.match(/^([a-z0-9]+)\/([^/?#]+)$/i);
  if (fallback) {
    return { slug: fallback[1].toLowerCase(), token: fallback[2] };
  }

  return null;
}

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40);

export function GroupsPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [allowMultipleGroups, setAllowMultipleGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(() => localStorage.getItem(GROUP_KEY) || '');

  const [createForm, setCreateForm] = useState({ ...emptyGroup });
  const [inviteForm, setInviteForm] = useState({ invite: '' });
  const [inviteError, setInviteError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createSlugTouched, setCreateSlugTouched] = useState(false);

  const [leaveLoading, setLeaveLoading] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/groups');
      const list = data?.groups || [];
      setGroups(list);
      setAllowMultipleGroups(Boolean(data?.allow_multiple_groups));

      const stored = localStorage.getItem(GROUP_KEY);
      if (stored && !list.some((group) => String(group.id) === String(stored))) {
        localStorage.removeItem(GROUP_KEY);
        setActiveId('');
      }
    } catch (err) {
      setError(err.message || 'No se pudo cargar grupos.');
      setAllowMultipleGroups(false);
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
  const canCreateGroup = !isAdminOfAny || allowMultipleGroups;

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(GROUP_KEY, String(activeId));
    } else {
      localStorage.removeItem(GROUP_KEY);
    }
  }, [activeId]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [groups]
  );

  const selectGroup = (group) => {
    localStorage.setItem(GROUP_KEY, String(group.id));
    setActiveId(String(group.id));
    navigate('/players', { replace: true });
  };

  const onInviteChange = (event) => {
    const { value } = event.target;
    setInviteForm({ invite: value });
  };

  const onInviteSubmit = (event) => {
    event.preventDefault();
    setInviteError('');

    const parsed = parseInvite(inviteForm.invite);
    if (!parsed) {
      setInviteError('Ingresa un link de invitacion valido.');
      return;
    }

    navigate(`/invites/${parsed.slug}/${parsed.token}`);
  };

  const onCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !createSlugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (name === 'slug') {
      setCreateSlugTouched(true);
    }
  };

  const onCreateGroup = async (event) => {
    event.preventDefault();
    if (!canCreateGroup) return;

    setCreating(true);
    setError('');
    try {
      const nextSlug = createForm.slug.trim() || slugify(createForm.name);
      const payload = {
        name: createForm.name.trim(),
        slug: nextSlug.trim().toLowerCase(),
      };
      const created = await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreateForm({ ...emptyGroup });
      setCreateSlugTouched(false);
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
      await loadGroups();
    } catch (err) {
      setError(err.message || 'No se pudo salir del grupo.');
    } finally {
      setLeaveLoading(false);
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
                        onClick={() =>
                          isActive ? navigate('/players', { replace: true }) : selectGroup(group)
                        }
                      >
                        {isActive ? 'Ir al grupo' : 'Ingresar'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card stack gap-sm">
            <h2>Como usar el sistema</h2>
            <ul className="list">
              <li>Selecciona un grupo y entra con "Ir al grupo".</li>
              <li>Como admin, gestiona el grupo desde Admin -> Grupo activo.</li>
              <li>Crea jugadores y canchas, genera equipos y carga resultados.</li>
              <li>Usa Invitaciones para sumar nuevos miembros.</li>
              <li>Podes cambiar de grupo en cualquier momento desde esta pantalla.</li>
            </ul>
          </div>

          <form className="card stack gap-sm" onSubmit={onInviteSubmit}>
            <h2>Unirse a un grupo</h2>
            <p className="muted">Pega el link de invitacion generado por un admin.</p>
            <label className="field">
              <span>Link de invitacion</span>
              <input
                className="input"
                type="text"
                name="invite"
                value={inviteForm.invite}
                onChange={onInviteChange}
                placeholder="https://tudominio.com/invites/slug/token"
                required
              />
            </label>
            {inviteError ? <p className="notice error">{inviteError}</p> : null}
            <button className="button" type="submit">Continuar</button>
          </form>

          <form className="card stack gap-sm" onSubmit={onCreateGroup}>
            <h2>Crear grupo</h2>
            {!canCreateGroup ? (
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
                  disabled={!canCreateGroup || creating}
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
                  disabled={!canCreateGroup || creating}
                />
              </label>
            </div>
            <button className="button" type="submit" disabled={!canCreateGroup || creating}>
              {creating ? 'Creando...' : 'Crear grupo'}
            </button>
          </form>

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
