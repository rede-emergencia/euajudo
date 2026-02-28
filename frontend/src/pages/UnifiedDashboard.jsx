/**
 * Unified Dashboard Component
 * Redireciona para o mapa - dashboard não é mais necessário
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnifiedDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para o mapa (home)
    navigate('/');
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#6b7280'
    }}>
      Redirecionando para o mapa...
    </div>
  );
}
