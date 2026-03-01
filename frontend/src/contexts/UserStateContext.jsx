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
// Função para traduzir nomes dos produtos para português
const getProductNameInPortuguese = (productType) => {
  switch (productType) {
    case 'meal':
      return 'marmitas';
    case 'clothing':
      return 'roupas';
    case 'medicine':
      return 'medicamentos';
    case 'water':
      return 'água';
    case 'food':
      return 'alimentos';
    default:
      return productType || 'itens';
  }
};

export const UserStateProvider = ({ children }) => {
  console.log('🚀 DEBUG UserStateContext: Iniciando UserStateProvider');
  
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
        console.log('📋 UserStateContext: IDs das deliveries:', activeDeliveries.map(d => d.id));
        
        activeDeliveries.forEach(delivery => {
          console.log('🔍 DEBUG UserStateContext - Delivery:', {
            id: delivery.id,
            category: delivery.category,
            category_id: delivery.category_id,
            product_type: delivery.product_type,
            quantity: delivery.quantity,
            location: delivery.location?.name
          });
          
          // Mapear categoria para nome do produto (mais flexível)
          const categoryToProductMap = {
            'agua': 'Água',
            'alimentos': 'Alimentos', 
            'refeicoes_prontas': 'Refeições',
            'higiene': 'Higiene',
            'roupas': 'Roupas',
            'medicamentos': 'Medicamentos',
            'Água': 'Água',
            'Alimentos': 'Alimentos',
            'Refeições Prontas': 'Refeições',
            'Higiene': 'Higiene', 
            'Roupas': 'Roupas',
            'Medicamentos': 'Medicamentos'
          };
          
          // Mapear categoria para unidade
          const categoryToUnitMap = {
            'agua': 'litros',
            'alimentos': 'kg',
            'refeicoes_prontas': 'porções',
            'higiene': 'unidades',
            'roupas': 'peças',
            'medicamentos': 'unidades',
            'Água': 'litros',
            'Alimentos': 'kg',
            'Refeições Prontas': 'porções',
            'Higiene': 'unidades',
            'Roupas': 'peças',
            'Medicamentos': 'unidades'
          };
          
          // Tentar diferentes formas de obter o nome da categoria
          const categoryName = delivery.category?.display_name || 
                              delivery.category?.name || 
                              delivery.category_name || 
                              '';
          
          // Debug completo da categoria
          console.log('🔍 DEBUG UserStateContext - Categoria completa:', {
            category: delivery.category,
            display_name: delivery.category?.display_name,
            name: delivery.category?.name,
            category_name: delivery.category_name,
            category_id: delivery.category_id
          });
          
          // Fallback melhor: usar display_name da categoria se existir
          let productName = delivery.category?.display_name || 
                          categoryToProductMap[categoryName] || 
                          delivery.category?.name || 
                          'Item'; // Mudar fallback para "Item" em vez de "Produto"
          
          // Se ainda for "Item", tentar usar o category_id como fallback
          if (productName === 'Item') {
            // Fallback 1: Usar category_id se existir
            if (delivery.category_id) {
              const categoryIdMap = {
                1: 'Água',
                2: 'Alimentos', 
                3: 'Refeições',
                4: 'Higiene',
                5: 'Roupas',
                6: 'Medicamentos'
              };
              productName = categoryIdMap[delivery.category_id] || 'Item';
            }
            // Fallback 2: Usar product_type legado se existir
            else if (delivery.product_type) {
              const productTypeMap = {
                'water': 'Água',
                'food': 'Alimentos',
                'ready_meals': 'Refeições',
                'hygiene': 'Higiene',
                'clothing': 'Roupas',
                'medicine': 'Medicamentos'
              };
              productName = productTypeMap[delivery.product_type] || 'Item';
            }
          }
          
          const unit = categoryToUnitMap[categoryName] || 'unidades';
          
          console.log('🎯 DEBUG UserStateContext - Mapeamento:', {
            categoryName,
            productName,
            unit,
            description: `${delivery.quantity} ${unit} de ${productName} para ${delivery.location?.name}`
          });
          
          operations.push({
            type: 'delivery',
            id: delivery.id,
            status: delivery.status,
            title: delivery.status === 'pending_confirmation' || delivery.status === 'reserved' ? 'Entrega em Andamento' : 'Entrega em Andamento',
            description: `${delivery.quantity} ${unit} de ${productName} para ${delivery.location?.name}`,
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

      // REGRA: Permitir múltiplas operações ativas (para volunteers com múltiplas deliveries)
      // Manter todas as operações ativas para exibição no modal
      const activeOperations = operations.filter(op => 
        !['completed', 'cancelled', 'expired'].includes(op.status)
      );

      // Para compatibilidade, manter a operação principal como a mais recente
      const activeOperation = activeOperations.length > 0 
        ? activeOperations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;

      const currentState = getStateFromOperation(activeOperation);
      const stateColors = getColorsForState(currentState);

      console.log('🎯 UserStateContext: Estado final:', { 
        operationsCount: operations.length, 
        activeOperationsCount: activeOperations.length,
        activeOperation: activeOperation ? { id: activeOperation.id, type: activeOperation.type, status: activeOperation.status } : null,
        currentState 
      });
      
      console.log('📋 UserStateContext: Todas as operações:', operations.map(op => ({
        id: op.id,
        type: op.type,
        status: op.status,
        description: op.description
      })));

      setUserState({
        currentState,
        activeOperation,
        activeOperations, // Nova: todas as operações ativas
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
    
    // Operações ativas
    activeOperations: userState.activeOperations || [],
    
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
