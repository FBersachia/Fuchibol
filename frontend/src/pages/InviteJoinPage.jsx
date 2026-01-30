import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { setAuth } from '../services/auth';

const initialForm = {
  email: '',
  password: '',
  nickname: '',
  gender: '',
  elo: 500,
};

export function InviteJoinPage() {
  const navigate = useNavigate();
  const { slug, token } = useParams();
  const [form, setForm] = useState(initialForm);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [error, setError] = useState('');
  const [infoError, setInfoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    const loadInviteInfo = async () => {
      setLoadingInfo(true);
      setInfoError('');
      try {
        const info = await apiFetch(`/invites/${slug}/${token}`);
        setInviteInfo(info);
      } catch (err) {
        setInfoError(err.message || 'No se pudo validar la invitacion.');
      } finally {
        setLoadingInfo(false);
      }
    };

    loadInviteInfo();
  }, [slug, token]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };
    const isSpecific = inviteInfo?.type === 'specific';
    if (payload.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    if (!isSpecific) {
      if (form.nickname.trim()) payload.nickname = form.nickname.trim();
      if (form.gender) payload.gender = form.gender;
      if (form.elo !== '' && form.elo !== null && form.elo !== undefined) {
        payload.elo = Number(form.elo);
      }
    }

    try {
      const joinRes = await apiFetch(`/invites/${slug}/${token}/join`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const auth = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: payload.email, password: payload.password }),
      });
      setAuth(auth);
      if (joinRes?.group_id) {
        localStorage.setItem('fuchibol_group_id', String(joinRes.group_id));
      }
      navigate('/players', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo completar la invitacion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <div className="stack gap-md">
          <div className="stack gap-xs">
            <p className="eyebrow">Invitacion</p>
            <h1>Unirse al grupo</h1>
            <p className="muted">Completa tus datos para unirte.</p>
          </div>

          {loadingInfo ? <p className="notice">Cargando invitacion...</p> : null}
          {infoError ? <p className="notice error">{infoError}</p> : null}

          <form className="stack gap-sm" onSubmit={onSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>

            <label className="field">
              <span>Contrasena</span>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                minLength={8}
                required
              />
            </label>

            {inviteInfo?.type === 'specific' ? (
              <div className="card stack gap-sm">
                <h2>Jugador asignado</h2>
                <p className="muted">Este link ya tiene un jugador asociado.</p>
                <label className="field">
                  <span>Nickname</span>
                  <input className="input" value={inviteInfo?.player?.name || '-'} readOnly />
                </label>
              </div>
            ) : (
              <div className="card stack gap-sm">
                <h2>Datos del jugador (solo invitacion general)</h2>
                <label className="field">
                  <span>Nickname</span>
                  <input
                    className="input"
                    name="nickname"
                    value={form.nickname}
                    onChange={onChange}
                  />
                </label>
                <div className="grid grid-2">
                  <label className="field">
                    <span>Genero</span>
                    <select
                      className="input"
                      name="gender"
                      value={form.gender}
                      onChange={onChange}
                    >
                      <option value="">Seleccionar</option>
                      <option value="h">H</option>
                      <option value="m">M</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Elo inicial</span>
                    <input
                      className="input"
                      name="elo"
                      type="number"
                      min="300"
                      max="1000"
                      value={form.elo}
                      onChange={onChange}
                    />
                  </label>
                </div>
              </div>
            )}

            {error ? <p className="notice error">{error}</p> : null}

            <button className="button" type="submit" disabled={loading || loadingInfo || Boolean(infoError)}>
              {loading ? 'Enviando...' : 'Unirme al grupo'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
