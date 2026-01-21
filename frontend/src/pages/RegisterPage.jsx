import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialState = { invite: '' };

function parseInvite(value) {
  const raw = value.trim();
  if (!raw) return null;

  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      path = new URL(raw).pathname;
    } catch {
      path = raw;
    }
  }

  const match = path.match(/(?:^|\/)invites\/([^/]+)\/([^/?#]+)/);
  if (match) {
    return { slug: match[1].toLowerCase(), token: match[2] };
  }

  const fallback = raw.match(/^([a-z0-9]+)\/([^/?#]+)$/i);
  if (fallback) {
    return { slug: fallback[1].toLowerCase(), token: fallback[2] };
  }

  return null;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');

  const onChange = (event) => {
    const { value } = event.target;
    setForm({ invite: value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setError('');

    const parsed = parseInvite(form.invite);
    if (!parsed) {
      setError('Ingresa un link de invitacion valido.');
      return;
    }

    navigate(`/invites/${parsed.slug}/${parsed.token}`);
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <form className="stack gap-md" onSubmit={onSubmit}>
          <div className="stack gap-xs">
            <h1>Crear usuario</h1>
            <p className="muted">Necesitas un link de invitacion para registrarte.</p>
          </div>

          <label className="field">
            <span>Link de invitacion</span>
            <input
              className="input"
              type="text"
              name="invite"
              value={form.invite}
              onChange={onChange}
              placeholder="https://tudominio.com/invites/slug/token"
              required
            />
          </label>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="actions">
            <button className="button" type="submit">
              Continuar
            </button>
            <button className="button button--ghost" type="button" onClick={() => navigate('/login')}>
              Volver al login
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
