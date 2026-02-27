import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, X, User, Mail, Phone, Truck, MapPin } from 'lucide-react';

const ROLE_INFO = {
  provider: {
    label: 'Fornecedor',
    description: 'Produzo ou forneço itens para doação',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    Icon: Package,
  },
  volunteer: {
    label: 'Transporte',
    description: 'Faço o transporte e entrega de doações',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    Icon: Truck,
  },
  shelter: {
    label: 'Ponto de Recolhimento',
    description: 'Recebo e distribuo doações para quem precisa',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    Icon: MapPin,
  },
};

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, preselectedRole }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    telefone: '',
    roles: preselectedRole || 'volunteer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/login');
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
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
        maxWidth: '450px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: preselectedRole ? '16px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Package style={{ width: '32px', height: '32px', color: '#2563eb' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Criar Conta</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Junte-se ao EuAjudo</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#6b7280' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Badge de perfil fixado */}
          {preselectedRole && (() => {
            const info = ROLE_INFO[preselectedRole];
            if (!info) return null;
            const { Icon } = info;
            return (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px',
                background: info.bg,
                border: `1.5px solid ${info.border}`,
                borderRadius: '10px',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color="white" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: info.color }}>
                    {info.label}
                  </p>
                  <p style={{ margin: '1px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {info.description}
                  </p>
                </div>
              </div>
            );
          })()}
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Nome Completo
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
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
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
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
                placeholder="(XX) XXXXX-XXXX"
                required
              />
            </div>

            {!preselectedRole && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Tipo de Perfil
                </label>
                <select
                  name="roles"
                  value={formData.roles}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', backgroundColor: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                >
                  <option value="volunteer">Voluntário (ajudo com insumos e entregas)</option>
                  <option value="provider">Fornecedor (produzo marmitas)</option>
                  <option value="shelter">Abrigo (recebo marmitas)</option>
                </select>
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
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
                required
                minLength="6"
              />
            </div>

            <button
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
              {loading ? 'Criando conta...' : 'Criar Conta'}
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
              Já tem uma conta?{' '}
              <button
                onClick={() => {
                  onClose();
                  onSwitchToLogin();
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
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
