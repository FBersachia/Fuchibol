import { useState } from 'react';
import { apiFetch } from '../services/api';

export function ExportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const onExport = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const query = params.toString();
      const data = await apiFetch(`/export${query ? `?${query}` : ''}`);
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fuchibol-export.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'No se pudo exportar.');
    }
  };

  return (
    <main className="page">
      <section className="panel panel--center">
        <form className="stack gap-md" onSubmit={onExport}>
          <label className="field">
            <span>Desde</span>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Hasta</span>
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          {error ? <p className="notice error">{error}</p> : null}
          <button className="button" type="submit">
            Exportar CSV
          </button>
          <p className="muted">Incluye jugadores, partidos, resultados y Elo.</p>
        </form>
      </section>
    </main>
  );
}
