import { useState, useEffect } from 'react';
import { Heart, User, LogOut, Home, MapPin, Activity, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserState } from '../contexts/UserStateContext';
import { useNavigate } from 'react-router-dom';

export default function HeaderModern({ onLoginClick, onRegisterClick }) {
  const { user } = useAuth();
  const { userState, activeOperations, refreshState } = useUserState();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getDashboardRoute = () => {
    if (user?.roles?.includes('admin')) return '/dashboard/admin';
    if (user?.roles?.includes('provider')) return '/dashboard/fornecedor';
    if (user?.roles?.includes('shelter')) return '/dashboard/abrigo';
    if (user?.roles?.includes('volunteer')) return '/dashboard/voluntario';
    return '/dashboard';
  };

  // Determinar status e cor baseado nas operações ativas
  const getStatusInfo = () => {
    if (activeOperations.length === 0) {
      return {
        text: 'Pronto para Ajudar',
        gradient: 'var(--gradient-success)',
        borderClass: 'status-border-success'
      };
    }
    
    const hasUrgent = activeOperations.some(op => op.priority === 'urgent');
    const hasPending = activeOperations.some(op => op.status?.includes('pending'));
    
    if (hasUrgent) {
      return {
        text: `${activeOperations.length} Ação Urgente`,
        gradient: 'var(--gradient-danger)',
        borderClass: 'status-border-danger'
      };
    }
    
    if (hasPending) {
      return {
        text: `${activeOperations.length} Aguardando`,
        gradient: 'var(--gradient-warning)',
        borderClass: 'status-border-warning'
      };
    }
    
    return {
      text: `${activeOperations.length} Em Andamento`,
      gradient: 'var(--gradient-info)',
      borderClass: 'status-border-gradient'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <header className="glass-solid" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      borderBottom: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        {/* Logo e Status */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            cursor: 'pointer',
            flex: '0 0 auto'
          }}
        >
          {/* Logo com gradiente */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            transition: 'transform var(--transition-base)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Heart className="h-5 w-5 text-white fill-current" />
          </div>

          {/* Texto do Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1 className="gradient-text" style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              Vou Ajudar
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--neutral-600)',
              fontWeight: 500,
              lineHeight: 1
            }}>
              {statusInfo.text}
            </p>
          </div>
        </div>

        {/* Navegação Desktop */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: '0 0 auto'
        }}>
          {user ? (
            <>
              {user && user.roles.includes('admin') && (
              <>
              {/* Botão Dashboard - Apenas Admin */}
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="btn-glass"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '0.875rem'
                }}
              >
                <Home className="h-4 w-4" />
                <span style={{ marginLeft: 'var(--space-2)' }}>Dashboard</span>
              </button>
              </>
            )}

              {/* Botão de Ações - Apenas Desktop */}
              {activeOperations.length > 0 && (
                <button
                  onClick={() => setShowActionsModal(true)}
                  className="btn-glass"
                  style={{
                    position: 'relative',
                    display: 'none',
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth >= 768) {
                      e.currentTarget.style.display = 'flex';
                    }
                  }}
                >
                  <Activity className="h-4 w-4" />
                  <span style={{ marginLeft: 'var(--space-2)' }}>Ações</span>
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '20px',
                    height: '20px',
                    background: 'var(--gradient-danger)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    {activeOperations.length}
                  </span>
                </button>
              )}

              {/* Menu do Usuário */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-glass"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--gradient-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700
                  }}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={{
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {user.name || 'Usuário'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 999
                      }}
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="glass-solid" style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '220px',
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden',
                      zIndex: 1000,
                      boxShadow: 'var(--shadow-2xl)'
                    }}>
                      {/* User Info */}
                      <div style={{
                        padding: 'var(--space-4)',
                        borderBottom: '1px solid var(--glass-border)'
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--neutral-900)'
                        }}>
                          {user.name}
                        </p>
                        <p style={{
                          margin: '4px 0 0 0',
                          fontSize: '0.75rem',
                          color: 'var(--neutral-600)'
                        }}>
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          navigate(getDashboardRoute());
                          setShowUserMenu(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3) var(--space-4)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'var(--neutral-700)',
                          transition: 'all var(--transition-fast)',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--glass-white)';
                          e.currentTarget.style.color = 'var(--neutral-900)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--neutral-700)';
                        }}
                      >
                        <Home className="h-4 w-4" />
                        Dashboard
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3) var(--space-4)',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'var(--status-danger)',
                          transition: 'all var(--transition-fast)',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={onRegisterClick}
                className="btn-glass"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '0.875rem'
                }}
              >
                Cadastrar
              </button>
              <button
                onClick={onLoginClick}
                className="btn-gradient"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: '0.875rem'
                }}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ações */}
      {showActionsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 'var(--space-4)'
        }}>
          <div className="card-glass" style={{
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--glass-border)'
            }}>
              <div>
                <h2 className="gradient-text" style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 700
                }}>
                  Minhas Ações
                </h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  {activeOperations.length} operação(ões) ativa(s)
                </p>
              </div>
              <button
                onClick={() => setShowActionsModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'var(--glass-white)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-white)'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Operações */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)'
            }}>
              {activeOperations.map((operation, index) => (
                <div key={index} className="card-glass" style={{
                  padding: 'var(--space-4)',
                  borderLeft: `4px solid ${operation.color || 'var(--brand-primary)'}`
                }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--neutral-900)'
                  }}>
                    {operation.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)',
                    lineHeight: 1.5
                  }}>
                    {operation.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .actions-desktop-button {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
