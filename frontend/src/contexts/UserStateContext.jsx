import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { deliveries, resourceReservations } from '../lib/api';

const UserStateContext = createContext(null);

/**
 * Gerenciador de Estados Centralizado
 * 
 * Controla o estado de cada usuário (fornecedor, abrigo, voluntário)
 * Garante que cada usuário só pode ter UMA ação ativa por vez
 * Sincroniza estados com backend e atualiza UI em tempo real
 */
export function UserStateProvider({ children }) {
  const { user } = useAuth();
  
  // Estado centralizado do usuário
  const [userState, setUserState] = useState({
    // Estado atual do usuário
    currentState: 'idle', // 'idle' | 'reserved' | 'picked_up' | 'in_transit' | 'delivering'
    
    // Operação ativa (apenas UMA por vez)
    activeOperation: null,
    
    // Histórico de operações
    operationHistory: [],
    
    // Cores do estado atual
    stateColors: {
      background: '#dcfce7',
      border: '#bbf7d0',
      shadow: 'rgba(34, 197, 94, 0.2)',
      text: '#16a34a'
    },
    
    // Metadados
    lastUpdate: null,
    isLoading: false,
    error: null
  });

  /**
   * Mapear status de operação para estado do usuário
   */
  const getStateFromOperation = (operation) => {
    if (!operation) return 'idle';
    
    if (operation.type === 'delivery') {
      switch (operation.status) {
        case 'pending_confirmation':
          return 'reserved'; // Aguardando confirmação
        case 'reserved':
          return 'reserved'; // Em movimento para retirada
        case 'picked_up':
          return 'picked_up'; // Em trânsito para entrega
        case 'in_transit':
          return 'in_transit'; // Em trânsito
        default:
          return 'idle';
      }
    }
    
    if (operation.type === 'reservation') {
      switch (operation.status) {
        case 'reserved':
          return 'reserved'; // Reservado para compra
        case 'acquired':
          return 'delivering'; // Adquirido, indo entregar
        default:
          return 'idle';
      }
    }
    
    return 'idle';
  };

  /**
   * Obter cores baseadas no estado
   */
  const getColorsForState = (state) => {
    switch (state) {
      case 'idle':
        return {
          background: '#dcfce7',
          border: '#bbf7d0',
          shadow: 'rgba(34, 197, 94, 0.2)',
          text: '#16a34a',
          label: 'Disponível'
        };
      
      case 'reserved':
        return {
          background: '#fef3c7',
          border: '#fde68a',
          shadow: 'rgba(217, 119, 6, 0.2)',
          text: '#d97706',
          label: 'Em Movimento'
        };
      
      case 'picked_up':
      case 'in_transit':
        return {
          background: '#dbeafe',
          border: '#93c5fd',
          shadow: 'rgba(59, 130, 246, 0.2)',
          text: '#2563eb',
          label: 'Em Trânsito'
        };
      
      case 'delivering':
        return {
          background: '#e0e7ff',
          border: '#c7d2fe',
          shadow: 'rgba(99, 102, 241, 0.2)',
          text: '#6366f1',
          label: 'Entregando'
        };
      
      default:
        return {
          background: '#dcfce7',
          border: '#bbf7d0',
          shadow: 'rgba(34, 197, 94, 0.2)',
          text: '#16a34a',
          label: 'Disponível'
        };
    }
  };

  /**
   * Carregar estado do usuário do backend
   */
  const loadUserState = async () => {
    console.log('🔄 UserStateContext: loadUserState chamado', { user: user?.email, userId: user?.id, roles: user?.roles });
    
    if (!user) {
      console.log('⚠️ UserStateContext: Sem usuário, resetando para idle');
      setUserState({
        currentState: 'idle',
        activeOperation: null,
        operationHistory: [],
        stateColors: getColorsForState('idle'),
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      });
      return;
    }

    setUserState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const operations = [];

      // 1. Verificar entregas ativas do voluntário
      console.log('🔍 UserStateContext: Verificando deliveries...', { isVolunteer: user.roles?.includes('volunteer') });
      if (user.roles?.includes('volunteer')) {
        const deliveriesResp = await deliveries.list();
        console.log('📦 UserStateContext: Deliveries recebidas:', deliveriesResp.data?.length || 0);
        console.log('📦 UserStateContext: Todas deliveries:', deliveriesResp.data?.map(d => ({ id: d.id, volunteer_id: d.volunteer_id, status: d.status })));
        
        const activeDeliveries = deliveriesResp.data?.filter(d => {
          const match = Number(d.volunteer_id) === Number(user.id);
          const validStatus = ['pending_confirmation', 'reserved', 'picked_up', 'in_transit'].includes(d.status);
          console.log(`  Delivery ${d.id}: volunteer_id=${d.volunteer_id}, match=${match}, status=${d.status}, validStatus=${validStatus}`);
          return match && validStatus;
        }) || [];
        
        console.log('✅ UserStateContext: Active deliveries encontradas:', activeDeliveries.length);
        
        activeDeliveries.forEach(delivery => {
          operations.push({
            type: 'delivery',
            id: delivery.id,
            status: delivery.status,
            title: delivery.status === 'pending_confirmation' || delivery.status === 'reserved' ? 'Retirada em Andamento' : 'Entrega em Andamento',
            description: `${delivery.quantity} ${delivery.product_type || 'itens'} para ${delivery.location?.name}`,
            createdAt: delivery.created_at,
            pickup_code: delivery.pickup_code,
            delivery_code: delivery.delivery_code,
            metadata: delivery
          });
        });
      }

      // 2. Verificar reservas de insumos
      if (user.roles?.includes('volunteer') || user.roles?.includes('volunteer_comprador')) {
        const reservationsResp = await resourceReservations.list();
        const activeReservations = reservationsResp.data?.filter(r => 
          r.user_id === user.id && ['reserved', 'acquired'].includes(r.status)
        ) || [];
        
        activeReservations.forEach(reservation => {
          operations.push({
            type: 'reservation',
            id: reservation.id,
            status: reservation.status,
            title: 'Compra de Insumos',
            description: `Comprando ingredientes para ${reservation.request?.location?.name}`,
            createdAt: reservation.created_at,
            metadata: reservation
          });
        });
      }

      // REGRA: Apenas UMA operação ativa por vez
      // Se houver múltiplas, pegar a mais recente
      const activeOperation = operations.length > 0 
        ? operations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;

      const currentState = getStateFromOperation(activeOperation);
      const stateColors = getColorsForState(currentState);

      console.log('🎯 UserStateContext: Estado final:', { 
        operationsCount: operations.length, 
        activeOperation: activeOperation ? { id: activeOperation.id, type: activeOperation.type, status: activeOperation.status } : null,
        currentState 
      });

      setUserState({
        currentState,
        activeOperation,
        operationHistory: operations,
        stateColors,
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      });

      // Disparar eventos para sincronizar com App.jsx
      window.dispatchEvent(new CustomEvent('userStateChange', {
        detail: {
          state: currentState,
          colors: stateColors,
          hasActiveOperation: activeOperation !== null,
          operation: activeOperation
        }
      }));

    } catch (error) {
      console.error('Erro ao carregar estado do usuário:', error);
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  /**
   * Atualizar estado manualmente (após ação)
   */
  const refreshState = async () => {
    await loadUserState();
  };

  /**
   * Verificar se usuário pode iniciar nova operação
   */
  const canStartNewOperation = () => {
    return userState.activeOperation === null;
  };

  /**
   * Obter informações do estado atual
   */
  const getStateInfo = () => {
    return {
      state: userState.currentState,
      colors: userState.stateColors,
      label: userState.stateColors.label,
      hasActiveOperation: userState.activeOperation !== null,
      operation: userState.activeOperation,
      canStartNew: canStartNewOperation()
    };
  };

  // Carregar estado quando usuário mudar
  useEffect(() => {
    loadUserState();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadUserState, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Ouvir eventos de atualização de estado
  useEffect(() => {
    const handleRefresh = () => {
      loadUserState();
    };

    window.addEventListener('refreshUserState', handleRefresh);
    return () => window.removeEventListener('refreshUserState', handleRefresh);
  }, [user]);

  const value = {
    // Estado atual
    userState,
    
    // Funções
    refreshState,
    canStartNewOperation,
    getStateInfo,
    
    // Helpers
    isIdle: userState.currentState === 'idle',
    isReserved: userState.currentState === 'reserved',
    isPickedUp: userState.currentState === 'picked_up',
    isInTransit: userState.currentState === 'in_transit',
    isDelivering: userState.currentState === 'delivering',
    
    // Cores atuais
    colors: userState.stateColors
  };

  return (
    <UserStateContext.Provider value={value}>
      {children}
    </UserStateContext.Provider>
  );
}

export function useUserState() {
  const context = useContext(UserStateContext);
  if (!context) {
    throw new Error('useUserState must be used within UserStateProvider');
  }
  return context;
}
