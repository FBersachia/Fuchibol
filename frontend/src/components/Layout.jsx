import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../services/auth';

export function Layout({ children }) {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';

  const onLogout = () => {
    clearAuth();
    localStorage.removeItem('fuchibol_group_id');
    navigate('/login', { replace: true });
  };

  const toggleNav = () => {
    setNavOpen((prev) => {
      const next = !prev;
      if (!next) setAdminOpen(false);
      return next;
    });
  };

  const closeNav = () => {
    setNavOpen(false);
    setAdminOpen(false);
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
        <button
          className="menu-toggle"
          type="button"
          onClick={toggleNav}
          aria-expanded={navOpen}
          aria-controls="primary-nav"
        >
          <span className="menu-icon" aria-hidden="true" />
          Menu
        </button>
        <nav className={navOpen ? 'nav is-open' : 'nav'} id="primary-nav">
          <NavLink
            to="/groups"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Grupos
          </NavLink>
          <NavLink
            to="/players"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Jugadores
          </NavLink>
          <NavLink
            to="/generate-teams"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Generar equipos
          </NavLink>
          <NavLink
            to="/results"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Resultados
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Historial
          </NavLink>
          <NavLink
            to="/ranking"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Ranking
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Mi perfil
          </NavLink>
          <NavLink
            to="/export"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            onClick={closeNav}
          >
            Exportacion
          </NavLink>
          {isAdmin ? (
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
                  <NavLink to="/admin/group" className="dropdown-item" onClick={closeNav}>
                    Grupo activo
                  </NavLink>
                  <NavLink to="/users" className="dropdown-item" onClick={closeNav}>
                    Usuarios
                  </NavLink>
                  <NavLink to="/config" className="dropdown-item" onClick={closeNav}>
                    Configuracion
                  </NavLink>
                  <NavLink to="/invites" className="dropdown-item" onClick={closeNav}>
                    Invitaciones
                  </NavLink>
                  <NavLink to="/courts" className="dropdown-item" onClick={closeNav}>
                    Canchas
                  </NavLink>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        <button className="button button--ghost" type="button" onClick={onLogout}>
          Salir
        </button>
      </header>

      <div className="content">{children}</div>
    </div>
  );
}
