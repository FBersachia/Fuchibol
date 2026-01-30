import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { setAuth } from '../services/auth';

const initialState = { email: '', password: '' };

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = () => {
    navigate('/register');
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAuth(payload);
      navigate('/inicio', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <form className="stack gap-md" onSubmit={onSubmit}>
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
              required
            />
          </label>

          {error ? <p className="notice error">{error}</p> : null}

          <div className="actions">
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            <button className="button button--ghost" type="button" onClick={onRegister}>
              Crear usuario
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
