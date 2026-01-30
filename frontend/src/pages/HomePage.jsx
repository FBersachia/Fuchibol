import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../services/auth';

const GROUP_KEY = 'fuchibol_group_id';

const sections = [
  {
    key: 'groups',
    title: 'Grupos',
    description: 'Selecciona tu grupo activo o crea uno nuevo para comenzar a trabajar.',
    action: { label: 'Ir a Grupos', to: '/groups' },
    adminOnly: false,
  },
  {
    key: 'players',
    title: 'Jugadores',
    description: 'Administra la lista de jugadores, roles y datos de cada uno.',
    action: { label: 'Ir a Jugadores', to: '/players', needsGroup: true },
    adminOnly: false,
  },
  {
    key: 'generate',
    title: 'Generar equipos',
    description: 'Configura un partido y genera equipos equilibrados con el algoritmo.',
    action: { label: 'Ir a Generar equipos', to: '/generate-teams', needsGroup: true },
    adminOnly: false,
  },
  {
    key: 'results',
    title: 'Resultados',
    description: 'Carga resultados, partidos jugados y distinciones para mantener el historial.',
    action: { label: 'Ir a Resultados', to: '/results', needsGroup: true },
    adminOnly: false,
  },
  {
    key: 'stats',
    title: 'Historial',
    description: 'Consulta estadisticas generales y por jugador para analizar el rendimiento.',
    action: { label: 'Ir a Historial', to: '/stats', needsGroup: true },
    adminOnly: false,
  },
  {
    key: 'ranking',
    title: 'Ranking',
    description: 'Revisa el ranking de jugadores segun su Elo y logros.',
    action: { label: 'Ir a Ranking', to: '/ranking', needsGroup: true },
    adminOnly: false,
  },
  {
    key: 'invites',
    title: 'Invitaciones',
    description: 'Genera links de invitacion para sumar nuevos miembros al grupo.',
    action: { label: 'Ir a Invitaciones', to: '/invites', needsGroup: true },
    adminOnly: true,
  },
  {
    key: 'config',
    title: 'Configuracion',
    description: 'Ajusta los parametros del algoritmo y la logica de calculo.',
    action: { label: 'Ir a Configuracion', to: '/config', needsGroup: true },
    adminOnly: true,
  },
  {
    key: 'courts',
    title: 'Canchas',
    description: 'Gestiona el listado de canchas disponibles para los partidos.',
    action: { label: 'Ir a Canchas', to: '/courts', needsGroup: true },
    adminOnly: true,
  },
  {
    key: 'users',
    title: 'Usuarios',
    description: 'Administra usuarios, roles y reseteo de contrasenas.',
    action: { label: 'Ir a Usuarios', to: '/users', needsGroup: true },
    adminOnly: true,
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = auth?.user?.role === 'admin';
  const groupId = localStorage.getItem(GROUP_KEY);

  const visibleSections = useMemo(
    () => sections.filter((section) => (section.adminOnly ? isAdmin : true)),
    [isAdmin]
  );

  return (
    <main className="page">
      <section className="panel panel--wide">
        <div className="stack gap-xs">
          <p className="eyebrow">Inicio</p>
          <h1>Como usar el sistema</h1>
          <p className="muted">
            Guia paso a paso para gestionar jugadores, generar equipos y registrar resultados.
          </p>
        </div>

        {!groupId ? (
          <div className="card stack gap-sm">
            <h2>Antes de empezar</h2>
            <p className="muted">
              No tenes un grupo activo seleccionado. Primero elegi o crea un grupo.
            </p>
            <button className="button" type="button" onClick={() => navigate('/groups')}>
              Ir a Grupos
            </button>
          </div>
        ) : null}

        <div className="stack gap-md">
          <div className="card stack gap-sm">
            <h2>Flujo recomendado</h2>
            <ol className="list">
              <li>Selecciona tu grupo activo o crea uno nuevo.</li>
              <li>Agrega jugadores y completa sus datos.</li>
              <li>Genera equipos para un partido y confirma la formacion.</li>
              <li>Registra el resultado y las distinciones.</li>
              <li>Consulta el historial y el ranking para analizar el rendimiento.</li>
            </ol>
          </div>

          {isAdmin ? (
            <div className="card stack gap-sm">
              <h2>Acciones de administrador</h2>
              <ol className="list">
                <li>Genera invitaciones para sumar nuevos miembros.</li>
                <li>Ajusta configuraciones del algoritmo segun la liga.</li>
                <li>Gestiona canchas y usuarios del sistema.</li>
              </ol>
            </div>
          ) : (
            <div className="card stack gap-sm">
              <h2>Acciones de usuario</h2>
              <ol className="list">
                <li>Consulta el historial y tus estadisticas personales.</li>
                <li>Revisa el ranking del grupo para seguir el rendimiento.</li>
                <li>Comunica cambios al admin si necesitara ajustar configuraciones.</li>
              </ol>
            </div>
          )}

          <div className="grid grid-2">
            {visibleSections.map((section) => (
              <article key={section.key} className="card stack gap-sm">
                <h2>{section.title}</h2>
                <p className="muted">{section.description}</p>
                <button
                  className="button"
                  type="button"
                  onClick={() => navigate(section.action.to)}
                  disabled={section.action.needsGroup && !groupId}
                >
                  {section.action.label}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
