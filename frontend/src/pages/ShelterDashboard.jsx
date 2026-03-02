import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Package, Clock, X, Home, Heart, Check,
  ArrowLeft, ChevronDown, ChevronUp, Shirt, Pill, UtensilsCrossed, Sparkles, Droplets, Droplet, ShoppingCart, AlertCircle, Trash2
} from 'lucide-react';
import { categories as categoriesApi } from '../lib/api';
import axios from 'axios';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import Header from '../components/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Importar enums do backend para consistência
const DeliveryStatus = {
  AVAILABLE: 'available',
  PENDING_CONFIRMATION: 'pending_confirmation', 
  RESERVED: 'reserved',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

const PRESETS = [
  { id: 'roupas', label: 'Roupas', Icon: Shirt, unit: 'peças', color: '#8b5cf6' },
  { id: 'medicamentos', label: 'Medicamentos', Icon: Pill, unit: 'unidades', color: '#ef4444' },
  { id: 'alimentos', label: 'Alimentos', Icon: UtensilsCrossed, unit: 'kg/unidades', color: '#f59e0b' },
  { id: 'agua', label: 'Água', Icon: Droplet, unit: 'litros', color: '#3b82f6' },
  { id: 'refeicoes', label: 'Refeições Prontas', Icon: ShoppingCart, unit: 'porções', color: '#ec4899' },
  { id: 'limpeza', label: 'Prod. de Limpeza', Icon: Sparkles, unit: 'unidades', color: '#14b8a6' },
  { id: 'higiene', label: 'Higiene Pessoal', Icon: Droplet, unit: 'unidades', color: '#10b981' },
];

const STATUS = {
  available: { label: 'Aguardando Voluntário', color: '#ef4444', bg: '#fee2e2', icon: '🔴' },
  pending_confirmation: { label: 'Aguardando Confirmação', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  reserved: { label: 'Reservado', color: '#3b82f6', bg: '#dbeafe', icon: '📋' },
  picked_up: { label: 'Voluntário Coletou', color: '#8b5cf6', bg: '#ede9fe', icon: '🚚' },
  delivered: { label: 'Entregue', color: '#10b981', bg: '#d1fae5', icon: '✅' },
  cancelled: { label: 'Cancelada', color: '#6b7280', bg: '#f3f4f6', icon: '❌' },
};

function Badge({ status }) {
  const s = STATUS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', icon: '📦' };
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700',
      color: s.color, background: s.bg,
      padding: '4px 12px', borderRadius: '999px',
      letterSpacing: '0.2px', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

function ItemRow({ item, onChange, onRemove, categories }) {
  const [collapsed, setCollapsed] = useState(false);
  const preset = PRESETS.find(p => p.id === item.type);
  const { Icon } = preset || { Icon: Package };

  const getCategoryAttributes = (categoryId) => {
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category?.attributes || [];
  };

  return (
    <div style={{
      background: '#fff', border: '2px solid #fecaca',
      borderRadius: '16px', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: collapsed ? '0' : '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${preset?.color || '#ef4444'} 0%, ${preset?.color || '#ec4899'}dd 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{preset?.label}</div>
            {collapsed && item.quantity && (
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '2px' }}>
                {item.quantity} {preset?.unit}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {collapsed ? <ChevronDown size={16} color="#dc2626" /> : <ChevronUp size={16} color="#dc2626" />}
          </button>
          <button
            onClick={onRemove}
            style={{
              background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={16} color="#dc2626" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
              Quantidade * <span style={{ fontWeight: '400' }}>({preset?.unit})</span>
            </label>
            <input
              type="number"
              value={item.quantity}
              onChange={e => onChange({ ...item, quantity: e.target.value })}
              placeholder="Ex: 10"
              min="1"
              style={{ ...inputStyle, background: '#fff' }}
            />
          </div>

          {/* Atributos específicos por tipo */}
          {item.type === 'roupas' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                  Tipo
                </label>
                <select
                  value={item.metadata?.tipo || ''}
                  onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  <option value="">Selecione...</option>
                  <option value="camisetas">Camisetas</option>
                  <option value="calcas">Calças</option>
                  <option value="vestidos">Vestidos</option>
                  <option value="casacos">Casacos</option>
                  <option value="calcados">Calçados</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                  Tamanho
                </label>
                <select
                  value={item.metadata?.tamanho || ''}
                  onChange={e => onChange({ ...item, metadata: { ...item.metadata, tamanho: e.target.value } })}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  <option value="">Selecione...</option>
                  <option value="pp">PP</option>
                  <option value="p">P</option>
                  <option value="m">M</option>
                  <option value="g">G</option>
                  <option value="gg">GG</option>
                  <option value="xg">XG</option>
                  <option value="variados">Variados</option>
                </select>
              </div>
            </div>
          )}

          {item.type === 'medicamentos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                  Nome do medicamento
                </label>
                <input
                  type="text"
                  value={item.metadata?.nome || ''}
                  onChange={e => onChange({ ...item, metadata: { ...item.metadata, nome: e.target.value } })}
                  placeholder="Ex: Dipirona"
                  style={{ ...inputStyle, background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                  Tipo
                </label>
                <select
                  value={item.metadata?.tipo || ''}
                  onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                  style={{ ...inputStyle, background: '#fff' }}
                >
                  <option value="">Selecione...</option>
                  <option value="analgesico">Analgésico</option>
                  <option value="antibiotico">Antibiótico</option>
                  <option value="antiinflamatorio">Anti-inflamatório</option>
                  <option value="vitamina">Vitamina</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          )}

          {item.type === 'alimentos' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                Tipo
              </label>
              <select
                value={item.metadata?.tipo || ''}
                onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="nao_perecivel">Não perecível</option>
                <option value="perecivel">Perecível</option>
                <option value="bebida">Bebida</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}

          {item.type === 'agua' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                Tipo
              </label>
              <select
                value={item.metadata?.tipo || ''}
                onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="potavel">Potável</option>
                <option value="mineral">Mineral</option>
                <option value="purificada">Purificada</option>
              </select>
            </div>
          )}

          {item.type === 'refeicoes' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                Tipo
              </label>
              <select
                value={item.metadata?.tipo || ''}
                onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="marmita">Marmita</option>
                <option value="sopa">Sopa</option>
                <option value="sanduiche">Sanduíche</option>
                <option value="fruta">Fruta</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}

          {item.type === 'limpeza' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                Tipo de produto
              </label>
              <select
                value={item.metadata?.tipo || ''}
                onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="detergente">Detergente</option>
                <option value="desinfetante">Desinfetante</option>
                <option value="sabao">Sabão</option>
                <option value="agua_sanitaria">Água Sanitária</option>
                <option value="alcool">Álcool</option>
                <option value="esponja">Esponja</option>
                <option value="pano">Pano de Limpeza</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}

          {item.type === 'higiene' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
                Tipo de produto
              </label>
              <select
                value={item.metadata?.tipo || ''}
                onChange={e => onChange({ ...item, metadata: { ...item.metadata, tipo: e.target.value } })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="sabonete">Sabonete</option>
                <option value="shampoo">Shampoo</option>
                <option value="condicionador">Condicionador</option>
                <option value="papel_higienico">Papel Higiênico</option>
                <option value="pasta_dental">Pasta Dental</option>
                <option value="escova_dental">Escova Dental</option>
                <option value="absorvente">Absorvente</option>
                <option value="fralda">Fralda</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none',
};

function btnStyle(bg, border, color, filled = false) {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 14px',
    border: filled ? 'none' : `1px solid ${border}`,
    borderRadius: '12px',
    background: bg, color,
    fontSize: '13px', fontWeight: '700',
    cursor: 'pointer',
  };
}

export default function ShelterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alert, showAlert, closeAlert } = useAlert();
  
  const [tab, setTab] = useState('ativas');
  const [allRequests, setAllRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('🔍 Carregando categorias...');
      const response = await categoriesApi.list(true);
      const activeCategories = response.data.filter(cat => cat.active);
      console.log('✅ Categorias carregadas:', activeCategories.length, activeCategories.map(c => c.name));
      setCategories(activeCategories);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const shelterRequests = response.data.filter(req => 
        [
          DeliveryStatus.AVAILABLE, 
          DeliveryStatus.PENDING_CONFIRMATION, 
          DeliveryStatus.RESERVED, 
          DeliveryStatus.PICKED_UP
        ].includes(req.status)
      );
      setAllRequests(shelterRequests);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeRequests = allRequests.filter(r => [
    DeliveryStatus.AVAILABLE, 
    DeliveryStatus.PENDING_CONFIRMATION, 
    DeliveryStatus.RESERVED, 
    DeliveryStatus.PICKED_UP
  ].includes(r.status));
  const historyRequests = allRequests.filter(r => [
    DeliveryStatus.DELIVERED, 
    DeliveryStatus.CANCELLED, 
    DeliveryStatus.EXPIRED
  ].includes(r.status));
  const urgentRequests = activeRequests.filter(r => r.status === DeliveryStatus.AVAILABLE);
  const inProgressRequests = activeRequests.filter(r => [
    DeliveryStatus.PENDING_CONFIRMATION, 
    DeliveryStatus.RESERVED, 
    DeliveryStatus.PICKED_UP
  ].includes(r.status));

  const addItem = (preset) => {
    // Mapear preset.id para nome de categoria do backend
    // Categorias do backend: agua, alimentos, refeicoes_prontas, higiene, roupas, medicamentos
    const presetToCategoryMap = {
      'roupas': 'roupas',
      'medicamentos': 'medicamentos',
      'alimentos': 'alimentos',
      'agua': 'agua',
      'refeicoes': 'refeicoes_prontas',
      'limpeza': 'higiene',  // Limpeza usa categoria higiene no backend
      'higiene': 'higiene'
    };
    
    const categoryName = presetToCategoryMap[preset.id] || preset.id;
    const matchingCategory = categories.find(cat => cat.name === categoryName);
    
    if (!matchingCategory) {
      console.error(`❌ Categoria não encontrada para preset: ${preset.id}`);
      console.log('📋 Categorias disponíveis:', categories.map(c => `${c.id}: ${c.name}`));
      showAlert('Erro', `Categoria "${preset.label}" não está configurada no sistema. Contate o administrador.`, 'error');
      return;
    }
    
    console.log(`✅ Adicionando item: ${preset.label} → categoria ${matchingCategory.name} (ID: ${matchingCategory.id})`);
    
    setItems(prev => [...prev, { 
      uid: Date.now(), 
      type: preset.id, 
      category_id: matchingCategory.id.toString(), 
      quantity: '', 
      metadata: {} 
    }]);
    setShowPresets(false);
  };
  
  const removeItem = (uid) => setItems(prev => prev.filter(i => i.uid !== uid));
  const updateItem = (uid, updated) => setItems(prev => prev.map(i => i.uid === uid ? updated : i));

  const openForm = () => {
    setItems([]);
    setShowPresets(false);
    setShowForm(true);
  };

  const validateItems = () => {
    console.log('🔍 Iniciando validação de itens:', items);
    
    if (items.length === 0) {
      console.log('❌ Validação falhou: nenhum item adicionado');
      return false;
    }
    
    for (const item of items) {
      console.log('🔍 Validando item:', item);
      
      // Validar categoria
      if (!item.category_id) {
        console.log('❌ Validação falhou: categoria não selecionada', item);
        return false;
      }
      
      // Validar quantidade - deve ser número positivo
      const quantity = parseInt(item.quantity);
      if (!item.quantity || isNaN(quantity) || quantity <= 0) {
        console.log('❌ Validação falhou: quantidade inválida', item);
        return false;
      }
      
      // Não validar atributos do backend - deixar o backend validar
      // Apenas garantir que category_id e quantity estão preenchidos
    }
    
    console.log('✅ Validação passou com sucesso!');
    return true;
  };

  const handleCreate = async () => {
    console.log('📝 Criando solicitação...');
    if (items.length === 0) {
      console.log('❌ Nenhum item adicionado');
      showAlert('Sem itens', 'Adicione pelo menos um produto.', 'warning');
      return;
    }
    
    // Verificar se todos os itens têm quantidade preenchida
    const itemsWithoutQuantity = items.filter(item => !item.quantity || parseInt(item.quantity) <= 0);
    if (itemsWithoutQuantity.length > 0) {
      console.log('❌ Itens sem quantidade:', itemsWithoutQuantity);
      showAlert('Quantidade obrigatória', 'Preencha a quantidade de todos os itens antes de criar a solicitação.', 'warning');
      return;
    }
    
    if (!validateItems()) {
      showAlert('Campos obrigatórios', 'Verifique se todos os campos estão preenchidos corretamente.', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const requests = items.map(item => ({
        category_id: parseInt(item.category_id),
        quantity: parseInt(item.quantity),
        metadata_cache: item.metadata || {}
      }));

      await Promise.all(requests.map(request => 
        axios.post(`${API_URL}/api/deliveries/direct`, request, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      showAlert('Sucesso', 'Solicitação criada!', 'success');
      setShowForm(false);
      setItems([]);
      loadData();
    } catch (error) {
      showAlert('Erro', error.response?.data?.detail || 'Erro ao criar', 'error');
    }
  };

  const handleCancel = async (id) => {
    // Modal de confirmação bonito
    const confirmed = window.confirm(`Tem certeza que deseja cancelar a solicitação #${id}?\n\nOs itens não entregues retornarão para o estoque.`);
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Modal de sucesso bonito
      showAlert('Sucesso!', `Solicitação #${id} cancelada com sucesso!\n\nOs itens retornaram para o estoque e estão disponíveis para novos voluntários.`, 'success');
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Erro ao cancelar solicitação';
      showAlert('Erro ao Cancelar', `Não foi possível cancelar a solicitação #${id}.\n\n${errorMessage}`, 'error');
    }
  };

  
  const formatMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return '';
    return Object.entries(metadata)
      .filter(([_, value]) => value && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const displayed = tab === 'ativas' ? activeRequests : historyRequests;

  // Função para renderizar status do histórico
  const renderHistoryStatus = (request) => {
    if (request.status === DeliveryStatus.DELIVERED) {
      return (
        <div style={{
          background: '#f0fdf4', borderRadius: '8px', padding: '12px',
          border: '2px solid #86efac', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={20} color="#22c55e" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#166534', fontWeight: '700' }}>
                Entrega Realizada com Sucesso
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803d' }}>
                {request.delivered_at ? new Date(request.delivered_at).toLocaleDateString('pt-BR', { 
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                }) : 'Data não disponível'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (request.status === DeliveryStatus.CANCELLED) {
      return (
        <div style={{
          background: '#fef2f2', borderRadius: '8px', padding: '12px',
          border: '2px solid #fecaca', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={20} color="#ef4444" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#991b1b', fontWeight: '700' }}>
                Solicitação Cancelada
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b91c1c' }}>
                {request.cancelled_at ? new Date(request.cancelled_at).toLocaleDateString('pt-BR', { 
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                }) : 'Data não disponível'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (request.status === DeliveryStatus.EXPIRED) {
      return (
        <div style={{
          background: '#fefce8', borderRadius: '8px', padding: '12px',
          border: '2px solid #fde047', marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#ca8a04" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#713f12', fontWeight: '700' }}>
                Solicitação Expirada
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a16207' }}>
                {request.expired_at ? new Date(request.expired_at).toLocaleDateString('pt-BR', { 
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                }) : 'Prazo encerrado sem voluntário'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      <Header />

      <div style={{
        paddingTop: '72px',
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        background: '#f9fafb',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        WebkitOverflowScrolling: 'touch' /* Melhor scroll em iOS */
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 100px' }}>

          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', padding: '0 0 16px',
              fontSize: '14px', fontWeight: '600', color: '#6b7280', cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                }}>
                  <Heart size={24} color="#fff" fill="#fff" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111' }}>
                    Painel do Abrigo
                  </h1>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Gerencie suas solicitações de doações
                  </p>
                </div>
              </div>
            </div>
            
            {urgentRequests.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)',
                border: '2px solid #fecaca',
                borderRadius: '12px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <AlertCircle size={20} color="#dc2626" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>
                    {urgentRequests.length} {urgentRequests.length === 1 ? 'solicitação aguardando' : 'solicitações aguardando'} voluntário{urgentRequests.length !== 1 && 's'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9f1239' }}>
                    Seus pedidos estão visíveis no mapa para voluntários
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={openForm}
              style={{
                width: '100%',
                marginTop: '12px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                color: '#fff',
                border: 'none', borderRadius: '12px',
                padding: '12px 16px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              <Plus size={18} /> Nova Solicitação
            </button>
          </div>

          <div style={{
            display: 'flex', gap: '8px',
            background: '#f3f4f6', borderRadius: '14px', padding: '4px',
            marginBottom: '20px',
          }}>
            {[
              { id: 'ativas', label: 'Solicitações', icon: Home, count: activeRequests.length },
              { id: 'historico', label: 'Histórico', icon: Clock, count: historyRequests.length },
            ].map(({ id, label, icon: Icon, count }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px', borderRadius: '11px', border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#111' : '#6b7280',
                    fontSize: '13px', fontWeight: active ? '700' : '500',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  {label}
                  {count > 0 && (
                    <span style={{
                      background: active ? '#111' : '#e5e7eb',
                      color: active ? '#fff' : '#374151',
                      borderRadius: '999px', padding: '1px 7px',
                      fontSize: '11px', fontWeight: '700',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                margin: '0 auto 12px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }} />
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                Carregando suas solicitações...
              </p>
            </div>
          ) : displayed.length === 0 ? (
            tab === 'ativas' ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)',
                  border: '2px solid #fecaca',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Heart size={40} color="#ef4444" />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#111' }}>
                  Nenhuma solicitação ativa
                </p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                  Crie uma solicitação de doação e aguarde<br/>
                  voluntários se comprometerem a ajudar
                </p>
                <button
                  onClick={openForm}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                    color: 'white',
                    border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <Plus size={18} /> Criar Primeira Solicitação
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  border: '2px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Clock size={40} color="#9ca3af" />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#111' }}>
                  Nenhuma solicitação no histórico
                </p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                  Suas solicitações concluídas (entregues ou canceladas)<br/>
                  aparecerão aqui para consulta
                </p>
                <button
                  onClick={() => setTab('ativas')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <Home size={18} /> Ver Solicitações Ativas
                </button>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayed.map(r => {
                const category = categories.find(cat => cat.id === r.category_id);
                const preset = PRESETS.find(p => p.id === category?.name);
                const Icon = preset?.Icon || Package;
                const iconColor = preset?.color || '#6b7280';
                
                return (
                  <div key={r.id} style={{
                    background: '#fff',
                    border: r.status === 'available' ? '2px solid #fecaca' : '1px solid #e5e7eb',
                    borderRadius: '16px', padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    boxShadow: r.status === 'available' ? '0 2px 8px rgba(239, 68, 68, 0.1)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#9ca3af' }}>
                          Solicitação #{r.id}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          }) : ''}
                        </p>
                      </div>
                      <Badge status={r.status} />
                    </div>

                    {/* Status do histórico - apenas para aba de histórico */}
                    {tab === 'historico' && renderHistoryStatus(r)}

                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: 'linear-gradient(135deg, #f9fafb 0%, #fefefe 100%)',
                      borderRadius: '12px', padding: '12px',
                      border: '1px solid #f3f4f6',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: `linear-gradient(135deg, ${iconColor} 0%, ${iconColor}dd 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={20} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
                          {r.category?.display_name || 'Item'}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>
                          <strong>{r.quantity}</strong> {preset?.unit || 'unidades'}
                          {r.metadata_cache && Object.keys(r.metadata_cache).length > 0 && (
                            <span style={{ color: '#ef4444', fontWeight: '600' }}> · {formatMetadata(r.metadata_cache)}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {r.status === 'available' && (
                      <div style={{
                        background: '#fef2f2', borderRadius: '8px', padding: '8px 12px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <AlertCircle size={16} color="#dc2626" />
                        <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                          Visível no mapa para voluntários
                        </p>
                      </div>
                    )}

                    {r.status === 'pending_confirmation' && r.pickup_code && (
                      <div style={{
                        background: '#fef3c7', borderRadius: '8px', padding: '12px',
                        border: '2px solid #fde047',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <AlertCircle size={16} color="#d97706" />
                          <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: '600' }}>
                            Voluntário comprometido - Aguardando retirada
                          </p>
                        </div>
                        <div style={{
                          background: '#fff', borderRadius: '6px', padding: '8px 12px',
                          border: '1px solid #fde047',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '10px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>
                            CÓDIGO DE RETIRADA
                          </div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#92400e',
                            letterSpacing: '2px',
                            fontFamily: 'monospace'
                          }}>
                            {r.pickup_code}
                          </div>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#92400e' }}>
                          Forneça este código ao voluntário quando ele chegar
                        </p>
                      </div>
                    )}

                    {r.status === 'reserved' && r.pickup_code && (
                      <div style={{
                        background: '#dbeafe', borderRadius: '8px', padding: '12px',
                        border: '2px solid #93c5fd',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Check size={16} color="#1e40af" />
                          <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                            Voluntário confirmado - Aguardando entrega
                          </p>
                        </div>
                        <div style={{
                          background: '#fff', borderRadius: '6px', padding: '8px 12px',
                          border: '1px solid #93c5fd',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>
                            CÓDIGO DE RETIRADA
                          </div>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1e40af',
                            letterSpacing: '2px',
                            fontFamily: 'monospace'
                          }}>
                            {r.pickup_code}
                          </div>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#1e40af' }}>
                          Voluntário já confirmou presença
                        </p>
                      </div>
                    )}

                    {r.status === 'pending_confirmation' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleCancel(r.id)} 
                          style={{
                            ...btnStyle('#fff', '#fecaca', '#dc2626'),
                            border: '1.5px solid #fecaca',
                            fontWeight: '700',
                            flex: 1,
                          }}
                        >
                          <Trash2 size={16} /> Cancelar Pedido
                        </button>
                      </div>
                    )}

                    {r.status === 'available' && (
                      <button 
                        onClick={() => handleCancel(r.id)} 
                        style={{
                          ...btnStyle('#fff', '#fecaca', '#dc2626'),
                          border: '1.5px solid #fecaca',
                          fontWeight: '700',
                        }}
                      >
                        <Trash2 size={16} /> Cancelar Solicitação
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: '24px',
            width: '100%', maxWidth: '520px',
            maxHeight: '90dvh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '2px solid #fecaca',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
              borderRadius: '22px 22px 0 0',
              padding: '24px',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart size={24} color="#fff" fill="#fff" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                      Nova Solicitação
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                      Adicione os itens que você precisa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px',
                    width: '40px', height: '40px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={20} color="#fff" />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {items.map(item => (
                    <ItemRow
                      key={item.uid}
                      item={item}
                      onChange={updated => updateItem(item.uid, updated)}
                      onRemove={() => removeItem(item.uid)}
                      categories={categories}
                    />
                  ))}
                </div>
              )}

              <div>
                <button
                  onClick={() => setShowPresets(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 16px', borderRadius: '12px',
                    border: '2px dashed #fecaca',
                    background: showPresets ? 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)' : '#fff',
                    color: '#dc2626',
                    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus size={18} />
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {items.length === 0 ? 'Adicionar produto' : 'Adicionar outro produto'}
                  </span>
                  <ChevronDown size={16} style={{ transform: showPresets ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {showPresets && (
                  <div style={{
                    marginTop: '12px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                  }}>
                    {PRESETS.map(({ id, label, Icon, unit, color }) => {
                      const alreadyAdded = items.some(i => i.type === id);
                      return (
                        <button
                          key={id}
                          onClick={() => !alreadyAdded && addItem({ id, label, Icon, unit })}
                          disabled={alreadyAdded}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            padding: '14px', borderRadius: '14px',
                            border: alreadyAdded ? '2px solid #e5e7eb' : `2px solid ${color}33`,
                            background: alreadyAdded ? '#f9fafb' : `${color}11`,
                            fontSize: '13px', fontWeight: '700',
                            cursor: alreadyAdded ? 'default' : 'pointer',
                            opacity: alreadyAdded ? 0.5 : 1,
                            position: 'relative',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: alreadyAdded ? '#e5e7eb' : `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={18} color={alreadyAdded ? '#9ca3af' : '#fff'} />
                          </div>
                          <span style={{ color: alreadyAdded ? '#9ca3af' : '#111', lineHeight: 1.3, textAlign: 'center' }}>
                            {label}
                          </span>
                          {alreadyAdded && (
                            <div style={{
                              position: 'absolute', top: '8px', right: '8px',
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: '#10b981', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: '700',
                            }}>
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex', gap: '12px',
              padding: '20px 24px',
              borderTop: '2px solid #f9fafb',
              flexShrink: 0,
            }}>
              <button 
                onClick={() => setShowForm(false)} 
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: '#fff',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <div style={{ flex: 2, position: 'relative' }}>
                <button
                  onClick={handleCreate}
                  disabled={items.length === 0 || !validateItems()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '12px',
                    background: items.length === 0 || !validateItems() 
                      ? '#e5e7eb' 
                      : 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
                    color: items.length === 0 || !validateItems() ? '#9ca3af' : '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: items.length === 0 || !validateItems() ? 'not-allowed' : 'pointer',
                    boxShadow: items.length > 0 && validateItems() ? '0 4px 12px rgba(239, 68, 68, 0.25)' : 'none',
                  }}
                >
                  <Check size={18} /> Criar Solicitação
                </button>
                
                {items.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '-24px', left: '0', right: '0',
                    textAlign: 'center',
                    fontSize: '11px', color: '#dc2626', fontWeight: '600',
                  }}>
                    Adicione pelo menos um produto
                  </div>
                )}
                
                {items.length > 0 && !validateItems() && (
                  <div style={{
                    position: 'absolute', top: '-24px', left: '0', right: '0',
                    textAlign: 'center',
                    fontSize: '11px', color: '#dc2626', fontWeight: '600',
                  }}>
                    Preencha todos os campos obrigatórios
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal show={alert.show} onClose={closeAlert} title={alert.title} message={alert.message} type={alert.type} />
    </>
  );
}
