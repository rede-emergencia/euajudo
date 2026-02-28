import { useState, useEffect } from 'react';
import { 
  Package, Menu, X, User, LogOut, LayoutDashboard, Home,
  MapPin, Store, Truck, UtensilsCrossed, Pill, Droplet, Shirt, Sparkles, Filter as FilterIcon,
  Activity, CheckCircle, Clock, Truck as TruckIcon, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { deliveries, resourceReservations } from '../lib/api';

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
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [userActions, setUserActions] = useState({
    hasActiveOperation: false,
    operations: []
  });

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

  // Carregar ações do usuário (entregas, reservas, lotes)
  useEffect(() => {
    if (!user) return;

    const loadUserActions = async () => {
      try {
        const operations = [];

        // 1. Verificar entregas ativas do voluntário
        if (user.roles?.includes('volunteer')) {
          const deliveriesResp = await deliveries.list();
          const activeDeliveries = deliveriesResp.data?.filter(d => 
            d.volunteer_id === user.id && ['reserved', 'picked_up', 'in_transit'].includes(d.status)
          ) || [];
          
          activeDeliveries.forEach(delivery => {
            operations.push({
              type: 'delivery',
              id: delivery.id,
              title: 'Entrega em Andamento',
              description: `${delivery.quantity} marmitas para ${delivery.location?.name}`,
              step: delivery.status === 'reserved' ? 1 : delivery.status === 'picked_up' ? 2 : 3,
              totalSteps: 4,
              stepLabel: delivery.status === 'reserved' ? 'Comprometido' : delivery.status === 'picked_up' ? 'Retirado' : 'Em trânsito',
              status: delivery.status,
              createdAt: delivery.created_at,
              color: '#3b82f6'
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
              title: 'Compra de Insumos',
              description: `Comprando ingredientes para ${reservation.request?.location?.name}`,
              step: reservation.status === 'reserved' ? 1 : 2,
              totalSteps: 3,
              stepLabel: reservation.status === 'reserved' ? 'Reservado' : 'Adquirido',
              status: reservation.status,
              createdAt: reservation.created_at,
              color: '#f59e0b'
            });
          });
        }

        // 3. Verificar lotes ativos do fornecedor
        if (user.roles?.includes('provider')) {
          // Nota: batches não está mais importado, então vamos pular esta parte por enquanto
        }

        const hasActiveOperation = operations.length > 0;
        setUserActions({ hasActiveOperation, operations });
        onOperationStatusChange?.(hasActiveOperation);
      } catch (error) {
        console.error('Erro ao carregar ações do usuário:', error);
      }
    };

    loadUserActions();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadUserActions, 30000);
    return () => clearInterval(interval);
  }, [user, onOperationStatusChange]);

  // Calcular cor do header baseada no tempo restante das operações
  const getHeaderColor = () => {
    if (!userActions.hasActiveOperation) {
      return {
        background: '#dcfce7',
        border: '#bbf7d0',
        shadow: 'rgba(34, 197, 94, 0.2)'
      };
    }

    // Encontrar a operação mais urgente (menos tempo restante)
    const now = new Date();
    let mostUrgentOperation = null;
    let minTimeRemaining = Infinity;

    userActions.operations.forEach(operation => {
      const createdAt = new Date(operation.createdAt);
      const timeElapsed = (now - createdAt) / (1000 * 60 * 60); // horas
      const timeLimit = 24; // 24 horas limite
      const timeRemaining = timeLimit - timeElapsed;

      if (timeRemaining < minTimeRemaining) {
        minTimeRemaining = timeRemaining;
        mostUrgentOperation = operation;
      }
    });

    if (!mostUrgentOperation) {
      return {
        background: '#fef3c7',
        border: '#fde68a',
        shadow: 'rgba(217, 119, 6, 0.2)'
      };
    }

    // Calcular cor baseada no tempo restante
    const timeRemaining = minTimeRemaining;
    
    if (timeRemaining <= 0) {
      // Tempo esgotado - vermelho
      return {
        background: '#fecaca',
        border: '#fca5a5',
        shadow: 'rgba(239, 68, 68, 0.3)'
      };
    } else if (timeRemaining <= 4) {
      // Menos de 4 horas - vermelho alaranjado
      return {
        background: '#fed7aa',
        border: '#fdba74',
        shadow: 'rgba(249, 115, 22, 0.3)'
      };
    } else if (timeRemaining <= 8) {
      // Menos de 8 horas - laranja
      return {
        background: '#fef3c7',
        border: '#fde68a',
        shadow: 'rgba(217, 119, 6, 0.2)'
      };
    } else {
      // Mais de 8 horas - amarelo
      return {
        background: '#fef9e7',
        border: '#fef3c7',
        shadow: 'rgba(217, 119, 6, 0.15)'
      };
    }
  };

  const [isFlashing, setIsFlashing] = useState(false);
  const [previousHadOperation, setPreviousHadOperation] = useState(false);

  // Efeito de piscar quando operação é concluída
  useEffect(() => {
    // Detectar quando uma operação foi concluída (de tinha operação para não tem mais)
    if (previousHadOperation && !userActions.hasActiveOperation) {
      setIsFlashing(true);
    }
    
    setPreviousHadOperation(userActions.hasActiveOperation);
  }, [userActions.hasActiveOperation, previousHadOperation]);

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
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>EuAjudo</h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                {userActions.hasActiveOperation 
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
                    background: userActions.hasActiveOperation ? '#fef3c7' : '#dcfce7',
                    color: userActions.hasActiveOperation ? '#d97706' : '#16a34a',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = userActions.hasActiveOperation ? '#fde68a' : '#bbf7d0';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = userActions.hasActiveOperation ? '#fef3c7' : '#dcfce7';
                  }}
                  title={userActions.hasActiveOperation ? 'Você tem operações em andamento' : 'Nenhuma operação ativa'}
                >
                  <Activity style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '13px' }}>Ações</span>
                  {userActions.operations.length > 0 && (
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
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {userActions.operations.length}
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
              background: userActions.hasActiveOperation ? '#fef3c7' : '#dcfce7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                    Minhas Ações
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    {userActions.hasActiveOperation 
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
              {userActions.operations.length === 0 ? (
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
                  {userActions.operations.map((operation, index) => (
                    <div key={`${operation.type}-${operation.id}`} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px',
                      background: '#f9fafb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                            {operation.title}
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            {operation.description}
                          </p>
                        </div>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: operation.color,
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
                            {operation.stepLabel}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {operation.step}/{operation.totalSteps}
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
                            width: `${(operation.step / operation.totalSteps) * 100}%`,
                            background: operation.color,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* Step Indicators */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: operation.totalSteps }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: '4px',
                              borderRadius: '2px',
                              background: i < operation.step ? operation.color : '#e5e7eb'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {userActions.operations.length > 0 && (
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
    </header>
  );
}
