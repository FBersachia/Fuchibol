import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const emptyConfig = {
  w_elo: 1,
  w_genero: 5,
  w_social: 0.5,
  gender_tolerance: 1,
  win_delta: 1,
  draw_delta: 0,
  loss_delta: -1,
  use_social_default: true,
};

export function ConfigPage() {
  const [config, setConfig] = useState(emptyConfig);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const [cfg, hist] = await Promise.all([
          apiFetch('/config'),
          apiFetch('/config/history'),
        ]);
        setConfig(cfg);
        setHistory(hist.history || []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar configuracion.');
      }
    };
    load();
  }, []);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const onSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        w_elo: Number(config.w_elo),
        w_genero: Number(config.w_genero),
        w_social: Number(config.w_social),
        gender_tolerance: Number(config.gender_tolerance),
        win_delta: Number(config.win_delta),
        draw_delta: Number(config.draw_delta),
        loss_delta: Number(config.loss_delta),
        use_social_default: Boolean(config.use_social_default),
      };
      const saved = await apiFetch('/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setConfig(saved);
      const hist = await apiFetch('/config/history');
      setHistory(hist.history || []);
    } catch (err) {
      setError(err.message || 'No se pudo guardar configuracion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <section className="panel panel--wide">
        <form className="stack gap-md" onSubmit={onSave}>
          <div className="grid grid-3">
            <label className="field">
              <span>w_elo</span>
              <input
                className="input"
                type="number"
                step="0.1"
                name="w_elo"
                value={config.w_elo}
                onChange={onChange}
              />
            </label>
            <label className="field">
              <span>w_genero</span>
              <input
                className="input"
                type="number"
                step="0.1"
                name="w_genero"
                value={config.w_genero}
                onChange={onChange}
              />
            </label>
            <label className="field">
              <span>w_social</span>
              <input
                className="input"
                type="number"
                step="0.1"
                name="w_social"
                value={config.w_social}
                onChange={onChange}
              />
            </label>
          </div>

          <div className="grid grid-3">
            <label className="field">
              <span>Tolerancia genero</span>
              <input
                className="input"
                type="number"
                name="gender_tolerance"
                value={config.gender_tolerance}
                onChange={onChange}
              />
            </label>
            <label className="field">
              <span>Ganar</span>
              <input
                className="input"
                type="number"
                name="win_delta"
                value={config.win_delta}
                onChange={onChange}
              />
            </label>
            <label className="field">
              <span>Empatar</span>
              <input
                className="input"
                type="number"
                name="draw_delta"
                value={config.draw_delta}
                onChange={onChange}
              />
            </label>
          </div>

          <label className="field">
            <span>Perder</span>
            <input
              className="input"
              type="number"
              name="loss_delta"
              value={config.loss_delta}
              onChange={onChange}
            />
          </label>

          <label className="field checkbox">
            <input
              type="checkbox"
              name="use_social_default"
              checked={config.use_social_default}
              onChange={onChange}
            />
            <span>Social por defecto</span>
          </label>

          {error ? <p className="notice error">{error}</p> : null}
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {history.length ? (
          <div className="card">
            <h2>Historial de cambios</h2>
            <ul className="list">
              {history.map((item) => (
                <li key={item.id}>
                  {item.created_at} · {Object.keys(item.changes || {}).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}
