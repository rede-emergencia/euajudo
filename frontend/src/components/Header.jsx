import { useState, useEffect } from 'react';
import { Package, Menu, X, User, LogOut, LayoutDashboard, Home, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { batches, resourceRequests } from '../lib/api';

export default function Header({ showFilters = false, onFilterChange, currentFilter, onLoginClick = () => {}, onRegisterClick = () => {} }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getDashboardRoute = () => {
    if (user?.roles?.includes('provider')) return '/dashboard/fornecedor';
    if (user?.roles?.includes('shelter')) return '/dashboard/abrigo';
    if (user?.roles?.includes('volunteer')) return '/dashboard/voluntario';
    if (user?.roles?.includes('admin')) return '/dashboard/admin';
    return null;
  };

  // Estado para contadores de notificações
  const [notificationCount, setNotificationCount] = useState(0);

  // Carregar contadores baseado na role do usuário
  useEffect(() => {
    if (!user) return;

    const loadCounts = async () => {
      try {
        let count = 0;

        if (user.roles?.includes('provider')) {
          // Providers: ver lotes prontos
          const batchesResp = await batches.getMy();
          const readyBatches = batchesResp.data?.filter(b => b.status === 'ready') || [];
          count = readyBatches.length;
        } else if (user.roles?.includes('shelter')) {
          // Shelters: ver pedidos solicitando
          const requestsResp = await resourceRequests.getMy();
          const requesting = requestsResp.data?.filter(r => r.status === 'requesting') || [];
          count = requesting.length;
        } else if (user.roles?.includes('volunteer')) {
          // Volunteers: ver entregas pendentes
          count = 0; // TODO: implementar para voluntários
        }

        setNotificationCount(count);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    };

    loadCounts();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e5e7eb'
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
              <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Conectando quem ajuda com quem precisa</p>
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
                <button
                  onClick={() => navigate('/')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Home style={{ width: '16px', height: '16px' }} />
                  Mapa
                </button>

                {getDashboardRoute() && (
                  <button
                    onClick={() => navigate(getDashboardRoute())}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: '#374151',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LayoutDashboard style={{ width: '16px', height: '16px' }} />
                    Dashboard
                  </button>
                )}

                {/* Notification Bell */}
                {notificationCount > 0 && (
                  <button
                    onClick={() => navigate(getDashboardRoute() || '/')}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#fef3c7',
                      color: '#d97706',
                      cursor: 'pointer',
                      fontWeight: '500',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fde68a'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#fef3c7'}
                    title={`${notificationCount} ${user?.roles?.includes('provider') ? 'oferta(s) ativa(s)' : 'pedido(s) ativo(s)'}`}
                  >
                    <Bell style={{ width: '18px', height: '18px' }} />
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
                      {notificationCount}
                    </span>
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
                  onClick={onLoginClick}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '14px',
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

        {/* Filters Row */}
        {showFilters && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => onFilterChange('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: currentFilter === 'all' ? '2px solid #2563eb' : '1px solid #d1d5db',
                backgroundColor: currentFilter === 'all' ? '#2563eb' : 'white',
                color: currentFilter === 'all' ? 'white' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              🌐 Todos
            </button>
            <button
              onClick={() => onFilterChange('delivery')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: currentFilter === 'delivery' ? '2px solid #10b981' : '1px solid #d1d5db',
                backgroundColor: currentFilter === 'delivery' ? '#10b981' : 'white',
                color: currentFilter === 'delivery' ? 'white' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              📍 Entregas
            </button>
            <button
              onClick={() => onFilterChange('meal')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: currentFilter === 'meal' ? '2px solid #10b981' : '1px solid #d1d5db',
                backgroundColor: currentFilter === 'meal' ? '#10b981' : 'white',
                color: currentFilter === 'meal' ? 'white' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              🍽️ Marmitas
            </button>
            <button
              onClick={() => onFilterChange('hygiene')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: currentFilter === 'hygiene' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                backgroundColor: currentFilter === 'hygiene' ? '#3b82f6' : 'white',
                color: currentFilter === 'hygiene' ? 'white' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              🧼 Higiene
            </button>
            <button
              onClick={() => onFilterChange('clothing')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: currentFilter === 'clothing' ? '2px solid #8b5cf6' : '1px solid #d1d5db',
                backgroundColor: currentFilter === 'clothing' ? '#8b5cf6' : 'white',
                color: currentFilter === 'clothing' ? 'white' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              👕 Roupas
            </button>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {user ? (
              <>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{user.nome}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{user.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/'); setShowMobileMenu(false); }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '8px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Home size={18} /> Mapa
                </button>
                {getDashboardRoute() && (
                  <button
                    onClick={() => { navigate(getDashboardRoute()); setShowMobileMenu(false); }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '8px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <LayoutDashboard size={18} /> Dashboard
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <LogOut size={18} /> Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '8px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={onRegisterClick}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cadastrar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
