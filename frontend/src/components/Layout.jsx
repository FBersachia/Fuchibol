import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth } from '../services/auth';

export function Layout({ children }) {
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);

  const onLogout = () => {
    clearAuth();
    localStorage.removeItem('fuchibol_group_id');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <p className="brand-name">Fuchibol</p>
            <p className="brand-sub">Gestion de equipos</p>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/groups" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Grupos
          </NavLink>
          <NavLink to="/players" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Jugadores
          </NavLink>
          <NavLink
            to="/generate-teams"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            Generar equipos
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Resultados
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Historial
          </NavLink>
          <NavLink to="/ranking" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Ranking
          </NavLink>
          <NavLink to="/export" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
            Exportacion
          </NavLink>
          <div className={adminOpen ? 'dropdown is-open' : 'dropdown'}>
            <button
              className="nav-link dropdown-toggle"
              type="button"
              onClick={() => setAdminOpen((prev) => !prev)}
              aria-expanded={adminOpen}
            >
              Admin
            </button>
            {adminOpen ? (
              <div className="dropdown-menu">
                <NavLink to="/users" className="dropdown-item" onClick={() => setAdminOpen(false)}>
                  Usuarios
                </NavLink>
                <NavLink to="/config" className="dropdown-item" onClick={() => setAdminOpen(false)}>
                  Configuracion
                </NavLink>
                <NavLink to="/invites" className="dropdown-item" onClick={() => setAdminOpen(false)}>
                  Invitaciones
                </NavLink>
                <NavLink to="/courts" className="dropdown-item" onClick={() => setAdminOpen(false)}>
                  Canchas
                </NavLink>
              </div>
            ) : null}
          </div>
        </nav>
        <button className="button button--ghost" type="button" onClick={onLogout}>
          Salir
        </button>
      </header>

      <div className="content">{children}</div>
    </div>
  );
}
