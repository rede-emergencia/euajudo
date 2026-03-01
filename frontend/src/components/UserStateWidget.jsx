/**
 * UserStateWidget - Badge compacto de estado do usuário
 * Posicionado no topo da tela, abaixo do header
 */

import { useUserState } from '../contexts/UserStateContext';
import { useStateMonitor } from '../hooks/useStateMonitor';

const STATE_CONFIG = {
  idle: {
    label: 'Disponível',
    dot: '#16a34a',
  },
  reserved: {
    label: 'Em Movimento',
    dot: '#d97706',
  },
  picked_up: {
    label: 'Em Trânsito',
    dot: '#dc2626',
  },
  in_transit: {
    label: 'Entregando',
    dot: '#dc2626',
  },
  delivering: {
    label: 'Entregando',
    dot: '#dc2626',
  },
};

const UserStateWidget = () => {
  const { userState } = useUserState();
  const { isChanging } = useStateMonitor();

  const info = STATE_CONFIG[userState.currentState] || STATE_CONFIG.idle;

  return (
    <>
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        .state-widget-dot {
          animation: dot-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: '64px',           /* abaixo do header */
        left: '50%',
        transform: isChanging
          ? 'translateX(-50%) scale(1.04)'
          : 'translateX(-50%) scale(1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '999px',
        padding: '5px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
      }}>
        {/* Bolinha de status */}
        <span
          className="state-widget-dot"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: info.dot,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />

        {/* Label */}
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: info.dot,
          whiteSpace: 'nowrap',
          letterSpacing: '0.1px',
        }}>
          {info.label}
        </span>
      </div>
    </>
  );
};

export default UserStateWidget;
