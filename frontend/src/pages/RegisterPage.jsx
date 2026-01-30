import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { setAuth } from '../services/auth';

const GROUP_KEY = 'fuchibol_group_id';
const initialState = { email: '', password: '' };

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    if (!payload.email || !payload.password) {
      setError('Completa email y contrasena.');
      return;
    }

    if (payload.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const auth = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuth(auth);
      localStorage.removeItem(GROUP_KEY);
      navigate('/inicio', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <form className="stack gap-md" onSubmit={onSubmit}>
          <div className="stack gap-xs">
            <h1>Crear usuario</h1>
            <p className="muted">Vas a poder unirte a un grupo o crear uno nuevo.</p>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className="field">
            <span>Contrasena</span>
            <input
              className="input"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              minLength={8}
              required
            />
          </label>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear usuario'}
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
