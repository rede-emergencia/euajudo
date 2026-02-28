import { useState, useEffect } from 'react';
import { 
  Package, Menu, X, User, LogOut, LayoutDashboard, Home,
  MapPin, Store, Truck, UtensilsCrossed, Pill, Droplet, Shirt, Sparkles, Filter as FilterIcon,
  Activity, CheckCircle, Clock, Truck as TruckIcon, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserState } from '../contexts/UserStateContext';
import { useNavigate } from 'react-router-dom';
import { useCancel } from '../hooks/useCancel';
import { deliveries, resourceReservations } from '../lib/api';
import CodeConfirmationModal from './CodeConfirmationModal';

// Adicionar CSS para animação
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// FilterChip Component - Reutilizável e consistente
function FilterChip({ icon: Icon, label, active, color, onClick, count }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '8px',
        padding: isMobile ? '6px 12px' : '8px 16px',
        borderRadius: '20px',
        border: active ? `2px solid ${color}` : '1px solid #e5e7eb',
        background: active ? color : 'white',
        color: active ? 'white' : '#374151',
        fontSize: isMobile ? '13px' : '14px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        boxShadow: active ? `0 2px 8px ${color}20` : '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Icon size={isMobile ? 16 : 18} />
      <span>{label}</span>
      {count !== undefined && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.3)' : '#f3f4f6',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function Header({ showFilters = false, onFilterChange, currentFilter, onLoginClick = () => {}, onRegisterClick = () => {}, onOperationStatusChange }) {
  const { user } = useAuth();
  const { userState, colors, refreshState } = useUserState();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);

  // Estado para modal padrão de confirmação por código
  const [codeModal, setCodeModal] = useState({
    show: false,
    type: 'confirm', // 'confirm' ou 'display'
    title: '',
    description: '',
    code: '',
    itemDetails: {},
    onConfirm: null
  });

  // Estados para modal de confirmação e notificações
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    resolve: null
  });
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' | 'error' | 'info'
  });

  // Função para mostrar modal de confirmação
  const showConfirmationModal = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        title,
        message,
        resolve
      });
    });
  };

  // Função para confirmar ou cancelar
  const handleConfirm = (confirmed) => {
    if (confirmModal.resolve) {
      confirmModal.resolve(confirmed);
    }
    setConfirmModal({ show: false, title: '', message: '', resolve: null });
  };

  // Função para mostrar notificação
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Esconder após 3 segundos
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getDashboardRoute = () => {
    if (user?.roles?.includes('provider')) return '/dashboard/fornecedor';
    if (user?.roles?.includes('shelter')) return '/dashboard/abrigo';
    if (user?.roles?.includes('volunteer')) return '/dashboard/voluntario';
    return '/dashboard';
  };

  // Funções de ação para operações
  const handleConfirmPickup = async (deliveryId) => {
    // Modal de confirmação suave em vez de confirm()
    const confirmed = await showConfirmationModal('Confirmar Retirada', 'Deseja confirmar a retirada? Código: 123456');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/confirm-pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pickup_code: '123456' })
      });

      if (response.ok) {
        showNotification('✅ Retirada confirmada com sucesso!', 'success');
        refreshState();
      } else {
        const error = await response.json();
        showNotification('❌ Erro ao confirmar retirada: ' + (error.detail || 'Erro desconhecido'), 'error');
      }
    } catch (error) {
      console.error('Erro ao confirmar retirada:', error);
      showNotification('❌ Erro ao confirmar retirada', 'error');
    }
  };

  // Função para confirmar entrega (quando voluntário entrega no abrigo)
  const handleConfirmDelivery = async (deliveryId) => {
    // Pedir código de entrega ao voluntário
    const deliveryCode = prompt('Digite o código de entrega fornecido pelo abrigo:');
    if (!deliveryCode) return;
    
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/validate-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: deliveryCode })  // Backend espera 'code', não 'delivery_code'
      });

      if (response.ok) {
        showNotification('✅ Entrega confirmada com sucesso!', 'success');
        refreshState();
      } else {
        const error = await response.json();
        showNotification('❌ Erro ao confirmar entrega: ' + (error.detail || 'Código inválido'), 'error');
      }
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      showNotification('❌ Erro ao confirmar entrega', 'error');
    }
  };

  // Funções para modal padrão de código
  // PRINCÍPIO: Quem DOA/ENTREGA confirma o código (type='confirm')
  //            Quem RECEBE mostra o código (type='display')
  
  const openConfirmCodeModal = (title, description, expectedCode, itemDetails, onConfirmCallback) => {
    setCodeModal({
      show: true,
      type: 'confirm',
      title,
      description,
      code: expectedCode,
      itemDetails,
      onConfirm: onConfirmCallback
    });
  };

  const openDisplayCodeModal = (title, description, code, itemDetails) => {
    setCodeModal({
      show: true,
      type: 'display',
      title,
      description,
      code,
      itemDetails,
      onConfirm: null
    });
  };

  const closeCodeModal = () => {
    setCodeModal(prev => ({ ...prev, show: false }));
  };

  const handleCodeConfirm = async (enteredCode) => {
    if (codeModal.onConfirm) {
      await codeModal.onConfirm(enteredCode);
    }
    closeCodeModal();
  };

  const { cancelEntity, loading: cancelLoading, error: cancelError } = useCancel();
  
  const handleCancelOperation = async () => {
    if (!userState.activeOperation) {
      console.log('❌ Header: Nenhuma operação ativa para cancelar');
      return;
    }
    
    console.log('🗑️ Header: Cancelando operação:', { 
      type: userState.activeOperation.type, 
      id: userState.activeOperation.id,
      description: userState.activeOperation.description 
    });
    
    const result = await cancelEntity(userState.activeOperation.type, userState.activeOperation.id, {
      showConfirm: false,
      onSuccess: (result) => {
        console.log('✅ Header: Cancelamento sucesso:', result);
        showNotification('✅ Operação cancelada com sucesso!', 'success');
        refreshState();
        // Segunda atualização após delay para garantir sincronização
        setTimeout(() => {
          console.log('🔄 Segunda atualização após cancelamento...');
          refreshState();
        }, 1500);
      },
      onError: (result) => {
        console.log('❌ Header: Cancelamento erro:', result);
        showNotification('❌ Erro ao cancelar operação: ' + result.message, 'error');
      }
    });
    
    console.log('📊 Header: Resultado do cancelEntity:', result);
  };

  const handleCancelClick = async () => {
    // Usar modal padrão de confirmação
    const confirmed = await showConfirmationModal(
      'Cancelar Operação',
      'Tem certeza que deseja cancelar esta operação? Esta ação não pode ser desfeita.'
    );
    if (confirmed) {
      handleCancelOperation();
    }
  };

  
  
  // Usar cores do UserStateContext
  const getHeaderColor = () => {
    return colors;
  };

  const [isFlashing, setIsFlashing] = useState(false);
  const [previousHadOperation, setPreviousHadOperation] = useState(false);

  // Efeito de piscar quando operação é concluída
  useEffect(() => {
    // Detectar quando uma operação foi concluída (de tinha operação para não tem mais)
    const hasActiveOperation = !!userState.activeOperation;
    if (previousHadOperation && !hasActiveOperation) {
      setIsFlashing(true);
    }
    
    setPreviousHadOperation(hasActiveOperation);
  }, [userState.activeOperation, previousHadOperation]);

  // Controlar animação de piscar
  useEffect(() => {
    if (isFlashing) {
      const flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);

      const timeout = setTimeout(() => {
        clearInterval(flashInterval);
        setIsFlashing(false);
      }, 3000);

      return () => {
        clearInterval(flashInterval);
        clearTimeout(timeout);
      };
    }
  }, [isFlashing]);

  const headerColors = getHeaderColor();

  // Efeito para sincronizar cores com as bordas do App.jsx
  useEffect(() => {
    // Disparar evento para atualizar cores das bordas
    window.dispatchEvent(new CustomEvent('headerColorChange', { 
      detail: { colors: headerColors } 
    }));
  }, [headerColors.background, headerColors.border, headerColors.shadow]);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: isFlashing ? '#bbf7d0' : headerColors.background,
      boxShadow: `0 2px 8px ${headerColors.shadow}`,
      borderBottom: `1px solid ${headerColors.border}`,
      transition: 'all 0.5s ease',
      animation: isFlashing ? 'pulse 0.5s ease-in-out' : 'none'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '12px 16px'
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <div 
            onClick={() => navigate('/mapa')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <Package style={{ width: '28px', height: '28px', color: '#2563eb' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>EuAjudo</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                {userState.activeOperation 
                  ? '⚡ Operação em Andamento' 
                  : '✅ Pronto para Ajudar'
                }
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px'
          }} className="desktop-nav">
            {user ? (
              <>
                {/* Botão Mapa */}
                <button
                  onClick={() => navigate('/mapa')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  <span>Mapa</span>
                </button>

                {/* Botão Dashboard */}
                <button
                  onClick={() => navigate(getDashboardRoute() || '/')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}
                >
                  <LayoutDashboard style={{ width: '16px', height: '16px' }} />
                  <span>Dashboard</span>
                </button>

                {/* Botão Ações */}
                <button
                  onClick={() => setShowActionsModal(!showActionsModal)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: userState.activeOperation ? '#fef3c7' : '#dcfce7',
                    color: userState.activeOperation ? '#d97706' : '#16a34a',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = userState.activeOperation ? '#fde68a' : '#bbf7d0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = userState.activeOperation ? '#fef3c7' : '#dcfce7';
                  }}
                  title={userState.activeOperation ? 'Você tem operações em andamento' : 'Nenhuma operação ativa'}
                >
                  <Activity style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '13px' }}>Ações</span>
                  {userState.activeOperation && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      1
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {user.name?.charAt(0).toUpperCase() || user.nome?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.nome || 'Usuário'}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 999
                        }}
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '200px',
                        zIndex: 1000,
                        overflow: 'hidden'
                      }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{user.nome}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{user.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#ef4444',
                            fontWeight: '500',
                            transition: 'background 0.2s',
                            textAlign: 'left'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogOut style={{ width: '16px', height: '16px' }} />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  data-testid="login-button"
                  onClick={onLoginClick}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'none',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={onRegisterClick}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cadastrar
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'none',
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Filters Row - Mobile First Design */}
        {showFilters && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid #e5e7eb',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              minWidth: 'min-content',
              paddingBottom: '4px'
            }}>
              <FilterChip 
                icon={MapPin}
                label="Todos"
                active={currentFilter === 'all'}
                color="#6366f1"
                onClick={() => onFilterChange('all')}
              />
              <FilterChip 
                icon={Home}
                label="Abrigos"
                active={currentFilter === 'shelters'}
                color="#10b981"
                onClick={() => onFilterChange('shelters')}
              />
              <FilterChip 
                icon={Store}
                label="Fornecedores"
                active={currentFilter === 'providers'}
                color="#10b981"
                onClick={() => onFilterChange('providers')}
              />
              <FilterChip 
                icon={Truck}
                label="Entregas"
                active={currentFilter === 'delivery'}
                color="#3b82f6"
                onClick={() => onFilterChange('delivery')}
              />
              <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px' }} />
              <FilterChip 
                icon={UtensilsCrossed}
                label="Marmitas"
                active={currentFilter === 'meal'}
                color="#f59e0b"
                onClick={() => onFilterChange('meal')}
              />
              <FilterChip 
                icon={Pill}
                label="Medicamentos"
                active={currentFilter === 'medicine'}
                color="#ef4444"
                onClick={() => onFilterChange('medicine')}
              />
              <FilterChip 
                icon={Droplet}
                label="Higiene"
                active={currentFilter === 'hygiene'}
                color="#3b82f6"
                onClick={() => onFilterChange('hygiene')}
              />
              <FilterChip 
                icon={Shirt}
                label="Roupas"
                active={currentFilter === 'clothing'}
                color="#8b5cf6"
                onClick={() => onFilterChange('clothing')}
              />
              <FilterChip 
                icon={Sparkles}
                label="Limpeza"
                active={currentFilter === 'cleaning'}
                color="#14b8a6"
                onClick={() => onFilterChange('cleaning')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Ações */}
      {showActionsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              background: userState.activeOperation ? '#fef3c7' : '#dcfce7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    Minhas Ações
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    {userState.activeOperation 
                      ? 'Você tem operações em andamento' 
                      : 'Nenhuma operação ativa no momento'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowActionsModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {!userState.activeOperation ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle size={32} color="#16a34a" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Tudo em dia!
                  </h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    Você não tem nenhuma operação ativa no momento.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {userState.activeOperation ? (
                    <div key={userState.activeOperation.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#f9fafb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                            {userState.activeOperation.title}
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            {userState.activeOperation.description}
                          </p>
                          
                          {/* Código de Entrega - quando em trânsito */}
                          {(userState.activeOperation.status === 'picked_up' || 
                            userState.activeOperation.status === 'in_transit') && 
                            userState.activeOperation.delivery_code && (
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: '#eff6ff', 
                              border: '1px solid #bfdbfe', 
                              borderRadius: '6px' 
                            }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#1e40af' }}>
                                📋 Código de Entrega:
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: '#1e40af',
                                fontFamily: 'monospace',
                                background: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {userState.activeOperation.delivery_code}
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                                Peça este código ao abrigo
                              </p>
                            </div>
                          )}
                        </div>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: userState.activeOperation.color,
                          flexShrink: 0
                        }} />
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {userState.activeOperation.stepLabel}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {userState.activeOperation.step}/{userState.activeOperation.totalSteps}
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(userState.activeOperation.step / userState.activeOperation.totalSteps) * 100}%`,
                            background: userState.activeOperation.color,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Step Indicators */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: userState.activeOperation.totalSteps }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              background: i < userState.activeOperation.step ? userState.activeOperation.color : '#e5e7eb'
                            }}
                          />
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        marginTop: '12px', 
                        display: 'flex', 
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {userState.activeOperation.type === 'delivery' && 
                        (userState.activeOperation.status === 'reserved' || userState.activeOperation.status === 'pending_confirmation') && (
                          <>
                            {/* Código de Retirada - Mostrado diretamente no modal */}
                            <div style={{ width: '100%', marginBottom: '8px' }}>
                              <div style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                border: '2px solid #f59e0b',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center'
                              }}>
                                <p style={{ 
                                  margin: '0 0 8px 0', 
                                  fontSize: '13px', 
                                  fontWeight: '600', 
                                  color: '#92400e',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  📋 Código de Retirada
                                </p>
                                <p style={{ 
                                  margin: '0 0 8px 0', 
                                  fontSize: '28px', 
                                  fontWeight: 'bold', 
                                  color: '#92400e',
                                  fontFamily: 'monospace',
                                  letterSpacing: '4px',
                                  background: 'white',
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  display: 'inline-block',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  {userState.activeOperation.pickup_code}
                                </p>
                                <p style={{ 
                                  margin: '8px 0 0 0', 
                                  fontSize: '12px', 
                                  color: '#a16207'
                                }}>
                                  Mostre este código ao fornecedor para retirar
                                </p>
                              </div>
                            </div>
                            
                            {/* Botão Cancelar - abre modal de confirmação padrão */}
                            <button
                              onClick={handleCancelClick}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                borderRadius: '8px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                              ❌ Cancelar Entrega
                            </button>
                          </>
                        )}
                        {userState.activeOperation.type === 'delivery' && userState.activeOperation.status === 'picked_up' && (
                          <>
                            {/* Voluntário DOA - confirma código do abrigo */}
                            <button
                              onClick={() => openConfirmCodeModal(
                                'Confirmar Entrega',
                                'Digite o código de entrega fornecido pelo abrigo:',
                                userState.activeOperation.delivery_code,
                                {
                                  'Quantidade': `${userState.activeOperation.metadata?.quantity || userState.activeOperation.quantity} itens`,
                                  'Destino': userState.activeOperation.metadata?.location?.name || 'Local não especificado',
                                  'Status': 'Em trânsito'
                                },
                                async (enteredCode) => {
                                  // Validar código e confirmar entrega
                                  try {
                                    const response = await fetch(`/api/deliveries/${userState.activeOperation.id}/validate-delivery`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({ code: enteredCode })
                                    });
                                    if (response.ok) {
                                      showNotification('✅ Entrega confirmada com sucesso!', 'success');
                                      refreshState();
                                    } else {
                                      const error = await response.json();
                                      showNotification('❌ ' + (error.detail || 'Código inválido'), 'error');
                                    }
                                  } catch (error) {
                                    showNotification('❌ Erro ao confirmar entrega', 'error');
                                  }
                                }
                              )}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#10b981',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                              >
                              ✅ Confirmar Entrega
                            </button>
                            <button
                              onClick={handleCancelClick}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                              ❌ Cancelar
                            </button>
                          </>
                        )}
                        {userState.activeOperation.type === 'reservation' && userState.activeOperation.status === 'reserved' && (
                          <>
                            <button
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#10b981',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                              onClick={() => showNotification('Vá para o dashboard para confirmar a retirada', 'info')}
                            >
                              ✅ Confirmar Retirada (no Dashboard)
                            </button>
                            <button
                              onClick={handleCancelClick}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                              ❌ Cancelar
                            </button>
                          </>
                        )}
                        {userState.activeOperation.type === 'reservation' && userState.activeOperation.status === 'acquired' && (
                          <button
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              borderRadius: '6px',
                              background: '#3b82f6',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                            onClick={() => showNotification('Vá para o dashboard para entregar os itens', 'info')}
                          >
                            📦 Entregar Itens (no Dashboard)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <p style={{ color: '#6b7280' }}>
                        Nenhuma operação ativa encontrada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              {userState.activeOperation && (
                <div style={{ 
                  marginTop: '24px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid #e5e7eb' 
                }}>
                  <button
                    onClick={() => {
                      navigate(getDashboardRoute() || '/');
                      setShowActionsModal(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#3b82f6',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Ver no Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              {confirmModal.title}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleConfirm(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Não
              </button>
              <button
                onClick={() => handleConfirm(true)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação Toast */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '16px 20px',
          borderRadius: '8px',
          background: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2002,
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* CSS para animação */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Modal Padrão de Confirmação por Código */}
      <CodeConfirmationModal
        isOpen={codeModal.show}
        onClose={closeCodeModal}
        onConfirm={handleCodeConfirm}
        type={codeModal.type}
        title={codeModal.title}
        description={codeModal.description}
        expectedCode={codeModal.code}
        itemDetails={codeModal.itemDetails}
      />
    </header>
  );
}
