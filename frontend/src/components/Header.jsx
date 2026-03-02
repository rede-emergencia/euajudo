import React, { useState, useEffect } from 'react';
import {
  Package, X, User, LogOut, Home,
  MapPin, Store, Truck, UtensilsCrossed, Pill, Droplet, Shirt, Sparkles, Filter as FilterIcon,
  Activity, CheckCircle, Clock, Truck as TruckIcon, ShoppingCart, LayoutDashboard, Check,
  Users, Building, HelpingHand
} from 'lucide-react';

// Helper para URL da API
const getApiUrl = (path) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  return `${API_URL}${path}`;
};
import { useAuth } from '../contexts/AuthContext';
import { useUserState } from '../contexts/UserStateContext';
import { useNavigate } from 'react-router-dom';
import { useCancel } from '../hooks/useCancel';
import { deliveries, resourceReservations } from '../lib/api';
import CodeConfirmationModal from './CodeConfirmationModal';
import { UserRole } from '../shared/enums';

// Função para obter ícone baseado na role do usuário
const getUserIcon = (roles) => {
  if (!roles || !Array.isArray(roles)) return User;
  
  if (roles.includes('admin')) return Users;
  if (roles.includes('volunteer')) return HelpingHand;
  if (roles.includes('shelter')) return Building;
  if (roles.includes('provider')) return Store;
  
  return User; // Default
};

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

