import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Edit2, Trash2, History, ChevronDown, ChevronUp, X, Save, BarChart3,
  ArrowUp, ArrowDown, RefreshCw, Search, Filter, Truck, Calendar,
  Download, FileText, Clock, User
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import Header from '../components/Header';
import { useAlert } from '../hooks/useAlert';
import AlertModal from '../components/AlertModal';
import useModal from '../hooks/useModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ShelterInventoryComplete() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alert, showAlert, closeAlert } = useAlert();
  const { showConfirm, showSuccess, showError, showWarning, ModalComponent } = useModal();
  
  const [activeTab, setActiveTab] = useState('estoque');
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [dashboard, setDashboard] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState({ total: 0, movements: [] });
  const [categories, setCategories] = useState([]);
  
  // Filtros
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [historyFilters, setHistoryFilters] = useState({
    start_date: '',
    end_date: '',
    movement_type: '',
    category_id: ''
  });
  
  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
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
  
  const [movementType, setMovementType] = useState('in');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'entregas') loadDeliveries();
    if (activeTab === 'analiticos') loadAnalytics();
    if (activeTab === 'historico') loadHistory();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadDashboard(),
      loadCategories()
    ]);
    setLoading(false);
  };

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/shelter/inventory/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
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

  const loadDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/shelter/inventory/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(response.data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/shelter/inventory/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erro ao carregar analíticos:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      if (historyFilters.movement_type) params.append('movement_type', historyFilters.movement_type);
      if (historyFilters.category_id) params.append('category_id', historyFilters.category_id);
      
      const response = await axios.get(`${API_URL}/api/shelter/inventory/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
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
      loadDashboard();
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
      loadDashboard();
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
      loadDashboard();
    } catch (error) {
      showError('Erro', error.response?.data?.detail || 'Erro ao registrar movimentação');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { bg: '#eff6ff', color: '#3b82f6', text: 'Disponível' },
      reserved: { bg: '#fef3c7', color: '#f59e0b', text: 'Confirmada' },
      picked_up: { bg: '#f3e8ff', color: '#8b5cf6', text: 'Em Trânsito' },
      delivered: { bg: '#f0fdf4', color: '#10b981', text: 'Entregue' },
      cancelled: { bg: '#fef2f2', color: '#ef4444', text: 'Cancelada' }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '700'
      }}>
        {config.text}
      </span>
    );
  };

  const filteredDeliveries = deliveryFilter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === deliveryFilter);

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
        padding: '80px 24px 24px',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        {/* Header com Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 16px', fontSize: '32px', fontWeight: '800', color: '#111' }}>
            📊 Dashboard de Controle
          </h1>
          
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            {[
              { id: 'estoque', label: '📦 Estoque', icon: Package },
              { id: 'entregas', label: '🚚 Entregas', icon: Truck },
              { id: 'analiticos', label: '📊 Analíticos', icon: BarChart3 },
              { id: 'historico', label: '📜 Histórico', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ABA ESTOQUE */}
        {activeTab === 'estoque' && dashboard && (
          <div>
            {/* Botão Adicionar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
              <MetricCard icon={Package} label="Itens Ativos" value={dashboard.metrics.total_items} color="#3b82f6" bgColor="#eff6ff" />
              <MetricCard icon={AlertTriangle} label="Itens Críticos" value={dashboard.metrics.critical_items} color="#ef4444" bgColor="#fef2f2" />
              <MetricCard icon={Truck} label="Em Trânsito" value={dashboard.metrics.items_in_transit} color="#f59e0b" bgColor="#fffbeb" />
              <MetricCard icon={CheckCircle} label="Recebidos Hoje" value={dashboard.metrics.received_today} color="#10b981" bgColor="#f0fdf4" />
            </div>

            {/* Lista de Itens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px'
            }}>
              {dashboard.items.map(item => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  onAdjust={(item) => {
                    setSelectedItem(item);
                    setAdjustForm({ new_quantity: item.needed_quantity, notes: '' });
                    setShowAdjustModal(true);
                  }}
                  onMovement={(item, type) => {
                    setSelectedItem(item);
                    setMovementType(type);
                    setMovementForm({ quantity: '', source_type: type === 'in' ? 'donation' : 'distribution', notes: '' });
                    setShowMovementModal(true);
                  }}
                />
              ))}
            </div>

            {dashboard.items.length === 0 && (
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
        )}

        {/* ABA ENTREGAS */}
        {activeTab === 'entregas' && (
          <div>
            {/* Filtros */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <Filter size={20} color="#6b7280" />
              <select
                value={deliveryFilter}
                onChange={(e) => setDeliveryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Todas as Entregas</option>
                <option value="available">Disponíveis</option>
                <option value="reserved">Confirmadas</option>
                <option value="picked_up">Em Trânsito</option>
                <option value="delivered">Entregues</option>
              </select>
              <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: 'auto' }}>
                {filteredDeliveries.length} entregas
              </span>
            </div>

            {/* Lista de Entregas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDeliveries.map(delivery => (
                <div
                  key={delivery.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '32px' }}>{delivery.category_icon}</div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                          {delivery.category_name} - {delivery.quantity} unidades
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                          {delivery.volunteer_name ? `Voluntário: ${delivery.volunteer_name}` : 'Aguardando voluntário'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(delivery.status)}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    <div>
                      <strong>Criado:</strong> {new Date(delivery.created_at).toLocaleString('pt-BR')}
                    </div>
                    {delivery.reserved_at && (
                      <div>
                        <strong>Confirmado:</strong> {new Date(delivery.reserved_at).toLocaleString('pt-BR')}
                      </div>
                    )}
                    {delivery.delivery_code && (
                      <div>
                        <strong>Código:</strong> {delivery.delivery_code}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredDeliveries.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '16px',
                border: '2px dashed #e5e7eb'
              }}>
                <Truck size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111' }}>
                  Nenhuma entrega encontrada
                </h3>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280' }}>
                  Não há entregas com os filtros selecionados
                </p>
              </div>
            )}
          </div>
        )}

        {/* ABA ANALÍTICOS */}
        {activeTab === 'analiticos' && analytics && (
          <div>
            {/* KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Taxa de Atendimento</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#10b981' }}>
                  {analytics.kpis.avg_fulfillment_rate}%
                </p>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Estoque Total</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>
                  {analytics.kpis.total_stock}
                </p>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Em Trânsito</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>
                  {analytics.kpis.total_reserved}
                </p>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Itens Críticos</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>
                  {analytics.kpis.critical_items}
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Gráfico de Barras */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>
                  Necessário vs Estoque vs Em Trânsito
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="needed" fill="#ef4444" name="Necessário" />
                    <Bar dataKey="stock" fill="#10b981" name="Estoque" />
                    <Bar dataKey="reserved" fill="#3b82f6" name="Em Trânsito" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Linha */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>
                  Movimentações (Últimos 30 dias)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.timeline_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="in" stroke="#10b981" name="Entradas" strokeWidth={2} />
                    <Line type="monotone" dataKey="out" stroke="#ef4444" name="Saídas" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'historico' && (
          <div>
            {/* Filtros */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Data Início
                </label>
                <input
                  type="date"
                  value={historyFilters.start_date}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, start_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Data Fim
                </label>
                <input
                  type="date"
                  value={historyFilters.end_date}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, end_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Tipo
                </label>
                <select
                  value={historyFilters.movement_type}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, movement_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Todos</option>
                  <option value="in">Entradas</option>
                  <option value="out">Saídas</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Categoria
                </label>
                <select
                  value={historyFilters.category_id}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Todas</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.display_name || cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={loadHistory}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Filtrar
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  Histórico de Movimentações ({history.total})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.movements.map(mov => (
                  <div
                    key={mov.id}
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${mov.movement_type === 'in' ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{mov.category_icon}</span>
                        <strong style={{ fontSize: '14px', color: mov.movement_type === 'in' ? '#10b981' : '#ef4444' }}>
                          {mov.movement_type === 'in' ? '↑ ENTRADA' : '↓ SAÍDA'} - {mov.quantity} unidades
                        </strong>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(mov.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
                      <strong>Categoria:</strong> {mov.category_name}
                    </p>
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

              {history.movements.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <History size={48} style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma movimentação encontrada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {showAddModal && (
        <AddItemModal
          categories={categories}
          form={newItemForm}
          setForm={setNewItemForm}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddItem}
        />
      )}

      {showAdjustModal && selectedItem && (
        <AdjustModal
          item={selectedItem}
          form={adjustForm}
          setForm={setAdjustForm}
          onClose={() => setShowAdjustModal(false)}
          onSubmit={handleAdjust}
        />
      )}

      {showMovementModal && selectedItem && (
        <MovementModal
          item={selectedItem}
          type={movementType}
          form={movementForm}
          setForm={setMovementForm}
          onClose={() => setShowMovementModal(false)}
          onSubmit={handleMovement}
        />
      )}

      <AlertModal show={alert.show} onClose={closeAlert} title={alert.title} message={alert.message} type={alert.type} />
      {ModalComponent}
    </>
  );
}

// Componentes auxiliares
function MetricCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{label}</p>
          <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#111' }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function InventoryItemCard({ item, onAdjust, onMovement }) {
  const getStatusColor = () => {
    if (item.is_critical) return { bg: '#fef2f2', border: '#fecaca' };
    if (item.fulfillment_rate < 50) return { bg: '#fffbeb', border: '#fde68a' };
    return { bg: '#f0fdf4', border: '#bbf7d0' };
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '32px', background: colors.bg, borderRadius: '12px', padding: '8px' }}>
          {item.category_icon || '📦'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>{item.category_name}</h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
            {item.priority}
          </p>
        </div>
        {item.is_critical && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            CRÍTICO
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '12px',
        textAlign: 'center'
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>NECESSÁRIO</p>
          <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800' }}>{item.needed_quantity}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>ESTOQUE</p>
          <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{item.current_stock}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>FALTA</p>
          <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#ef4444' }}>{item.deficit}</p>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{
          height: '6px',
          background: '#f3f4f6',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: item.is_critical ? '#ef4444' : '#10b981',
            transition: 'width 0.3s'
          }} />
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>
          {item.fulfillment_rate}% atendido
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
        <button
          onClick={() => onAdjust(item)}
          style={{
            padding: '8px',
            background: '#eff6ff',
            color: '#3b82f6',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Ajustar
        </button>
        <button
          onClick={() => onMovement(item, 'in')}
          style={{
            padding: '8px',
            background: '#f0fdf4',
            color: '#16a34a',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Entrada
        </button>
        <button
          onClick={() => onMovement(item, 'out')}
          style={{
            padding: '8px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Saída
        </button>
        <button
          style={{
            padding: '8px',
            background: '#f9fafb',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Mais
        </button>
      </div>
    </div>
  );
}

function AddItemModal({ categories, form, setForm, onClose, onSubmit }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            Adicionar Item ao Inventário
          </h2>
          <button
            onClick={onClose}
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
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
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
              value={form.needed_quantity}
              onChange={(e) => setForm({ ...form, needed_quantity: e.target.value })}
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
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
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
              onClick={onSubmit}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustModal({ item, form, setForm, onClose, onSubmit }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            Ajustar Necessidade - {item.category_name}
          </h2>
          <button
            onClick={onClose}
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
              Quantidade atual necessária: <strong>{item.needed_quantity}</strong>
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Estoque atual: <strong>{item.current_stock}</strong>
            </p>
            {item.reserved_quantity > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>
                ⚠️ Em trânsito: {item.reserved_quantity}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              Nova Quantidade Necessária *
            </label>
            <input
              type="number"
              value={form.new_quantity}
              onChange={(e) => setForm({ ...form, new_quantity: e.target.value })}
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
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              onClick={onClose}
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
              onClick={onSubmit}
              style={{
                flex: 1,
                padding: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovementModal({ item, type, form, setForm, onClose, onSubmit }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            Registrar {type === 'in' ? 'Entrada' : 'Saída'} - {item.category_name}
          </h2>
          <button
            onClick={onClose}
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
              Estoque atual: <strong>{item.current_stock}</strong>
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              Quantidade *
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
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
              Tipo de {type === 'in' ? 'Entrada' : 'Saída'}
            </label>
            <select
              value={form.source_type}
              onChange={(e) => setForm({ ...form, source_type: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              {type === 'in' ? (
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
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              onClick={onClose}
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
              onClick={onSubmit}
              style={{
                flex: 1,
                padding: '12px',
                background: type === 'in' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
