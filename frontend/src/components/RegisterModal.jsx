import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { X, User, ChevronDown } from 'lucide-react';
import { formatPhone } from '../utils/phoneMask';

const ROLE_INFO = {
  volunteer: {
    label: 'Voluntário',
    description: 'Ajudo a transportar doações',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    Icon: User,
  },
};

function InputField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

function Input({ onFocus, onBlur, ...props }) {
  return (
    <input
      style={inputStyle}
      onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; onBlur?.(e); }}
      {...props}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        style={{ ...inputStyle, appearance: 'none', backgroundColor: 'white', paddingRight: '32px', cursor: 'pointer' }}
        onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
        onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
    </div>
  );
}

// ─── Base fields shared by all roles ───────────────────────────────────────
function BaseFields({ formData, onChange, setFormData }) {
  return (
    <>
      <InputField label="Nome Completo" required>
        <Input type="text" name="name" value={formData.name} onChange={onChange} required />
      </InputField>
      <InputField label="Email" required>
        <Input type="email" name="email" value={formData.email} onChange={onChange} required />
      </InputField>
      <InputField label="Telefone" required>
        <Input 
          type="tel" 
          name="phone" 
          value={formData.phone} 
          onChange={(e) => {
            console.log('Telefone onChange - valor original:', e.target.value);
            const formatted = formatPhone(e.target.value);
            console.log('Telefone formatado:', formatted);
            setFormData(prev => ({ ...prev, phone: formatted }));
          }} 
          placeholder="(00) 00000-0000" 
          maxLength="15"
          required 
        />
      </InputField>
      <InputField label="Senha" required>
        <Input type="password" name="password" value={formData.password} onChange={onChange} minLength="6" required />
      </InputField>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function RegisterModal({ isOpen, onClose }) {
  const [role, setRole] = useState('volunteer'); // Apenas voluntários
  const info = ROLE_INFO.volunteer; // Apenas info de voluntário

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roles: 'volunteer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Para campos que não são telefone, usa o onChange normal
    if (e.target.name !== 'phone') {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar campos
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    // Validar telefone - deve ter pelo menos 10 dígitos (sem formatação)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Telefone incompleto. Digite pelo menos 10 dígitos incluindo DDD.');
      setLoading(false);
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido. Digite um endereço de email válido.');
      setLoading(false);
      return;
    }

    // Validar senha - mínimo 6 caracteres
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone,
      roles: 'volunteer',
    };

    console.log('📤 Payload enviado no cadastro:', payload);

    try {
      await register(payload);
      setSuccess(true);
      
      // Fazer login automático após cadastro bem-sucedido
      try {
        console.log('🔄 Fazendo login automático após cadastro...');
        await login(formData.email, formData.password);
        console.log('✅ Login automático bem-sucedido!');
        setTimeout(() => {
          onClose();
          navigate('/'); // Redireciona para o mapa (home)
        }, 1000);
      } catch (loginError) {
        console.error('❌ Erro no login automático:', loginError);
        // Se o login falhar (ex: precisa aprovação), ainda mostra sucesso mas redireciona para login
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Erro no cadastro:', err);
      
      // Extrair mensagem de erro corretamente
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Se for um objeto com detalhes
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // Se for um array de erros de validação
            errorMessage = errorData.detail.map(item => 
              typeof item === 'string' ? item : 
              item.msg || 'Erro de validação'
            ).join('; ');
          } else if (typeof errorData.detail === 'object') {
            errorMessage = 'Erro de validação. Verifique os campos preenchidos.';
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { Icon } = info;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px', maxHeight: '92vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 0', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>Criar conta</h2>
            <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
              <X size={14} />
            </button>
          </div>

          {/* Role badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', background: info.bg, border: `1.5px solid ${info.border}`, borderRadius: '10px', marginBottom: '16px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: info.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} color="white" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: info.color }}>{info.label}</p>
              <p style={{ margin: '1px 0 0', fontSize: '12px', color: '#6b7280' }}>{info.description}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '0 20px 20px' }}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              color: '#dc2626', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              marginBottom: '14px', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <strong>Erro no cadastro:</strong><br />
                {error}
              </div>
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
              🎉 Conta criada com sucesso! Fazendo login automático...
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <BaseFields formData={formData} onChange={handleChange} setFormData={setFormData} />

            <button
              type="submit"
              disabled={loading || success}
              style={{ 
                backgroundColor: loading || success ? '#9ca3af' : info.color, 
                color: 'white', 
                padding: '12px', 
                borderRadius: '10px', 
                fontSize: '14px', 
                fontWeight: '700', 
                cursor: loading || success ? 'not-allowed' : 'pointer', 
                border: 'none', 
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px'
              }}
            >
              {loading ? (
                <>
                  <span style={{ animation: 'pulse 1s infinite' }}>⏳</span>
                  Criando conta...
                </>
              ) : success ? (
                '✅ Conta criada!'
              ) : (
                'Criar conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
