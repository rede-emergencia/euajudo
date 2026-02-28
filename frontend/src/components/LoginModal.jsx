import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Carregar lista de usuários para seleção rápida
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('🔄 Carregando usuários do backend...');
        const response = await fetch(`${API_URL}/api/users/`);
        if (response.ok) {
          const usersData = await response.json();
          console.log('✅ Usuários carregados:', usersData.length, 'usuários');
          console.log('📋 Detalhes:', usersData);
          setUsers(usersData);
        } else {
          console.error('❌ Erro na resposta:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
      }
    };
    
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Se um usuário foi selecionado, usar o email dele
      const loginEmail = selectedUser || email;
      // Senha sempre é 123 para login rápido
      const loginPassword = '123';
      
      const userData = await login(loginEmail, loginPassword);
      
      // Redirecionar baseado no perfil
      if (userData.roles && userData.roles.includes('admin')) {
        navigate('/dashboard/admin');
      } else if (userData.roles && userData.roles.includes('provider')) {
        navigate('/dashboard/fornecedor');
      } else if (userData.roles && userData.roles.includes('shelter')) {
        // Abrigo vai para seu dashboard
        navigate('/dashboard/abrigo');
      } else if (userData.roles && userData.roles.includes('volunteer')) {
        // Voluntário continua na página principal (mapa)
        onClose();
        return;
      } else {
        navigate('/');
      }
      
      onClose(); // Fechar modal após login bem-sucedido
    } catch (err) {
      console.error('Erro de login:', err);
      setError(err.response?.data?.detail || 'Email ou senha incorretos');
      // Não fechar o modal em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userEmail) => {
    setSelectedUser(userEmail);
    setEmail(userEmail);
    setPassword('123'); // Preencher senha automaticamente
  };

  if (!isOpen) return null;

  return (
    <div 
      data-testid="login-modal"
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package style={{ width: '32px', height: '32px', color: '#2563eb' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Entrar no Vou Ajudar</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Conectando Voluntários e Pontos de Coleta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Seleção Rápida de Usuários */}
          {users.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                🚀 Login Rápido - {users.length} usuários disponíveis:
              </label>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px',
                backgroundColor: '#fafafa'
              }}>
                {users.map((user) => {
                  // Determinar ícone baseado no tipo de usuário
                  const getRoleIcon = (roles) => {
                    const roleList = Array.isArray(roles) ? roles : [roles];
                    if (roleList.includes('provider')) return '🏪';
                    if (roleList.includes('volunteer')) return '🙋';
                    if (roleList.includes('admin')) return '👤';
                    if (roleList.includes('shelter')) return '🏠';
                    return '👤';
                  };
                  
                  const getRoleColor = (roles) => {
                    const roleList = Array.isArray(roles) ? roles : [roles];
                    if (roleList.includes('provider')) return '#10b981';
                    if (roleList.includes('volunteer')) return '#3b82f6';
                    if (roleList.includes('admin')) return '#6b7280';
                    if (roleList.includes('shelter')) return '#f59e0b';
                    return '#6b7280';
                  };
                  
                  const roleIcon = getRoleIcon(user.roles);
                  const roleColor = getRoleColor(user.roles);
                  const roleText = Array.isArray(user.roles) ? user.roles.join(', ') : user.roles;
                  
                  return (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedUser === user.email ? '#eff6ff' : 'white',
                        border: selectedUser === user.email ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        marginBottom: '6px',
                        transition: 'all 0.2s',
                        boxShadow: selectedUser === user.email ? '0 2px 4px rgba(37, 99, 235, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      onClick={() => handleUserSelect(user.email)}
                      onMouseEnter={(e) => {
                        if (!selectedUser) {
                          e.target.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedUser) {
                          e.target.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="userSelect"
                        checked={selectedUser === user.email}
                        onChange={() => handleUserSelect(user.email)}
                        style={{ 
                          marginRight: '10px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ 
                        fontSize: '20px', 
                        marginRight: '10px',
                        width: '24px',
                        textAlign: 'center'
                      }}>
                        {roleIcon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '14px',
                          color: '#1f2937',
                          marginBottom: '2px'
                        }}>
                          {user.name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#6b7280',
                          marginBottom: '2px'
                        }}>
                          {user.email}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: roleColor,
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {roleText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Email {selectedUser && '(selecionado acima)'}
              </label>
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value !== selectedUser) {
                    setSelectedUser('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: selectedUser ? '#f3f4f6' : 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder={selectedUser ? 'Usuário selecionado acima' : 'Digite seu email'}
                disabled={!!selectedUser}
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Senha (padrão: 123)
              </label>
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                placeholder="123"
                required
              />
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Não tem uma conta?{' '}
              <button
                onClick={() => {
                  onClose();
                  onSwitchToRegister();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
