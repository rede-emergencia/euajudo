import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Edit2, Trash2, History, ChevronDown, ChevronUp, X, Save, BarChart3,
  ArrowUp, ArrowDown, RefreshCw, Search, Filter
} from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import { useAlert } from '../hooks/useAlert';
import AlertModal from '../components/AlertModal';
import useModal from '../hooks/useModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Componente de Card de Métrica
function MetricCard({ icon: Icon, label, value, color, bgColor, trend }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={24} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
            {label}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#111' }}>
            {value}
          </p>
        </div>
      </div>
      {trend && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          fontSize: '12px',
          color: trend > 0 ? '#10b981' : '#ef4444',
          fontWeight: '600'
        }}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}% vs ontem
        </div>
      )}
    </div>
  );
}

// Componente de Card de Item do Inventário
function InventoryItemCard({ item, onEdit, onDelete, onAdjust, onHistory, onMovement }) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusColor = () => {
    if (item.is_critical) return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
    if (item.fulfillment_rate < 50) return { bg: '#fffbeb', border: '#fde68a', text: '#f59e0b' };
    return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
  };
  
  const colors = getStatusColor();
  const progressPercent = Math.min(100, (item.current_stock + item.reserved_quantity) / item.needed_quantity * 100);
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: `2px solid ${colors.border}`
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          fontSize: '32px',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.bg,
          borderRadius: '12px'
        }}>
          {item.category_icon || '📦'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>
            {item.category_name}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Prioridade: <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{item.priority}</span>
          </p>
        </div>
        {item.is_critical && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertTriangle size={14} />
            CRÍTICO
          </div>
        )}
      </div>

      {/* Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>NECESSÁRIO</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#111' }}>
            {item.needed_quantity}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>ESTOQUE</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
            {item.current_stock}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>FALTA</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>
            {item.deficit}
          </p>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          height: '8px',
          background: '#f3f4f6',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${item.is_critical ? '#ef4444' : '#10b981'} 0%, ${item.is_critical ? '#dc2626' : '#059669'} 100%)`,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>
          {item.fulfillment_rate}% atendido
        </p>
      </div>

      {/* Em Trânsito */}
      {item.reserved_quantity > 0 && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Package size={16} color="#3b82f6" />
          <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
            {item.reserved_quantity} unidades em trânsito (entregas confirmadas)
          </span>
        </div>
      )}

      {/* Ações */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: expanded ? '16px' : 0
      }}>
        <button
          onClick={() => onAdjust(item, 'increase')}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ArrowUp size={16} /> Aumentar
        </button>
        <button
          onClick={() => onAdjust(item, 'decrease')}
          style={{
            padding: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ArrowDown size={16} /> Diminuir
        </button>
      </div>

      {/* Ações Expandidas */}
      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <button
            onClick={() => onMovement(item, 'in')}
            style={{
              padding: '8px',
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={16} />
            Entrada
          </button>
          <button
            onClick={() => onMovement(item, 'out')}
            style={{
              padding: '8px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowDown size={16} />
            Saída
          </button>
          <button
            onClick={() => onHistory(item)}
            style={{
              padding: '8px',
              background: '#f9fafb',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <History size={16} />
            Histórico
          </button>
          <button
            onClick={() => onDelete(item)}
            style={{
              padding: '8px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Trash2 size={16} />
            Remover
          </button>
        </div>
      )}

      {/* Toggle Expandir */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '8px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {expanded ? 'Menos opções' : 'Mais opções'}
      </button>
    </div>
  );
}

export default function ShelterInventoryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alert, showAlert, closeAlert } = useAlert();
  const { showConfirm, showSuccess, showError, showWarning, ModalComponent } = useModal();
  
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Estados dos modais
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState('increase');
  const [movementType, setMovementType] = useState('in');
  const [movements, setMovements] = useState([]);
  
  // Formulários
  const [newItemForm, setNewItemForm] = useState({
    category_id: '',
    needed_quantity: '',
    priority: 'medium',
    min_stock_alert: ''
  });
  
  const [adjustForm, setAdjustForm] = useState({
    new_quantity: '',
    notes: ''
  });
  
  const [movementForm, setMovementForm] = useState({
    quantity: '',
    source_type: 'donation',
    notes: ''
  });

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/shelter/inventory/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      showError('Erro ao Carregar', 'Não foi possível carregar o dashboard de inventário');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemForm.category_id || !newItemForm.needed_quantity) {
      showWarning('Campos Obrigatórios', 'Preencha categoria e quantidade necessária');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/shelter/inventory/items`, {
        category_id: parseInt(newItemForm.category_id),
        needed_quantity: parseFloat(newItemForm.needed_quantity),
        priority: newItemForm.priority,
        min_stock_alert: newItemForm.min_stock_alert ? parseFloat(newItemForm.min_stock_alert) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Item Adicionado!', 'Item adicionado ao inventário com sucesso');
      setShowAddModal(false);
      setNewItemForm({ category_id: '', needed_quantity: '', priority: 'medium', min_stock_alert: '' });
      loadData();
    } catch (error) {
      showError('Erro', error.response?.data?.detail || 'Erro ao adicionar item');
    }
  };

  const handleAdjust = async () => {
    if (!adjustForm.new_quantity) {
      showWarning('Campo Obrigatório', 'Informe a nova quantidade');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/shelter/inventory/items/${selectedItem.id}/adjust`, {
        new_quantity: parseFloat(adjustForm.new_quantity),
        notes: adjustForm.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Quantidade Ajustada!', 'Necessidade atualizada com sucesso');
      setShowAdjustModal(false);
      setAdjustForm({ new_quantity: '', notes: '' });
      loadData();
    } catch (error) {
      showError('Erro', error.response?.data?.detail || 'Erro ao ajustar quantidade');
    }
  };

  const handleMovement = async () => {
    if (!movementForm.quantity) {
      showWarning('Campo Obrigatório', 'Informe a quantidade');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/shelter/inventory/movements`, {
        inventory_item_id: selectedItem.id,
        movement_type: movementType,
        quantity: parseFloat(movementForm.quantity),
        source_type: movementForm.source_type,
        notes: movementForm.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess(
        movementType === 'in' ? 'Entrada Registrada!' : 'Saída Registrada!',
        'Movimentação registrada com sucesso'
      );
      setShowMovementModal(false);
      setMovementForm({ quantity: '', source_type: 'donation', notes: '' });
      loadData();
    } catch (error) {
      showError('Erro', error.response?.data?.detail || 'Erro ao registrar movimentação');
    }
  };

  const handleDelete = (item) => {
    if (item.reserved_quantity > 0) {
      showError(
        'Não é Possível Remover',
        `Há ${item.reserved_quantity} unidades em trânsito. Aguarde as entregas ou cancele-as primeiro.`
      );
      return;
    }

    if (item.current_stock > 0) {
      showConfirm(
        'Confirmar Remoção',
        `Há ${item.current_stock} unidades em estoque. Deseja realmente remover este item?`,
        async () => {
          try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/shelter/inventory/items/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Item Removido!', 'Item removido do inventário');
            loadData();
          } catch (error) {
            showError('Erro', error.response?.data?.detail || 'Erro ao remover item');
          }
        }
      );
    } else {
      showConfirm(
        'Confirmar Remoção',
        'Deseja realmente remover este item do inventário?',
        async () => {
          try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/shelter/inventory/items/${item.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Item Removido!', 'Item removido do inventário');
            loadData();
          } catch (error) {
            showError('Erro', error.response?.data?.detail || 'Erro ao remover item');
          }
        }
      );
    }
  };

  const handleHistory = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/shelter/inventory/items/${item.id}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovements(response.data);
      setSelectedItem(item);
      setShowHistoryModal(true);
    } catch (error) {
      showError('Erro', 'Erro ao carregar histórico');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}>
          <RefreshCw size={32} className="animate-spin" color="#3b82f6" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        minHeight: '100vh',
        background: '#f9fafb',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#111' }}>
              📊 Controle de Estoque
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Gerencie suas necessidades e estoque em tempo real
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              position: 'relative',
              zIndex: 1001
            }}
          >
            <Plus size={18} /> Adicionar Item
          </button>
        </div>

        {/* Métricas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            icon={Package}
            label="Itens Ativos"
            value={dashboard?.metrics?.total_items || 0}
            color="#3b82f6"
            bgColor="#eff6ff"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Itens Críticos"
            value={dashboard?.metrics?.critical_items || 0}
            color="#ef4444"
            bgColor="#fef2f2"
          />
          <MetricCard
            icon={Package}
            label="Em Trânsito"
            value={dashboard?.metrics?.items_in_transit || 0}
            color="#f59e0b"
            bgColor="#fffbeb"
          />
          <MetricCard
            icon={CheckCircle}
            label="Recebidos Hoje"
            value={dashboard?.metrics?.received_today || 0}
            color="#10b981"
            bgColor="#f0fdf4"
          />
        </div>

        {/* Lista de Itens */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '16px'
        }}>
          {dashboard?.items?.map(item => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onEdit={(item) => {
                setSelectedItem(item);
                setShowAdjustModal(true);
              }}
              onDelete={handleDelete}
              onAdjust={(item, type) => {
                setSelectedItem(item);
                setAdjustType(type);
                setAdjustForm({
                  new_quantity: type === 'increase' ? item.needed_quantity + 10 : Math.max(0, item.needed_quantity - 10),
                  notes: ''
                });
                setShowAdjustModal(true);
              }}
              onHistory={handleHistory}
              onMovement={(item, type) => {
                setSelectedItem(item);
                setMovementType(type);
                setMovementForm({ quantity: '', source_type: type === 'in' ? 'donation' : 'distribution', notes: '' });
                setShowMovementModal(true);
              }}
            />
          ))}
        </div>

        {dashboard?.items?.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed #e5e7eb'
          }}>
            <Package size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111' }}>
              Nenhum item no inventário
            </h3>
            <p style={{ margin: '8px 0 24px', fontSize: '14px', color: '#6b7280' }}>
              Adicione itens para começar a controlar seu estoque
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} /> Adicionar Primeiro Item
            </button>
          </div>
        )}
      </div>

      {/* Modal Adicionar Item */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Adicionar Item ao Inventário
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Categoria *
                </label>
                <select
                  value={newItemForm.category_id}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.display_name || cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Quantidade Necessária *
                </label>
                <input
                  type="number"
                  value={newItemForm.needed_quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, needed_quantity: e.target.value })}
                  placeholder="Ex: 100"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Prioridade
                </label>
                <select
                  value={newItemForm.priority}
                  onChange={(e) => setNewItemForm({ ...newItemForm, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Alerta de Estoque Mínimo (opcional)
                </label>
                <input
                  type="number"
                  value={newItemForm.min_stock_alert}
                  onChange={(e) => setNewItemForm({ ...newItemForm, min_stock_alert: e.target.value })}
                  placeholder="Ex: 20"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} /> Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajustar Quantidade */}
      {showAdjustModal && selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdjustModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Ajustar Necessidade - {selectedItem.category_name}
              </h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  Quantidade atual necessária: <strong>{selectedItem.needed_quantity}</strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Estoque atual: <strong>{selectedItem.current_stock}</strong>
                </p>
                {selectedItem.reserved_quantity > 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
                    ⚠️ Em trânsito: {selectedItem.reserved_quantity}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Nova Quantidade Necessária *
                </label>
                <input
                  type="number"
                  value={adjustForm.new_quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, new_quantity: e.target.value })}
                  placeholder="Ex: 150"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Observações (opcional)
                </label>
                <textarea
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="Motivo do ajuste..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdjust}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {showMovementModal && selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMovementModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Registrar {movementType === 'in' ? 'Entrada' : 'Saída'} - {selectedItem.category_name}
              </h2>
              <button
                onClick={() => setShowMovementModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  Estoque atual: <strong>{selectedItem.current_stock}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Quantidade *
                </label>
                <input
                  type="number"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  placeholder="Ex: 10"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Tipo de {movementType === 'in' ? 'Entrada' : 'Saída'}
                </label>
                <select
                  value={movementForm.source_type}
                  onChange={(e) => setMovementForm({ ...movementForm, source_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  {movementType === 'in' ? (
                    <>
                      <option value="donation">Doação Recebida</option>
                      <option value="purchase">Compra</option>
                      <option value="transfer_in">Transferência Recebida</option>
                      <option value="adjustment">Ajuste Manual</option>
                    </>
                  ) : (
                    <>
                      <option value="distribution">Distribuição/Consumo</option>
                      <option value="loss">Perda/Descarte</option>
                      <option value="adjustment">Ajuste Manual</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                  Observações (opcional)
                </label>
                <textarea
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                  placeholder="Detalhes sobre a movimentação..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowMovementModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleMovement}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: movementType === 'in' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} /> Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico */}
      {showHistoryModal && selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Histórico - {selectedItem.category_name}
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {movements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                  <History size={48} style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma movimentação registrada</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {movements.map(mov => (
                    <div
                      key={mov.id}
                      style={{
                        background: '#f9fafb',
                        borderRadius: '8px',
                        padding: '16px',
                        border: `2px solid ${mov.movement_type === 'in' ? '#bbf7d0' : '#fecaca'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: mov.movement_type === 'in' ? '#16a34a' : '#dc2626'
                        }}>
                          {mov.movement_type === 'in' ? '↑ ENTRADA' : '↓ SAÍDA'} - {mov.quantity} unidades
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                        <strong>Tipo:</strong> {mov.source_type}
                      </p>
                      {mov.notes && (
                        <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                          <strong>Obs:</strong> {mov.notes}
                        </p>
                      )}
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        Por: {mov.created_by_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertModal show={alert.show} onClose={closeAlert} title={alert.title} message={alert.message} type={alert.type} />
      {ModalComponent}
    </>
  );
}
