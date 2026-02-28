import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { UserStateProvider } from './contexts/UserStateContext';
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
import Perfil from './pages/Perfil';
import MinhasEntregas from './pages/MinhasEntregas';

// Adicionar estilos globais para garantir que a borda seja visível
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
  }
  
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
`;

// Injetar estilos globais
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}

function App() {
  const [isInOperation, setIsInOperation] = useState(false);
  const [headerColor, setHeaderColor] = useState({
    background: '#dcfce7',  // Verde inicial (idle)
    border: '#bbf7d0'       // Verde inicial (idle)
  });

  // Calcular cor da borda baseada no estado da operação
  const getBorderColor = () => {
    // Usar uma versão um pouco mais escura da cor do header
    if (!headerColor || !headerColor.background) return '#16a34a'; // verde mais escuro
    
    // Se for verde (idle)
    if (headerColor.background.includes('dcfce7') || headerColor.background.includes('bbf7d0')) {
      return '#16a34a'; // verde mais escuro
    }
    
    // Se for amarelo/laranja (em ação)
    if (headerColor.background.includes('fef3c7') || headerColor.background.includes('fde68a') || 
        headerColor.background.includes('fef9e7') || headerColor.background.includes('fef3c7')) {
      return '#ca8a04'; // amarelo mais escuro
    }
    
    // Se for laranja (atenção)
    if (headerColor.background.includes('fed7aa')) {
      return '#ea580c'; // laranja mais escuro
    }
    
    // Se for vermelho (urgência)
    if (headerColor.background.includes('fecaca')) {
      return '#dc2626'; // vermelho mais escuro
    }
    
    // Padrão azul
    return '#1e40af';
  };

  useEffect(() => {
    // Ouvir mudanças de estado do usuário (do UserStateContext)
    const handleUserStateChange = (event) => {
      setIsInOperation(event.detail.hasActiveOperation);
      // Garantir que colors seja sempre válido
      if (event.detail.colors && event.detail.colors.background) {
        setHeaderColor(event.detail.colors);
      } else {
        // Fallback para cores padrão
        setHeaderColor({
          background: '#dcfce7',
          border: '#bbf7d0',
          shadow: 'rgba(34, 197, 94, 0.2)',
          text: '#16a34a'
        });
      }
    };

    window.addEventListener('userStateChange', handleUserStateChange);
    
    return () => {
      window.removeEventListener('userStateChange', handleUserStateChange);
    };
  }, []);

  // Calcular cor do background baseada no estado da operação
  const getBackgroundGradient = () => {
    if (!headerColor || !headerColor.background) return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)'; // verde padrão
    
    // Se for verde (idle)
    if (headerColor.background.includes('dcfce7') || headerColor.background.includes('bbf7d0')) {
      return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)'; // verde
    }
    
    // Se for amarelo/laranja (em ação)
    if (headerColor.background.includes('fef3c7') || headerColor.background.includes('fde68a') || 
        headerColor.background.includes('fef9e7') || headerColor.background.includes('fef3c7')) {
      return 'linear-gradient(135deg, #fef9e7 0%, #fef3c7 50%, #fde68a 100%)'; // amarelo
    }
    
    // Se for laranja (atenção)
    if (headerColor.background.includes('fed7aa')) {
      return 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)'; // laranja
    }
    
    // Se for vermelho (urgência)
    if (headerColor.background.includes('fecaca')) {
      return 'linear-gradient(135deg, #fecaca 0%, #fca5a5 50%, #f87171 100%)'; // vermelho
    }
    
    // Padrão azul
    return 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)';
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <UserStateProvider>
          <div style={{
            width: '100vw',
            height: '100vh',
            background: getBackgroundGradient(),
            transition: 'background 0.5s ease',
            border: `6px solid ${getBorderColor()}`,
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/home" element={<Home onOperationStatusChange={setIsInOperation} />} />
            <Route path="/mapa" element={<Navigate to="/" replace />} />
            <Route 
              path="/minhas-entregas" 
              element={
                <ProtectedRoute requireRole="volunteer">
                  <MinhasEntregas />
                </ProtectedRoute>
              } 
            />
          
          {/* Unified Dashboard - New modular architecture */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UnifiedDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Perfil - Página reutilizável para todos os usuários */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
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
          </div>
        </UserStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
