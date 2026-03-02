import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          border: '3px solid #f87171'
        }}>
          <AlertCircle size={60} color="#dc2626" />
        </div>

        {/* Title */}
        <h1 style={{
          margin: '0 0 16px 0',
          fontSize: '32px',
          fontWeight: '800',
          color: '#111827',
          lineHeight: 1.2
        }}>
          Página não encontrada
        </h1>

        {/* Description */}
        <p style={{
          margin: '0 0 32px 0',
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: 1.6
        }}>
          Ops! A página que você está procurando não existe ou foi movida.<br/>
          Isso pode acontecer após atualizações do sistema.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <button
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Home size={20} />
            Ir para o Mapa
          </button>

          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              background: '#fff',
              color: '#374151',
              border: '2px solid #e5e7eb',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={20} />
            Atualizar Página
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb',
          textAlign: 'left'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '700',
            color: '#374151'
          }}>
            🔍 Possíveis causas:
          </h3>
          <ul style={{
            margin: '0',
            padding: '0 0 0 20px',
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: 1.6
          }}>
            <li>Sessão expirou após deploy do sistema</li>
            <li>Link antigo nos favoritos ou histórico</li>
            <li>Problema de conexão com a internet</li>
            <li>Cache do navegador desatualizado</li>
          </ul>
        </div>

        {/* Last Resort */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fefce8',
          borderRadius: '8px',
          border: '1px solid #fde047'
        }}>
          <p style={{
            margin: '0',
            fontSize: '13px',
            color: '#713f12'
          }}>
            <strong>Última opção:</strong> Se nada funcionar, limpe os dados do navegador e faça login novamente.
          </p>
          <button
            onClick={handleClearCache}
            style={{
              marginTop: '12px',
              width: '100%',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🗑️ Limpar Cache e Fazer Login Novamente
          </button>
        </div>
      </div>
    </div>
  );
}
