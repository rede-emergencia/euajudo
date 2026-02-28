/**
 * UserStateWidget - Widget de Estado do Usuário
 * 
 * Mostra em tempo real o estado atual do usuário com animações e timestamps
 */

import { useState, useEffect } from 'react';
import { useUserState } from '../contexts/UserStateContext';
import { useStateMonitor } from '../hooks/useStateMonitor';

const UserStateWidget = ({ position = 'bottom-right', size = 'small' }) => {
  const { userState, colors } = useUserState();
  const { stateChanges, isChanging, lastChange } = useStateMonitor();

  // Configurações de tamanho
  const sizeConfig = {
    small: {
      width: '200px',
      height: '60px',
      fontSize: '11px',
      iconSize: '16px',
      padding: '8px'
    },
    medium: {
      width: '280px',
      height: '80px',
      fontSize: '12px',
      iconSize: '20px',
      padding: '12px'
    },
    large: {
      width: '350px',
      height: '100px',
      fontSize: '14px',
      iconSize: '24px',
      padding: '16px'
    }
  };

  const config = sizeConfig[size];

  // Configurações de posição
  const positionStyles = {
    'bottom-right': {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    },
    'bottom-left': {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000
    },
    'top-right': {
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 1000
    },
    'top-left': {
      position: 'fixed',
      top: '80px',
      left: '20px',
      zIndex: 1000
    }
  };

  // O monitoramento de estado é feito pelo useStateMonitor hook

  // Obter informações do estado
  const getStateInfo = (state) => {
    const stateMap = {
      idle: {
        label: 'Disponível',
        icon: '✅',
        description: 'Pronto para ajudar',
        color: '#16a34a'
      },
      reserved: {
        label: 'Em Movimento',
        icon: '🚶',
        description: 'A caminho da retirada',
        color: '#d97706'
      },
      picked_up: {
        label: 'Em Trânsito',
        icon: '🚗',
        description: 'Carregando entrega',
        color: '#dc2626'
      },
      in_transit: {
        label: 'Entregando',
        icon: '📦',
        description: 'A caminho do destino',
        color: '#dc2626'
      },
      delivering: {
        label: 'Entregando',
        icon: '📦',
        description: 'Finalizando entrega',
        color: '#dc2626'
      }
    };
    
    return stateMap[state] || stateMap.idle;
  };

  const currentStateInfo = getStateInfo(userState.currentState);

  // Formatar timestamp
  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('pt-BR');
  };

  const widgetStyle = {
    ...positionStyles[position],
    width: config.width,
    height: config.height,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: config.padding,
    boxShadow: `0 4px 20px ${colors.shadow}`,
    transition: 'all 0.3s ease',
    transform: isChanging ? 'scale(1.05)' : 'scale(1)',
    opacity: isChanging ? '0.9' : '1'
  };

  const stateIndicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  };

  const iconStyle = {
    fontSize: config.iconSize,
    animation: isChanging ? 'pulse 1s infinite' : 'none'
  };

  const labelStyle = {
    fontSize: config.fontSize,
    fontWeight: '600',
    color: currentStateInfo.color,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const descriptionStyle = {
    fontSize: `${parseInt(config.fontSize) - 1}px`,
    color: '#6b7280',
    marginBottom: '4px'
  };

  const timestampStyle = {
    fontSize: `${parseInt(config.fontSize) - 2}px`,
    color: '#9ca3af',
    fontStyle: 'italic'
  };

  return (
    <div style={widgetStyle}>
      {/* Indicador de Estado */}
      <div style={stateIndicatorStyle}>
        <span style={iconStyle}>{currentStateInfo.icon}</span>
        <span style={labelStyle}>{currentStateInfo.label}</span>
      </div>
      
      {/* Descrição */}
      <div style={descriptionStyle}>
        {currentStateInfo.description}
        {userState.activeOperation && (
          <span style={{ marginLeft: '4px' }}>
            • {userState.activeOperation.title}
          </span>
        )}
      </div>
      
      {/* Timestamp */}
      <div style={timestampStyle}>
        {userState.lastUpdate && (
          <span>
            Atualizado {formatTimestamp(new Date(userState.lastUpdate))}
          </span>
        )}
      </div>
      
      {/* Indicador de Transição */}
      {isChanging && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '8px',
          height: '8px',
          background: currentStateInfo.color,
          borderRadius: '50%',
          animation: 'pulse 1s infinite'
        }} />
      )}
      
      {/* Histórico Recente (expandível) */}
      {stateChanges.length > 0 && size !== 'small' && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #e5e7eb',
          fontSize: `${parseInt(config.fontSize) - 2}px`
        }}>
          <div style={{ color: '#6b7280', marginBottom: '4px' }}>Mudanças recentes:</div>
          {stateChanges.slice(0, 3).map((change, index) => (
            <div key={change.id || index} style={{ 
              color: '#9ca3af', 
              lineHeight: '1.3',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>
                {getStateInfo(change.from).icon} → {getStateInfo(change.to).icon}
              </span>
              <span>{formatTimestamp(change.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UserStateWidget;
