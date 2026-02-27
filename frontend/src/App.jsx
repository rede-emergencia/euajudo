import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import MapView from './pages/MapView';
import ProviderDashboard from './pages/ProviderDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import ShelterDashboard from './pages/ShelterDashboard';
import UnifiedDashboard from './pages/UnifiedDashboard';
import Admin from './pages/Admin';
import PerfilFornecedor from './pages/PerfilFornecedor';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mapa" element={<MapView />} />
          
          {/* Unified Dashboard - New modular architecture */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UnifiedDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Legacy Dashboards - Keep for backward compatibility */}
          <Route
            path="/dashboard/fornecedor"
            element={
              <ProtectedRoute requireRole="provider">
                <Layout>
                  <ProviderDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/perfil/fornecedor"
            element={
              <ProtectedRoute requireRole="provider">
                <Layout>
                  <PerfilFornecedor />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard/voluntario"
            element={
              <ProtectedRoute requireRole="volunteer">
                <Layout>
                  <VolunteerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard/abrigo"
            element={
              <ProtectedRoute requireRole="shelter">
                <ShelterDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
