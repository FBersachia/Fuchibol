import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PlayersPage } from './pages/PlayersPage';
import { GenerateTeamsPage } from './pages/GenerateTeamsPage';
import { ResultsPage } from './pages/ResultsPage';
import { StatsPage } from './pages/StatsPage';
import { UsersPage } from './pages/UsersPage';
import { ConfigPage } from './pages/ConfigPage';
import { ExportPage } from './pages/ExportPage';
import { RankingPage } from './pages/RankingPage';
import { CourtsPage } from './pages/CourtsPage';
import { Layout } from './components/Layout';
import { getAuth } from './services/auth';

function RequireAuth({ children }) {
  const auth = getAuth();
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/players"
        element={
          <RequireAuth>
            <Layout>
              <PlayersPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/generate-teams"
        element={
          <RequireAuth>
            <Layout>
              <GenerateTeamsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/results"
        element={
          <RequireAuth>
            <Layout>
              <ResultsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/stats"
        element={
          <RequireAuth>
            <Layout>
              <StatsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth>
            <Layout>
              <UsersPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/config"
        element={
          <RequireAuth>
            <Layout>
              <ConfigPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/export"
        element={
          <RequireAuth>
            <Layout>
              <ExportPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/ranking"
        element={
          <RequireAuth>
            <Layout>
              <RankingPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/courts"
        element={
          <RequireAuth>
            <Layout>
              <CourtsPage />
            </Layout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
