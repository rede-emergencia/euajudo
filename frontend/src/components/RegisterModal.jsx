import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, X, Truck, MapPin, ChevronDown } from 'lucide-react';

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

const ESTABLISHMENT_TYPES = [
  'Cozinha Comunitária',
  'Restaurante',
  'ONG',
  'Farmácia',
  'Bazar',
  'Outro',
];

const PRODUCT_TYPES = [
  { value: 'meal', label: 'Marmitas / Alimentos' },
  { value: 'clothing', label: 'Roupas' },
  { value: 'hygiene', label: 'Higiene Pessoal' },
  { value: 'medicine', label: 'Medicamentos' },
];

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
function BaseFields({ formData, onChange }) {
  return (
    <>
      <InputField label="Nome Completo" required>
        <Input type="text" name="name" value={formData.name} onChange={onChange} required />
      </InputField>
      <InputField label="Email" required>
        <Input type="email" name="email" value={formData.email} onChange={onChange} required />
      </InputField>
      <InputField label="Telefone" required>
        <Input type="tel" name="phone" value={formData.phone} onChange={onChange} placeholder="(XX) XXXXX-XXXX" required />
      </InputField>
      <InputField label="Senha" required>
        <Input type="password" name="password" value={formData.password} onChange={onChange} minLength="6" required />
      </InputField>
    </>
  );
}

// ─── Provider-specific fields ───────────────────────────────────────────────
function ProviderFields({ formData, onChange }) {
  return (
    <>
      <Divider label="Dados do fornecimento" />
      <InputField label="Endereço de retirada" required>
        <Input type="text" name="address" value={formData.address} onChange={onChange} placeholder="Av. Rio Branco, 100 - Centro" required />
      </InputField>
      <InputField label="Tipo de estabelecimento">
        <Select name="establishment_type" value={formData.establishment_type} onChange={onChange}>
          <option value="">Selecione...</option>
          {ESTABLISHMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </InputField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InputField label="Capacidade diária (itens)">
          <Input type="number" name="production_capacity" value={formData.production_capacity} onChange={onChange} min="1" placeholder="Ex: 100" />
        </InputField>
        <InputField label="Horário de funcionamento">
          <Input type="text" name="operating_hours" value={formData.operating_hours} onChange={onChange} placeholder="08:00-18:00" />
        </InputField>
      </div>
    </>
  );
}

// ─── Volunteer-specific fields ──────────────────────────────────────────────
function VolunteerFields({ formData, onChange }) {
  return (
    <>
      <Divider label="Capacidade de transporte" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InputField label="Itens por viagem">
          <Input type="number" name="delivery_capacity" value={formData.delivery_capacity} onChange={onChange} min="1" placeholder="Ex: 50" />
        </InputField>
        <InputField label="Horário disponível">
          <Input type="text" name="operating_hours" value={formData.operating_hours} onChange={onChange} placeholder="08:00-18:00" />
        </InputField>
      </div>
    </>
  );
}

// ─── Shelter-specific fields ────────────────────────────────────────────────
function ShelterFields({ formData, onChange, productTypes, onProductTypeChange }) {
  return (
    <>
      <Divider label="Dados do ponto de recolhimento" />
      <InputField label="Endereço de recebimento" required>
        <Input type="text" name="location_address" value={formData.location_address} onChange={onChange} placeholder="Rua das Flores, 50 - Bairro" required />
      </InputField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InputField label="Nome do responsável">
          <Input type="text" name="contact_person" value={formData.contact_person} onChange={onChange} />
        </InputField>
        <InputField label="Telefone do responsável">
          <Input type="tel" name="location_phone" value={formData.location_phone} onChange={onChange} placeholder="(XX) XXXXX-XXXX" />
        </InputField>
      </div>
      <InputField label="O que precisa receber">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
          {PRODUCT_TYPES.map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer', padding: '7px 10px', border: `1.5px solid ${productTypes.includes(value) ? '#dc2626' : '#e5e7eb'}`, borderRadius: '8px', background: productTypes.includes(value) ? '#fef2f2' : '#fff', transition: 'all 0.15s' }}>
              <input type="checkbox" value={value} checked={productTypes.includes(value)} onChange={() => onProductTypeChange(value)} style={{ accentColor: '#dc2626', width: '14px', height: '14px' }} />
              {label}
            </label>
          ))}
        </div>
      </InputField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <InputField label="Quantidade diária necessária">
          <Input type="number" name="daily_need" value={formData.daily_need} onChange={onChange} min="1" placeholder="Ex: 30" />
        </InputField>
        <InputField label="Horário de funcionamento">
          <Input type="text" name="location_operating_hours" value={formData.location_operating_hours} onChange={onChange} placeholder="08:00-18:00" />
        </InputField>
      </div>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function RegisterModal({ isOpen, onClose, preselectedRole }) {
  const role = preselectedRole || 'volunteer';
  const info = ROLE_INFO[role];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roles: role,
    // provider
    address: '',
    establishment_type: '',
    production_capacity: '',
    operating_hours: '',
    // volunteer (operating_hours shared)
    delivery_capacity: '',
    // shelter
    location_address: '',
    contact_person: '',
    location_phone: '',
    daily_need: '',
    location_operating_hours: '',
  });
  const [productTypes, setProductTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProductTypeChange = (value) => {
    setProductTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      roles: role,
    };

    if (role === 'provider') {
      payload.address = formData.address;
      payload.establishment_type = formData.establishment_type || undefined;
      payload.production_capacity = formData.production_capacity ? parseInt(formData.production_capacity) : undefined;
      payload.operating_hours = formData.operating_hours || undefined;
    }

    if (role === 'volunteer') {
      payload.delivery_capacity = formData.delivery_capacity ? parseInt(formData.delivery_capacity) : undefined;
      payload.operating_hours = formData.operating_hours || undefined;
    }

    if (role === 'shelter') {
      payload.location_address = formData.location_address;
      payload.contact_person = formData.contact_person || undefined;
      payload.location_phone = formData.location_phone || undefined;
      payload.daily_need = formData.daily_need ? parseInt(formData.daily_need) : undefined;
      payload.location_operating_hours = formData.location_operating_hours || undefined;
      payload.needed_product_types = productTypes.length > 0 ? productTypes.join(',') : undefined;
    }

    try {
      await register(payload);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar conta');
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
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: '600' }}>
              {role === 'provider'
                ? 'Conta criada! Aguarde a aprovação do administrador.'
                : 'Conta criada com sucesso! Redirecionando...'}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <BaseFields formData={formData} onChange={handleChange} />

            {role === 'provider' && <ProviderFields formData={formData} onChange={handleChange} />}
            {role === 'volunteer' && <VolunteerFields formData={formData} onChange={handleChange} />}
            {role === 'shelter' && (
              <ShelterFields
                formData={formData}
                onChange={handleChange}
                productTypes={productTypes}
                onProductTypeChange={handleProductTypeChange}
              />
            )}

            {role === 'provider' && (
              <p style={{ margin: 0, fontSize: '12px', color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px' }}>
                Contas de fornecedor passam por aprovação antes de ficarem ativas.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              style={{ backgroundColor: loading || success ? '#9ca3af' : info.color, color: 'white', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading || success ? 'not-allowed' : 'pointer', border: 'none', marginTop: '4px' }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
