import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { GroupsPage } from './pages/GroupsPage';
import { PlayersPage } from './pages/PlayersPage';
import { GenerateTeamsPage } from './pages/GenerateTeamsPage';
import { ResultsPage } from './pages/ResultsPage';
import { StatsPage } from './pages/StatsPage';
import { UsersPage } from './pages/UsersPage';
import { ConfigPage } from './pages/ConfigPage';
import { ExportPage } from './pages/ExportPage';
import { RankingPage } from './pages/RankingPage';
import { CourtsPage } from './pages/CourtsPage';
import { InvitesPage } from './pages/InvitesPage';
import { InviteJoinPage } from './pages/InviteJoinPage';
import { RegisterPage } from './pages/RegisterPage';
import { GroupAdminPage } from './pages/GroupAdminPage';
import { Layout } from './components/Layout';
import { getAuth } from './services/auth';

function RequireAuth({ children }) {
  const auth = getAuth();
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireGroup({ children }) {
  const groupId = localStorage.getItem('fuchibol_group_id');
  if (!groupId) {
    return <Navigate to="/groups" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invites/:slug/:token" element={<InviteJoinPage />} />
      <Route
        path="/groups"
        element={
          <RequireAuth>
            <Layout>
              <GroupsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/players"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <PlayersPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/generate-teams"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <GenerateTeamsPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/results"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <ResultsPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/stats"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <StatsPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <UsersPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/group"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <GroupAdminPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/config"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <ConfigPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/export"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <ExportPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/ranking"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <RankingPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/courts"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <CourtsPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/invites"
        element={
          <RequireAuth>
            <RequireGroup>
              <Layout>
                <InvitesPage />
              </Layout>
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/players" replace />} />
      <Route path="*" element={<Navigate to="/players" replace />} />
    </Routes>
  );
}

export default App;
