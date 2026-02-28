import { useEffect, useState } from 'react';
import { useUserState } from '../contexts/UserStateContext';
import { Activity, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';

export default function UserStateWidgetModern() {
  const { userState, activeOperations, colors } = useUserState();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar widget apenas se houver operações ativas
    setIsVisible(activeOperations.length > 0);
  }, [activeOperations]);

  if (!isVisible) return null;

  // Determinar status e estilo baseado nas operações
  const getStatusConfig = () => {
    if (activeOperations.length === 0) {
      return {
        gradient: 'var(--gradient-success)',
        borderClass: 'status-border-success',
        icon: CheckCircle,
        text: 'Tudo em ordem',
        subtext: 'Nenhuma ação pendente'
      };
    }

    const hasUrgent = activeOperations.some(op => op.priority === 'urgent');
    const hasPending = activeOperations.some(op => op.status?.includes('pending'));
    
    if (hasUrgent) {
      return {
        gradient: 'var(--gradient-danger)',
        borderClass: 'status-border-danger',
        icon: AlertCircle,
        text: 'Ação Urgente',
        subtext: `${activeOperations.length} operação(ões) precisam de atenção`
      };
    }
    
    if (hasPending) {
      return {
        gradient: 'var(--gradient-warning)',
        borderClass: 'status-border-warning',
        icon: Clock,
        text: 'Aguardando',
        subtext: `${activeOperations.length} operação(ões) pendente(s)`
      };
    }

    return {
      gradient: 'var(--gradient-info)',
      borderClass: 'status-border-gradient',
      icon: Activity,
      text: 'Em Andamento',
      subtext: `${activeOperations.length} operação(ões) ativa(s)`
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className={`frosted ${statusConfig.borderClass}`}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-4)',
        minWidth: '280px',
        maxWidth: '320px',
        zIndex: 900,
        transition: 'all var(--transition-base)',
        animation: 'slideInRight 0.4s var(--transition-spring)'
      }}
    >
      {/* Header com ícone e título */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-3)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-xl)',
          background: statusConfig.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <StatusIcon className="h-5 w-5 text-white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--neutral-900)'
          }}>
            {statusConfig.text}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--neutral-600)',
            lineHeight: 1.3
          }}>
            {statusConfig.subtext}
          </p>
        </div>
      </div>

      {/* Lista de operações ativas */}
      {activeOperations.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--glass-border)'
        }}>
          {activeOperations.slice(0, 3).map((operation, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                padding: 'var(--space-2)',
                background: 'var(--glass-white)',
                borderRadius: 'var(--radius-lg)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: operation.color || 'var(--brand-primary)',
                  flexShrink: 0,
                  marginTop: '4px'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.813rem',
                  fontWeight: 600,
                  color: 'var(--neutral-900)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {operation.title}
                </p>
                <p style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.688rem',
                  color: 'var(--neutral-600)',
                  lineHeight: 1.3
                }}>
                  {operation.description}
                </p>
              </div>
            </div>
          ))}
          
          {activeOperations.length > 3 && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.75rem',
              color: 'var(--neutral-500)',
              textAlign: 'center',
              fontWeight: 500
            }}>
              + {activeOperations.length - 3} mais
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .status-widget-modern {
            bottom: var(--space-4);
            right: var(--space-4);
            left: var(--space-4);
            minWidth: auto;
            maxWidth: none;
          }
        }
      `}</style>
    </div>
  );
}
