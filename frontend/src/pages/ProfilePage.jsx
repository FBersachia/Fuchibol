import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { getAuth, setAuth } from '../services/auth';

const emptyProfile = { name: '', email: '', gender: '' };
const emptyPassword = { current_password: '', new_password: '' };

export function ProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setError('');
      try {
        const me = await apiFetch('/auth/me');
        setProfile({
          name: me?.name || '',
          email: me?.email || '',
          gender: me?.gender || '',
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess('');
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordSuccess) setPasswordSuccess('');
  };

  const onSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingProfile(true);
    try {
      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
      };
      if (profile.gender) payload.gender = profile.gender;

      const updated = await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setProfile({
        name: updated?.name || '',
        email: updated?.email || '',
        gender: updated?.gender || '',
      });

      const auth = getAuth();
      if (auth?.token) {
        setAuth({
          ...auth,
          user: {
            ...(auth.user || {}),
            id: updated?.id || auth.user?.id,
            name: updated?.name || auth.user?.name,
            role: updated?.role || auth.user?.role,
            email: updated?.email || auth.user?.email,
            gender: updated?.gender || auth.user?.gender,
          },
        });
      }
      setSuccess('Cambios guardados.');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setSavingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm(emptyPassword);
      setPasswordSuccess('Password actualizado.');
    } catch (err) {
      setPasswordError(err.message || 'No se pudo actualizar la contrasena.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <div className="stack gap-md">
          <div className="stack gap-xs">
            <h1>Mi perfil</h1>
          </div>

          {loading ? <p className="notice">Cargando...</p> : null}

          {!loading ? (
            <>
              <form className="card stack gap-sm" onSubmit={onSaveProfile}>
                <h2>Datos personales</h2>
                <label className="field">
                  <span>Nombre</span>
                  <input
                    className="input"
                    name="name"
                    value={profile.name}
                    onChange={onProfileChange}
                    required
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={onProfileChange}
                    required
                  />
                </label>
                <label className="field">
                  <span>Genero</span>
                  <select
                    className="input"
                    name="gender"
                    value={profile.gender}
                    onChange={onProfileChange}
                  >
                    <option value="">Seleccionar</option>
                    <option value="h">H</option>
                    <option value="m">M</option>
                  </select>
                </label>

                {error ? <p className="notice error">{error}</p> : null}
                {success ? <p className="notice">{success}</p> : null}

                <button className="button" type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Guardando...' : 'Guardar'}
                </button>
              </form>

              <form className="card stack gap-sm" onSubmit={onSavePassword}>
                <h2>Cambiar contrasena</h2>
                <label className="field">
                  <span>Contrasena actual</span>
                  <input
                    className="input"
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={onPasswordChange}
                    required
                  />
                </label>
                <label className="field">
                  <span>Nueva contrasena</span>
                  <input
                    className="input"
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={onPasswordChange}
                    required
                  />
                </label>

                {passwordError ? <p className="notice error">{passwordError}</p> : null}
                {passwordSuccess ? <p className="notice">{passwordSuccess}</p> : null}

                <button className="button button--ghost" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Actualizando...' : 'Actualizar password'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