export default function Header({ showFilters = false, onFilterChange, currentFilter, onLoginClick = () => { }, onRegisterClick = () => { }, onOperationStatusChange }) {
  const { user } = useAuth();
  const { userState, colors, refreshState, activeOperations } = useUserState();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Estados para modais de erro e sucesso
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: 'Erro',
    message: '',
    details: ''
  });

  const [successModal, setSuccessModal] = useState({
    show: false,
    title: 'Sucesso',
    message: ''
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
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Função para mostrar modal de erro
  const showErrorModal = (title, message, details = '') => {
    setErrorModal({
      show: true,
      title,
      message,
      details
    });
  };

  // Função para mostrar modal de sucesso
  const showSuccessModal = (title, message) => {
    setSuccessModal({
      show: true,
      title,
      message
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getDashboardRoute = () => {
    if (user?.roles?.includes(UserRole.ADMIN)) return '/dashboard/admin';
    if (user?.roles?.includes(UserRole.PROVIDER)) return '/dashboard/fornecedor';
    if (user?.roles?.includes(UserRole.SHELTER)) return '/dashboard/abrigo';
    if (user?.roles?.includes(UserRole.VOLUNTEER)) return '/dashboard/voluntario';
    return '/dashboard';
  };

  // Funções de ação para operações
  const handleConfirmPickup = async (deliveryId) => {
    // Modal de confirmação suave em vez de confirm()
    const confirmed = await showConfirmationModal('Confirmar Retirada', 'Deseja confirmar a retirada? Código: 123456');
    if (!confirmed) return;

    try {
      const response = await fetch(getApiUrl(`/api/deliveries/${deliveryId}/confirm-pickup`), {
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
      const response = await fetch(getApiUrl(`/api/deliveries/${deliveryId}/validate-delivery`), {
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
        
        // Evitar múltiplos eventos
        if (window.cancelEventFired) {
          console.log('⏸️ Evento de cancelamento já foi disparado');
          return;
        }
        
        window.cancelEventFired = true;
        
        // Forçar atualização do estado
        console.log('🔄 Header: Disparando refreshState...');
        refreshState();
        
        // Disparar evento manualmente para garantir atualização do mapa
        console.log('🔄 Header: Disparando evento userStateChange manualmente...');
        window.dispatchEvent(new CustomEvent('userStateChange', {
          detail: {
            action: 'cancelled',
            timestamp: Date.now(),
            source: 'header_cancel'
          }
        }));
        
        // Resetar flag após 2 segundos
        setTimeout(() => {
          window.cancelEventFired = false;
        }, 2000);
      },
      onError: (result) => {
        console.log('❌ Header: Cancelamento erro:', result);
        showNotification('❌ Erro ao cancelar operação: ' + result.message, 'error');
      }
    });

    console.log('📊 Header: Resultado do cancelEntity:', result);
  };

  const handleCancelClick = async (operation) => {
    // Usar modal padrão de confirmação
    const confirmed = await showConfirmationModal(
      'Cancelar Operação',
      'Tem certeza que deseja cancelar esta operação? Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;

    try {
      const result = await cancelEntity(
        operation.type,
        operation.id,
        {
          onSuccess: () => {
            // Disparar evento para atualizar UserStateContext
            window.dispatchEvent(new CustomEvent('refreshUserState', {
              detail: { forceUpdate: true }
            }));
          }
        }
      );

      if (result.success) {
        setShowActionsModal(false);
        // Evento adicional já foi disparado no onSuccess
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
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

  const headerColors = colors || {
    background: '#dcfce7',
    border: '#bbf7d0',
    shadow: 'rgba(34, 197, 94, 0.2)'
  };

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
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <Package style={{ width: '28px', height: '28px', color: '#2563eb' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Vou Ajudar</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                {activeOperations.length > 0
                  ? `⚡ ${activeOperations.length} Operação(ões)`
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

                {/* Botão Dashboard — escondido em mobile, visível no desktop (apenas não-voluntários) */}
                {!user?.roles?.includes('volunteer') && (
                  <button
                    className="dashboard-desktop-only"
                    onClick={() => navigate(getDashboardRoute())}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textDecoration: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#dbeafe';
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.borderColor = '#dbeafe';
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    title="Ir para Dashboard"
                  >
                    <LayoutDashboard style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '13px' }}>Dashboard</span>
                  </button>
                )}

                {/* Botão Ações — escondido em mobile, visível no desktop (apenas voluntários) */}
                {user?.roles?.includes('volunteer') && (
                  <button
                    className="actions-desktop-only"
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
                  {activeOperations.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#dc2626',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '2px 5px',
                      borderRadius: '10px',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1'
                    }}>
                      {activeOperations.length}
                    </span>
                  )}
                </button>
                )}

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
                      color: 'white'
                    }}>
                      {React.createElement(getUserIcon(user.roles), { size: 14 })}
                    </div>
                    <span className="user-menu-name" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        {/* Dashboard apenas para não-voluntários */}
                        {!user.roles.includes('volunteer') && (
                          <button
                            onClick={() => {
                              navigate(getDashboardRoute() || '/');
                              setShowUserMenu(false);
                            }}
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
                              color: '#374151',
                              borderRadius: '6px',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Home size={16} />
                            Dashboard
                          </button>
                        )}
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
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  data-testid="register-button"
                  onClick={onRegisterClick}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #2563eb',
                    background: 'white',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Cadastrar
                </button>
                <button
                  data-testid="login-button"
                  onClick={onLoginClick}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#1d4ed8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#2563eb';
                  }}
                >
                  Login
                </button>
              </div>
            )}
          </div>
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
                    {activeOperations.length > 0
                      ? `Você tem ${activeOperations.length} operação(ões) em andamento`
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

              {/* Ir para Dashboard — visível apenas para não-voluntários */}
              {user && !user.roles.includes('volunteer') && (
                <button
                  onClick={() => {
                    navigate(getDashboardRoute());
                    setShowActionsModal(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#1f2937'; }}
                >
                  <LayoutDashboard size={18} />
                  Ir para Dashboard
                </button>
              )}

              {activeOperations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#dcfce7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle size={32} color="#16a34a" />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    Nenhuma Operação Ativa
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
                    Você não tem nenhuma operação em andamento no momento
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeOperations.map(operation => (
                    <div key={operation.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      background: '#ffffff',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                            {operation.title}
                          </h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
                            {operation.description}
                          </p>
                        </div>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: operation.color || '#16a34a',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                      </div>

                      {/* Confirmação de Retirada - APENAS FLUXO 2 (com batch/fornecedor) */}
                      {operation.type === 'delivery' &&
                        operation.status === 'pending_confirmation' &&
                        operation.metadata?.batch_id && (
                          <div style={{
                            background: '#fef3c7',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '8px'
                          }}>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
                              📋 Confirmar Retirada no Fornecedor
                            </p>
                            <input
                              type="text"
                              placeholder="Digite o código do fornecedor"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d97706',
                                borderRadius: '6px',
                                fontSize: '14px',
                                marginBottom: '8px',
                                outline: 'none'
                              }}
                              id={`pickup-code-${operation.id}`}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={async () => {
                                  const input = document.getElementById(`pickup-code-${operation.id}`);
                                  const code = input.value.trim();
                                  if (!code) {
                                    showErrorModal('Código Obrigatório', 'Por favor, digite o código de retirada para continuar.');
                                    return;
                                  }

                                  try {
                                    const response = await fetch(getApiUrl(`/api/deliveries/${operation.id}/confirm-pickup`), {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({ pickup_code: code })
                                    });

                                    if (response.ok) {
                                      window.dispatchEvent(new CustomEvent('refreshUserState', {
                                        detail: { forceUpdate: true }
                                      }));
                                      setShowActionsModal(false);
                                      showSuccessModal('Retirada Confirmada!', 'A retirada foi confirmada com sucesso. O voluntário já pode entregar.');
                                    } else {
                                      const err = await response.json();
                                      let errorMsg = 'Erro ao confirmar retirada';
                                      
                                      if (err.detail) {
                                        if (err.detail.includes('must be PENDING_CONFIRMATION')) {
                                          errorMsg = 'Esta entrega não está pronta para retirada';
                                        } else if (err.detail.includes('Invalid pickup code')) {
                                          errorMsg = 'Código de retirada inválido';
                                        } else {
                                          errorMsg = err.detail;
                                        }
                                      }
                                      
                                      showErrorModal('Erro na Confirmação', errorMsg, 'Verifique o código e tente novamente.');
                                    }
                                  } catch (error) {
                                    console.error('Erro ao confirmar retirada:', error);
                                    showErrorModal('Erro de Conexão', 'Não foi possível conectar ao servidor. Tente novamente.');
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Deseja cancelar esta entrega?')) {
                                    return;
                                  }

                                  try {
                                    const response = await fetch(getApiUrl(`/api/deliveries/${operation.id}`), {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                        'Content-Type': 'application/json'
                                      }
                                    });

                                    if (response.ok) {
                                      window.dispatchEvent(new CustomEvent('refreshUserState', {
                                        detail: { forceUpdate: true }
                                      }));
                                      setShowActionsModal(false);
                                      alert('Entrega cancelada com sucesso');
                                    } else {
                                      const err = await response.json();
                                      console.error('Erro ao cancelar entrega:', err);
                                      let errorMsg = 'Erro ao cancelar entrega';
                                      
                                      if (err.detail) {
                                        if (err.detail.includes('Not authorized')) {
                                          errorMsg = 'Você não tem permissão para cancelar esta entrega';
                                        } else if (err.detail.includes('Cannot cancel after pickup')) {
                                          errorMsg = 'Não é possível cancelar após retirada';
                                        } else {
                                          errorMsg = err.detail;
                                        }
                                      }
                                      
                                      alert(errorMsg);
                                    }
                                  } catch (error) {
                                    console.error('Erro ao cancelar entrega:', error);
                                    alert('Erro de conexão. Tente novamente.');
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  background: '#fff',
                                  color: '#dc2626',
                                  border: '1px solid #dc2626',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancelar Entrega
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Aviso de entrega - quando em trânsito, abrigo tem o código */}
                      {(operation.status === 'picked_up' ||
                        operation.status === 'in_transit') && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: '#dbeafe',
                            borderRadius: '6px',
                            border: '1px solid #3b82f6'
                          }}>
                            <p style={{ margin: '0', fontSize: '11px', color: '#1e40af', fontWeight: '500' }}>
                              📋 Entregue no destino?
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#1e40af' }}>
                              O abrigo tem o código — peça para confirmar
                            </p>
                          </div>
                        )}

                      {/* Confirmação de Entrega - FLUXO 1 (direct, sem batch) ou FLUXO 2 (após pickup) */}
                      {operation.type === 'delivery' && 
                        ((operation.status === 'pending_confirmation' && !operation.metadata?.batch_id) || 
                         operation.status === 'picked_up') && (
                        <div style={{
                          background: '#dbeafe',
                          border: '1px solid #3b82f6',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '8px'
                        }}>
                          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                            ✅ Confirmar Entrega no Abrigo
                          </p>
                          <input
                            type="text"
                            placeholder="Digite o código do abrigo"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #3b82f6',
                              borderRadius: '6px',
                              fontSize: '14px',
                              marginBottom: '8px',
                              outline: 'none'
                            }}
                            id={`delivery-code-${operation.id}`}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={async () => {
                                const input = document.getElementById(`delivery-code-${operation.id}`);
                                const code = input.value.trim();
                                if (!code) {
                                  alert('Digite o código de entrega');
                                  return;
                                }

                                try {
                                  const response = await fetch(getApiUrl(`/api/deliveries/${operation.id}/validate-delivery`), {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ code: code })
                                  });

                                  if (response.ok) {
                                    window.dispatchEvent(new CustomEvent('refreshUserState', {
                                      detail: { forceUpdate: true }
                                    }));
                                    setShowActionsModal(false);
                                  } else {
                                    const err = await response.json();
                                    let errorMsg = 'Erro ao confirmar entrega';
                                    
                                    if (err.detail) {
                                      if (err.detail.includes('Only the volunteer can validate')) {
                                        errorMsg = 'Apenas o voluntário pode confirmar esta entrega';
                                      } else if (err.detail.includes('must be PENDING_CONFIRMATION or PICKED_UP')) {
                                        errorMsg = 'Esta entrega não está pronta para confirmação';
                                      } else if (err.detail.includes('Invalid delivery code')) {
                                        errorMsg = 'Código de entrega inválido';
                                      } else {
                                        errorMsg = err.detail;
                                      }
                                    }
                                    
                                    alert(errorMsg);
                                  }
                                } catch (error) {
                                  console.error('Erro ao confirmar entrega:', error);
                                  alert('Erro de conexão. Tente novamente.');
                                }
                              }}
                              style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #059669 0%, #16a34a 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Deseja cancelar esta entrega?')) {
                                  return;
                                }

                                try {
                                  const response = await fetch(getApiUrl(`/api/deliveries/${operation.id}`), {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });

                                  if (response.ok) {
                                    window.dispatchEvent(new CustomEvent('refreshUserState', {
                                      detail: { forceUpdate: true }
                                    }));
                                    setShowActionsModal(false);
                                    alert('Entrega cancelada com sucesso');
                                  } else {
                                    const err = await response.json();
                                    alert(err.detail || 'Erro ao cancelar entrega');
                                  }
                                } catch (error) {
                                  console.error('Erro ao cancelar entrega:', error);
                                  alert('Erro de conexão. Tente novamente.');
                                }
                              }}
                              style={{
                                flex: 1,
                                background: '#fff',
                                color: '#dc2626',
                                border: '1px solid #dc2626',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Cancelar Entrega
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {/* Ver no Dashboard — apenas para não-voluntários */}
              {user && !user.roles.includes('volunteer') && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => {
                      navigate(getDashboardRoute() || '/');
                      setShowActionsModal(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <LayoutDashboard size={18} />
                    Ver no Dashboard
                  </button>
                </div>
              )}
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
        /* Ocultar botão Ações do header em mobile */
        @media (max-width: 768px) {
          .actions-desktop-only { display: none !important; }
          .actions-mobile-fab { display: flex !important; }
          .nav-btn-text { display: none; }
          .user-menu-name { display: none; }
        }
        @media (min-width: 769px) {
          .actions-mobile-fab { display: none !important; }
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

      {/* Modal de Erro */}
      {errorModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid #fecaca'
            }}>
              <X size={32} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {errorModal.title}
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#6b7280', lineHeight: 1.5 }}>
              {errorModal.message}
            </p>
            {errorModal.details && (
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#9ca3af', lineHeight: 1.4 }}>
                {errorModal.details}
              </p>
            )}
            <button
              onClick={() => setErrorModal({ show: false, title: 'Erro', message: '', details: '' })}
              style={{
                width: '100%',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {successModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid #86efac'
            }}>
              <Check size={32} color="#22c55e" />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              {successModal.title}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#6b7280', lineHeight: 1.5 }}>
              {successModal.message}
            </p>
            <button
              onClick={() => setSuccessModal({ show: false, title: 'Sucesso', message: '' })}
              style={{
                width: '100%',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* FAB — Ações (somente mobile, apenas voluntários) */}
      {user?.roles?.includes('volunteer') && (
        <button
          className="actions-mobile-fab"
          onClick={() => setShowActionsModal(!showActionsModal)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '16px',
          transform: 'none',
          zIndex: 1100,
          alignItems: 'center',
          gap: '8px',
          padding: '14px 28px',
          borderRadius: '999px',
          border: 'none',
          background: userState.activeOperation ? '#d97706' : '#16a34a',
          color: 'white',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        <Activity size={18} />
        Ações
        {activeOperations.length > 0 && (
          <span style={{
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '13px',
            fontWeight: '800',
            marginLeft: '4px',
          }}>
            {activeOperations.length}
          </span>
        )}
      </button>
      )}

    </header>
  );
}
