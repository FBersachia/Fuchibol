import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

function toShareUrl(inviteUrl) {
  if (!inviteUrl) return '';
  const path = inviteUrl.replace(/\/join$/, '');
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${window.location.origin}${path}`;
}

async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

const emptySpecific = { player_id: '', regenerate: false };

export function InvitesPage() {
  const [players, setPlayers] = useState([]);
  const [generalInvite, setGeneralInvite] = useState(null);
  const [specificInvite, setSpecificInvite] = useState(null);
  const [specificForm, setSpecificForm] = useState(emptySpecific);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [creatingGeneral, setCreatingGeneral] = useState(false);
  const [creatingSpecific, setCreatingSpecific] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlayers = async () => {
      setLoadingPlayers(true);
      setError('');
      try {
        const data = await apiFetch('/players');
        setPlayers(data);
      } catch (err) {
        setError(err.message || 'No se pudo cargar jugadores.');
      } finally {
        setLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, []);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [players]
  );

  const onCreateGeneral = async () => {
    setCreatingGeneral(true);
    setError('');
    try {
      const invite = await apiFetch('/invites/general', { method: 'POST' });
      setGeneralInvite(invite);
      const copied = await copyToClipboard(toShareUrl(invite.url));
      if (!copied) {
        setError('No se pudo copiar el link al portapapeles.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear invitacion general.');
    } finally {
      setCreatingGeneral(false);
    }
  };

  const onSpecificChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSpecificForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onCreateSpecific = async (event) => {
    event.preventDefault();
    if (!specificForm.player_id) return;

    setCreatingSpecific(true);
    setError('');
    try {
      const payload = {
        player_id: Number(specificForm.player_id),
        regenerate: Boolean(specificForm.regenerate),
      };
      const invite = await apiFetch('/invites/specific', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSpecificInvite(invite);
      const copied = await copyToClipboard(toShareUrl(invite.url));
      if (!copied) {
        setError('No se pudo copiar el link al portapapeles.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear invitacion especifica.');
    } finally {
      setCreatingSpecific(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-md">
          <div className="stack gap-xs">
            <p className="eyebrow">Invitaciones</p>
            <h1>Invita jugadores al grupo</h1>
            <p className="muted">Genera links para sumar miembros o vincular jugadores existentes.</p>
          </div>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="card stack gap-sm">
            <h2>Invitacion general</h2>
            <p className="muted">Link reusable (max 30 usos). Regenerar invalida el anterior.</p>
            <button className="button" type="button" onClick={onCreateGeneral} disabled={creatingGeneral}>
              {creatingGeneral ? 'Generando...' : 'Generar link general'}
            </button>
            {generalInvite ? (
              <div className="stack gap-sm">
                <label className="field">
                  <span>Link para compartir</span>
                  <input className="input" value={toShareUrl(generalInvite.url)} readOnly />
                </label>
                <div className="grid grid-3">
                  <div className="meta">
                    <span>Expira</span>
                    <span>{formatDate(generalInvite.expires_at)}</span>
                  </div>
                  <div className="meta">
                    <span>Usos</span>
                    <span>
                      {generalInvite.used_count}/{generalInvite.max_uses}
                    </span>
                  </div>
                  <div className="meta">
                    <span>Token</span>
                    <span className="token">{generalInvite.token}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <form className="card stack gap-sm" onSubmit={onCreateSpecific}>
            <h2>Invitacion especifica</h2>
            <p className="muted">Link de un solo uso para vincular un jugador existente.</p>
            {loadingPlayers ? (
              <p className="notice">Cargando jugadores...</p>
            ) : (
              <div className="grid grid-2">
                <label className="field">
                  <span>Jugador</span>
                  <select
                    className="input"
                    name="player_id"
                    value={specificForm.player_id}
                    onChange={onSpecificChange}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {sortedPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field checkbox">
                  <input
                    type="checkbox"
                    name="regenerate"
                    checked={specificForm.regenerate}
                    onChange={onSpecificChange}
                  />
                  <span>Regenerar link si ya existe</span>
                </label>
              </div>
            )}
            <button className="button" type="submit" disabled={creatingSpecific || !specificForm.player_id}>
              {creatingSpecific ? 'Generando...' : 'Generar link especifico'}
            </button>
            {specificInvite ? (
              <div className="stack gap-sm">
                <label className="field">
                  <span>Link para compartir</span>
                  <input className="input" value={toShareUrl(specificInvite.url)} readOnly />
                </label>
                <div className="grid grid-3">
                  <div className="meta">
                    <span>Expira</span>
                    <span>{formatDate(specificInvite.expires_at)}</span>
                  </div>
                  <div className="meta">
                    <span>Usos</span>
                    <span>
                      {specificInvite.used_count}/{specificInvite.max_uses}
                    </span>
                  </div>
                  <div className="meta">
                    <span>Token</span>
                    <span className="token">{specificInvite.token}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}
