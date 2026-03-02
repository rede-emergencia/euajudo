import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inventory, categories as categoriesApi, deliveries } from '../lib/api';
import Header from '../components/Header';

const STATUS_COLORS = {
  available: 'bg-yellow-100 text-yellow-800',
  pending_confirmation: 'bg-blue-100 text-blue-800',
  reserved: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  available: 'Aguardando voluntário',
  pending_confirmation: 'Voluntário comprometido',
  reserved: 'Reservado',
  picked_up: 'Retirado',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  pending: 'Aguardando',
  active: 'Ativo',
  partially_completed: 'Parcial',
  completed: 'Concluído',
};

const REQUEST_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  partially_completed: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ShelterDashboardV2() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data
  const [dashboardData, setDashboardData] = useState(null);
  const [shelterDeliveries, setShelterDeliveries] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [distributions, setDistributions] = useState([]);

  // Modals
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showServiceRequestForm, setShowServiceRequestForm] = useState(false);
  const [showDistributeForm, setShowDistributeForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(null);
  const [showStockForm, setShowStockForm] = useState(null); // null = closed, 'add' = add stock, {id, ...} = edit stock
  const [showEditDistributionForm, setShowEditDistributionForm] = useState(null);

  // Forms
  const [requestForm, setRequestForm] = useState({ category_id: '', quantity_requested: '', notes: '', metadata: {} });
  const [serviceRequestForm, setServiceRequestForm] = useState({ 
    category_id: '', 
    duration_hours: '', 
    people_needed: '1', 
    urgency: 'media',
    notes: '' 
  });
  const [distributeForm, setDistributeForm] = useState({ category_id: '', quantity: '', recipient_name: '', recipient_document: '', notes: '' });
  const [deliveryForm, setDeliveryForm] = useState({ category_id: '', quantity: '', metadata_cache: {} });
  const [adjustForm, setAdjustForm] = useState({ new_quantity: '', reason: '' });
  const [stockForm, setStockForm] = useState({ category_id: '', quantity_in_stock: '', min_threshold: '', metadata: {} });

  const loadDashboard = useCallback(async () => {
    try {
      const res = await inventory.getDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    try {
      console.log('🔍 DEBUG V2: Carregando deliveries...');
      const res = await inventory.getShelterDeliveries();
      console.log('🔍 DEBUG V2: Dados recebidos:', res.data);
      setShelterDeliveries(res.data || []);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      setShelterDeliveries([]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.list();
      setCategoryList(res.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  const loadDistributions = useCallback(async () => {
    try {
      const res = await inventory.getDistributions();
      setDistributions(res.data || []);
    } catch (err) {
      console.error('Error loading distributions:', err);
      setDistributions([]);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadDashboard(), loadDeliveries(), loadCategories(), loadDistributions()]);
      setLoading(false);
    };
    loadAll();
  }, [loadDashboard, loadDeliveries, loadCategories, loadDistributions]);

  const refreshData = async () => {
    await Promise.all([loadDashboard(), loadDeliveries(), loadDistributions()]);
  };

  // ========== ACTIONS ==========

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await inventory.createRequest({
        category_id: parseInt(requestForm.category_id),
        quantity_requested: parseInt(requestForm.quantity_requested),
        notes: requestForm.notes || null,
        metadata_cache: requestForm.metadata,
      });
      setShowRequestForm(false);
      setRequestForm({ category_id: '', quantity_requested: '', notes: '', metadata: {} });
      await refreshData();
      
      // Trigger map icon update
      window.dispatchEvent(new CustomEvent('shelterRequestCreated', {
        detail: { shelterId: user?.id, hasActiveRequests: true }
      }));
      
      alert('Pedido de doação criado! Voluntários serão notificados.');
    } catch (err) {
      alert('Erro ao criar pedido: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateServiceRequest = async (e) => {
    e.preventDefault();
    try {
      // Criar como delivery de serviço (sem quantidade, com metadata)
      await deliveries.createDirectDelivery({
        category_id: parseInt(serviceRequestForm.category_id),
        quantity: 1, // Serviços sempre quantidade 1
        metadata_cache: {
          service_type: 'request',
          duration_hours: serviceRequestForm.duration_hours ? parseInt(serviceRequestForm.duration_hours) : null,
          people_needed: parseInt(serviceRequestForm.people_needed),
          urgency: serviceRequestForm.urgency,
          description: serviceRequestForm.notes
        }
      });
      setShowServiceRequestForm(false);
      setServiceRequestForm({ category_id: '', duration_hours: '', people_needed: '1', urgency: 'media', notes: '' });
      await refreshData();
      alert('Solicitação de serviço criada! Voluntários serão notificados.');
    } catch (err) {
      alert('Erro ao criar solicitação: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await inventory.createItem({
        category_id: parseInt(stockForm.category_id),
        quantity_in_stock: parseInt(stockForm.quantity_in_stock),
        min_threshold: parseInt(stockForm.min_threshold) || 0,
        metadata_cache: stockForm.metadata,
      });
      setShowStockForm(null);
      setStockForm({ category_id: '', quantity_in_stock: '', min_threshold: '', metadata: {} });
      await refreshData();
      alert('Estoque adicionado com sucesso!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditStock = async (e) => {
    e.preventDefault();
    try {
      await inventory.updateItem(showStockForm.id, {
        quantity_in_stock: parseInt(stockForm.quantity_in_stock),
        min_threshold: parseInt(stockForm.min_threshold),
      });
      setShowStockForm(null);
      setStockForm({ category_id: '', quantity_in_stock: '', min_threshold: '' });
      await refreshData();
      alert('Estoque atualizado!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDistribute = async (e) => {
    e.preventDefault();
    try {
      await inventory.distribute({
        category_id: parseInt(distributeForm.category_id),
        quantity: parseInt(distributeForm.quantity),
        recipient_name: distributeForm.recipient_name || null,
        recipient_document: distributeForm.recipient_document || null,
        notes: distributeForm.notes || null,
      });
      setShowDistributeForm(false);
      setDistributeForm({ category_id: '', quantity: '', recipient_name: '', recipient_document: '', notes: '' });
      await refreshData();
      alert('Distribuição registrada com sucesso!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      await inventory.createDirectDelivery({
        category_id: parseInt(deliveryForm.category_id),
        quantity: parseInt(deliveryForm.quantity),
        metadata_cache: deliveryForm.metadata_cache || {},
      });
      setShowDeliveryForm(false);
      setDeliveryForm({ category_id: '', quantity: '', metadata_cache: {} });
      await refreshData();
      alert('Pedido de entrega criado! Voluntários podem aceitar agora.');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdjustRequest = async (e) => {
    e.preventDefault();
    try {
      const currentRequest = activeRequests.find(r => r.id === showAdjustForm);
      const newQty = parseInt(adjustForm.new_quantity);
      const oldQty = currentRequest?.quantity_requested || 0;
      const diff = newQty - oldQty;

      let adjustment_type, quantity_change;
      if (diff > 0) {
        adjustment_type = 'increase';
        quantity_change = diff;
      } else if (diff < 0) {
        adjustment_type = 'decrease';
        quantity_change = Math.abs(diff);
      } else {
        alert('A quantidade é a mesma. Nada a ajustar.');
        return;
      }

      await inventory.adjustRequest(showAdjustForm, {
        adjustment_type,
        quantity_change,
        reason: adjustForm.reason || 'Ajuste manual',
      });
      setShowAdjustForm(null);
      setAdjustForm({ new_quantity: '', reason: '' });
      await refreshData();
      alert('Pedido ajustado com sucesso!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) return;
    try {
      await inventory.cancelRequest(requestId);
      await refreshData();
      alert('Pedido cancelado!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelDelivery = async (deliveryId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta entrega?')) return;
    try {
      await deliveries.cancel(deliveryId);
      await refreshData();
      alert('Entrega cancelada!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditDistribution = async (e) => {
    e.preventDefault();
    try {
      await inventory.updateDistribution(showEditDistributionForm.id, {
        quantity: parseInt(distributeForm.quantity),
        recipient_name: distributeForm.recipient_name || null,
        recipient_document: distributeForm.recipient_document || null,
        notes: distributeForm.notes || null,
      });
      setShowEditDistributionForm(null);
      setDistributeForm({ category_id: '', quantity: '', recipient_name: '', recipient_document: '', notes: '' });
      await refreshData();
      alert('Distribuição atualizada!');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelDistribution = async (distributionId) => {
    const reason = prompt('Motivo do cancelamento (opcional):');
    try {
      await inventory.cancelDistribution(distributionId, reason);
      await refreshData();
      alert('Distribuição cancelada! Itens retornaram ao estoque.');
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.detail || err.message));
    }
  };

  // ========== RENDER HELPERS ==========

  const getCategoryName = (id) => {
    const cat = categoryList.find(c => c.id === id);
    return cat?.display_name || cat?.name || `Cat #${id}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Carregando dashboard...</span>
          </div>
        </div>
      </>
    );
  }

  const stats = dashboardData?.stats || {};
  const inventoryByCategory = dashboardData?.inventory_by_category || [];
  const activeRequests = dashboardData?.active_requests || [];
  const recentTransactions = dashboardData?.recent_transactions || [];
  const lowStockAlerts = dashboardData?.low_stock_alerts || [];

  const activeDeliveries = shelterDeliveries.filter(d => !['delivered', 'cancelled', 'expired'].includes(d.status));
  const completedDeliveries = shelterDeliveries.filter(d => d.status === 'delivered');

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'inventory', label: 'Estoque', icon: '📦', subtitle: 'O que temos' },
    { id: 'requests', label: 'Pedidos', icon: '📋', subtitle: 'Solicitar doações' },
    { id: 'deliveries', label: 'Entregas', icon: '🚚', subtitle: 'Voluntários vindo' },
    { id: 'distributions', label: 'Distribuições', icon: '🤝', subtitle: 'Para beneficiários' },
  ];

  return (
    <>
      <Header />
      <div className="p-4 md:p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Dashboard do Abrigo
          </h1>
          <p className="text-gray-600">
            Bem-vindo, {user?.name || user?.nome} — Gestão de estoque e entregas
          </p>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-red-600 font-semibold">Alerta de estoque baixo:</span>
              <span className="ml-2 text-red-700">
                {lowStockAlerts.map(a => `${a.category_name} (${a.quantity_available} un.)`).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          {activeTab === 'overview' && renderOverview(stats, inventoryByCategory, activeDeliveries, activeRequests, recentTransactions)}
          {activeTab === 'inventory' && renderInventory(inventoryByCategory)}
          {activeTab === 'requests' && renderRequests(activeRequests, getCategoryName)}
          {activeTab === 'deliveries' && renderDeliveries(activeDeliveries, completedDeliveries)}
          {activeTab === 'distributions' && renderDistributions(recentTransactions)}
        </div>

        {/* Modals */}
        {showRequestForm && renderRequestFormModal()}
        {showServiceRequestForm && renderServiceRequestFormModal()}
        {showDistributeForm && renderDistributeFormModal()}
        {showEditDistributionForm && renderEditDistributionModal()}
        {showDeliveryForm && renderDeliveryFormModal()}
        {showAdjustForm && renderAdjustFormModal()}
        {showStockForm && renderStockFormModal()}
      </div>
    </>
  );

  // ========== TAB RENDERERS ==========

  function renderOverview(stats, inventoryByCategory, activeDeliveries, activeRequests, recentTransactions) {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Em Estoque" value={stats.total_items_in_stock || 0} icon="📦" color="blue" />
          <StatCard title="Categorias" value={stats.total_categories || 0} icon="🏷️" color="green" />
          <StatCard title="Recebido (mês)" value={stats.total_received_this_month || 0} icon="📥" color="indigo" />
          <StatCard title="Distribuído (mês)" value={stats.total_distributed_this_month || 0} icon="📤" color="purple" />
        </div>

        
        {/* Stock Summary */}
        {inventoryByCategory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Estoque por Categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {inventoryByCategory.map(item => (
                <div key={item.category_id} className={`p-3 rounded-lg border ${item.is_low_stock ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="font-medium text-gray-800">{item.category_name}</div>
                  <div className="text-2xl font-bold text-gray-900">{item.quantity_available}</div>
                  <div className="text-xs text-gray-500">
                    {item.quantity_reserved > 0 && <span className="text-orange-600">{item.quantity_reserved} reservado</span>}
                    {item.is_low_stock && <span className="text-red-600 ml-1">Estoque baixo!</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Entregas Ativas ({activeDeliveries.length})</h3>
            <div className="space-y-2">
              {activeDeliveries.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <span className="font-medium">{d.category_name}</span>
                    <span className="text-gray-600 ml-2">{d.quantity} un.</span>
                    {d.volunteer_name && <span className="text-gray-500 ml-2">— {d.volunteer_name}</span>}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100'}`}>
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Atividade Recente</h3>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((txn, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className={txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                    </span>
                    <span className="ml-2 text-gray-700">{txn.category_name}</span>
                    {txn.notes && <span className="ml-2 text-gray-400 text-sm">— {txn.notes}</span>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(txn.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderInventory(items) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Estoque Atual</h3>
            <p className="text-sm text-gray-500">Itens que o abrigo já possui</p>
          </div>
          <button
            onClick={() => {
              setShowStockForm('add');
              setStockForm({ category_id: '', quantity_in_stock: '', min_threshold: '' });
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            + Adicionar Item
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Nenhum item no estoque." actionLabel="Adicionar Primeiro Item" onAction={() => setShowStockForm('add')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Categoria</th>
                  <th className="text-right p-3 font-medium text-gray-600">Em Estoque</th>
                  <th className="text-right p-3 font-medium text-gray-600">Reservado</th>
                  <th className="text-right p-3 font-medium text-gray-600">Disponível</th>
                  <th className="text-center p-3 font-medium text-gray-600">Status</th>
                  <th className="text-center p-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.category_id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.category_name}</td>
                    <td className="p-3 text-right">{item.quantity_in_stock}</td>
                    <td className="p-3 text-right text-orange-600">{item.quantity_reserved}</td>
                    <td className="p-3 text-right font-bold">{item.quantity_available}</td>
                    <td className="p-3 text-center">
                      {item.is_low_stock ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Baixo</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">OK</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setShowStockForm(item);
                          setStockForm({
                            category_id: item.category_id,
                            quantity_in_stock: item.quantity_in_stock.toString(),
                            min_threshold: item.min_threshold.toString(),
                          });
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderRequests(requests, getCategoryName) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Pedidos de Doação</h3>
            <p className="text-sm text-gray-500">Solicitações para voluntários trazerem itens</p>
          </div>
          <button onClick={() => setShowRequestForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            + Novo Pedido
          </button>
        </div>

        {requests.length === 0 ? (
          <EmptyState message="Nenhum pedido ativo." actionLabel="Criar Pedido" onAction={() => setShowRequestForm(true)} />
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">
                      Pedido #{req.id} — {getCategoryName(req.category_id)}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Solicitado: <strong>{req.quantity_requested}</strong> |
                      Recebido: <strong className="text-green-600">{req.quantity_received || 0}</strong>
                      {req.quantity_cancelled > 0 && (
                        <> | Cancelado: <strong className="text-red-600">{req.quantity_cancelled}</strong></>
                      )}
                    </p>
                    {req.notes && <p className="text-sm text-gray-500 mt-1">{req.notes}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Criado: {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {req.quantity_requested > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((req.quantity_received || 0) / req.quantity_requested) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((req.quantity_received || 0) / req.quantity_requested) * 100)}% completo
                    </p>
                  </div>
                )}

                {/* Actions */}
                {req.status !== 'completed' && req.status !== 'cancelled' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setShowAdjustForm(req.id);
                        setAdjustForm({ new_quantity: req.quantity_requested.toString(), reason: '' });
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Ajustar Quantidade
                    </button>
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDeliveries(active, completed) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Entregas Recebidas</h3>
            <p className="text-sm text-gray-500">Voluntários trazendo itens para o abrigo</p>
          </div>
        </div>

        {/* Active Deliveries */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Voluntários a Caminho ({active.length})
          </h4>
          {active.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Nenhum voluntário a caminho no momento.</p>
          ) : (
            <div className="space-y-3">
              {active.map(d => (
                <div key={d.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        Entrega #{d.id} — {d.category_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {d.quantity} un.
                        {d.volunteer_name && <> — Voluntário: <strong>{d.volunteer_name}</strong></>}
                      </p>
                      {/* Show delivery_code for direct donations (no parent_delivery_id), pickup_code for pickup deliveries */}
                      {d.delivery_code && !d.parent_delivery_id && d.status === 'pending_confirmation' && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 inline-block">
                          <span className="text-sm text-yellow-700">
                            Código de entrega: <strong className="font-mono text-lg">{d.delivery_code}</strong>
                          </span>
                        </div>
                      )}
                      {d.pickup_code && d.parent_delivery_id && d.status === 'pending_confirmation' && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 inline-block">
                          <span className="text-sm text-blue-700">
                            Código de retirada: <strong className="font-mono text-lg">{d.pickup_code}</strong>
                          </span>
                        </div>
                      )}
                      {d.delivery_code && d.status === 'picked_up' && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded p-2 inline-block">
                          <span className="text-sm text-green-700">
                            Código de entrega: <strong className="font-mono text-lg">{d.delivery_code}</strong>
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Criado: {d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[d.status] || d.status}
                    </span>
                  </div>

                  {['available', 'pending_confirmation', 'reserved'].includes(d.status) && !d.parent_delivery_id && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleCancelDelivery(d.id)}
                        className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                      >
                        Cancelar Entrega
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Entregas Concluídas ({completed.length})
            </h4>
            <div className="space-y-2">
              {completed.slice(0, 10).map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <span className="font-medium text-green-800">{d.category_name}</span>
                    <span className="text-green-700 ml-2">{d.quantity} un.</span>
                    {d.volunteer_name && <span className="text-green-600 ml-2">— {d.volunteer_name}</span>}
                  </div>
                  <span className="text-xs text-green-600">
                    {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderDistributions(transactions) {
    const activeDistributions = distributions.filter(d => d.status === 'active');
    const cancelledDistributions = distributions.filter(d => d.status === 'cancelled');
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Distribuições para Beneficiários</h3>
            <p className="text-sm text-gray-500">Entregas diretas para pessoas em situação de vulnerabilidade</p>
          </div>
          <button onClick={() => setShowDistributeForm(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
            + Registrar Distribuição
          </button>
        </div>

        {/* Active Distributions */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Distribuições Ativas ({activeDistributions.length})
          </h4>
          {activeDistributions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Nenhuma distribuição ativa.</p>
          ) : (
            <div className="space-y-3">
              {activeDistributions.map(d => (
                <div key={d.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        Distribuição #{d.id} — {getCategoryName(d.category_id)}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantidade: <strong>{d.quantity}</strong> un.
                        {d.recipient_name && <> — Beneficiário: <strong>{d.recipient_name}</strong></>}
                        {d.recipient_document && <> — Documento: <strong>{d.recipient_document}</strong></>}
                      </p>
                      {d.notes && <p className="text-sm text-gray-500 mt-1">{d.notes}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Distribuído: {new Date(d.distributed_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowEditDistributionForm(d);
                          setDistributeForm({
                            category_id: d.category_id.toString(),
                            quantity: d.quantity.toString(),
                            recipient_name: d.recipient_name || '',
                            recipient_document: d.recipient_document || '',
                            notes: d.notes || '',
                          });
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCancelDistribution(d.id)}
                        className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancelled Distributions */}
        {cancelledDistributions.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Distribuições Canceladas ({cancelledDistributions.length})
            </h4>
            <div className="space-y-2">
              {cancelledDistributions.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <span className="font-medium text-red-800">{getCategoryName(d.category_id)}</span>
                    <span className="text-red-700 ml-2">{d.quantity} un.</span>
                    {d.recipient_name && <span className="text-red-600 ml-2">— {d.recipient_name}</span>}
                    {d.cancellation_reason && <span className="text-red-500 ml-2 text-sm">— {d.cancellation_reason}</span>}
                  </div>
                  <span className="text-xs text-red-600">
                    Cancelado: {new Date(d.cancelled_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions (fallback) */}
        {distributions.length === 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Histórico de Distribuições</h4>
            {transactions.filter(t => t.transaction_type === 'donation_given').length === 0 ? (
              <EmptyState message="Nenhuma distribuição registrada." actionLabel="Registrar Distribuição" onAction={() => setShowDistributeForm(true)} />
            ) : (
              <div className="space-y-2">
                {transactions.filter(t => t.transaction_type === 'donation_given').map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <span className="font-medium text-purple-800">{d.category_name}</span>
                      <span className="text-purple-700 ml-2">{Math.abs(d.quantity)} un.</span>
                      {d.notes && <span className="text-purple-500 ml-2 text-sm">— {d.notes}</span>}
                    </div>
                    <span className="text-xs text-purple-600">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ========== MODAL RENDERERS ==========

  function renderRequestFormModal() {
    // Filtrar apenas categorias de PRODUTOS
    const productCategories = categoryList.filter(c => 
      !c.name.startsWith('servico_')
    );
    const selectedCategory = categoryList.find(c => c.id === parseInt(requestForm.category_id));
    const attributes = selectedCategory?.attributes || [];

    return (
      <ModalOverlay onClose={() => setShowRequestForm(false)} title="Pedir Doações de Produtos">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria de Produto</label>
            <select
              value={requestForm.category_id}
              onChange={e => setRequestForm(f => ({ ...f, category_id: e.target.value, metadata: {} }))}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Selecione um produto...</option>
              {productCategories.map(c => (
                <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic metadata fields */}
          {attributes.map(attr => (
            <div key={attr.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.display_name}
              </label>
              {attr.attribute_type === 'select' ? (
                <select
                  value={requestForm.metadata[attr.name] || ''}
                  onChange={e => setRequestForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Selecione...</option>
                  {attr.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : attr.attribute_type === 'number' ? (
                <input
                  type="number"
                  value={requestForm.metadata[attr.name] || ''}
                  onChange={e => setRequestForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  min={attr.min_value}
                  max={attr.max_value}
                  className="w-full border rounded-lg p-2"
                />
              ) : (
                <input
                  type="text"
                  value={requestForm.metadata[attr.name] || ''}
                  onChange={e => setRequestForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  maxLength={attr.max_length}
                  className="w-full border rounded-lg p-2"
                />
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              value={requestForm.quantity_requested}
              onChange={e => setRequestForm(f => ({ ...f, quantity_requested: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
            <textarea
              value={requestForm.notes}
              onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Urgente, precisamos de roupas infantis"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Criar Pedido
            </button>
            <button type="button" onClick={() => setShowRequestForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderServiceRequestFormModal() {
    // Filtrar apenas categorias de SERVIÇOS
    const serviceCategories = categoryList.filter(c => 
      c.name.startsWith('servico_')
    );

    return (
      <ModalOverlay onClose={() => setShowServiceRequestForm(false)} title="Solicitar Serviço Voluntário">
        <p className="text-sm text-gray-600 mb-4">
          Solicite ajuda de voluntários para serviços como limpeza, manutenção, aulas, etc.
        </p>
        <form onSubmit={handleCreateServiceRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço *</label>
            <select
              value={serviceRequestForm.category_id}
              onChange={e => setServiceRequestForm(f => ({ ...f, category_id: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Selecione um serviço...</option>
              {serviceCategories.map(c => (
                <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração Estimada (horas)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={serviceRequestForm.duration_hours}
                onChange={e => setServiceRequestForm(f => ({ ...f, duration_hours: e.target.value }))}
                className="w-full border rounded-lg p-2"
                placeholder="Ex: 4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pessoas Necessárias</label>
              <input
                type="number"
                min="1"
                max="20"
                value={serviceRequestForm.people_needed}
                onChange={e => setServiceRequestForm(f => ({ ...f, people_needed: e.target.value }))}
                className="w-full border rounded-lg p-2"
                placeholder="Ex: 2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
            <select
              value={serviceRequestForm.urgency}
              onChange={e => setServiceRequestForm(f => ({ ...f, urgency: e.target.value }))}
              className="w-full border rounded-lg p-2"
            >
              <option value="baixa">Baixa - Pode esperar</option>
              <option value="media">Média - Próximos dias</option>
              <option value="alta">Alta - Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Serviço *</label>
            <textarea
              value={serviceRequestForm.notes}
              onChange={e => setServiceRequestForm(f => ({ ...f, notes: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Precisamos de limpeza geral no refeitório, incluindo piso e paredes"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Solicitar Serviço
            </button>
            <button type="button" onClick={() => setShowServiceRequestForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderDistributeFormModal() {
    const availableItems = inventoryByCategory.filter(i => i.quantity_available > 0);
    
    return (
      <ModalOverlay onClose={() => setShowDistributeForm(false)} title="Registrar Distribuição para Beneficiário">
        <p className="text-sm text-gray-600 mb-4">
          Registre a entrega de itens do estoque para pessoas em situação de vulnerabilidade.
        </p>
        <form onSubmit={handleDistribute} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={distributeForm.category_id}
              onChange={e => setDistributeForm(f => ({ ...f, category_id: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Selecione uma categoria...</option>
              {availableItems.length === 0 ? (
                <option disabled>Nenhum item disponível no estoque</option>
              ) : (
                availableItems.map(i => (
                  <option key={i.category_id} value={i.category_id}>
                    {i.category_name} ({i.quantity_available} disponível)
                  </option>
                ))
              )}
            </select>
            {availableItems.length === 0 && (
              <p className="text-xs text-red-600 mt-1">Adicione itens ao estoque primeiro</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
            <input
              type="number"
              min="1"
              value={distributeForm.quantity}
              onChange={e => setDistributeForm(f => ({ ...f, quantity: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Beneficiário</label>
            <input
              type="text"
              value={distributeForm.recipient_name}
              onChange={e => setDistributeForm(f => ({ ...f, recipient_name: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Maria da Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou RG</label>
            <input
              type="text"
              value={distributeForm.recipient_document}
              onChange={e => setDistributeForm(f => ({ ...f, recipient_document: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="000.000.000-00 ou 12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={distributeForm.notes}
              onChange={e => setDistributeForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg p-2"
              rows={2}
              placeholder="Ex: Família com 4 pessoas, 2 crianças"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Registrar Distribuição
            </button>
            <button type="button" onClick={() => setShowDistributeForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderStockFormModal() {
    const isEdit = showStockForm && showStockForm !== 'add';
    const selectedCategory = categoryList.find(c => c.id === parseInt(stockForm.category_id));
    const attributes = selectedCategory?.attributes || [];
    
    return (
      <ModalOverlay onClose={() => setShowStockForm(null)} title={isEdit ? 'Editar Estoque' : 'Adicionar ao Estoque'}>
        <p className="text-sm text-gray-600 mb-4">
          {isEdit ? 'Atualize a quantidade em estoque.' : 'Registre itens que o abrigo já possui.'}
        </p>
        <form onSubmit={isEdit ? handleEditStock : handleAddStock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={stockForm.category_id}
              onChange={e => {
                setStockForm(f => ({ ...f, category_id: e.target.value, metadata: {} }));
              }}
              required
              disabled={isEdit}
              className="w-full border rounded-lg p-2 disabled:bg-gray-100"
            >
              <option value="">Selecione...</option>
              {categoryList.map(c => (
                <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic metadata fields */}
          {attributes.map(attr => (
            <div key={attr.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.display_name}
              </label>
              {attr.attribute_type === 'select' ? (
                <select
                  value={stockForm.metadata[attr.name] || ''}
                  onChange={e => setStockForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Selecione...</option>
                  {attr.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : attr.attribute_type === 'number' ? (
                <input
                  type="number"
                  value={stockForm.metadata[attr.name] || ''}
                  onChange={e => setStockForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  min={attr.min_value}
                  max={attr.max_value}
                  className="w-full border rounded-lg p-2"
                />
              ) : (
                <input
                  type="text"
                  value={stockForm.metadata[attr.name] || ''}
                  onChange={e => setStockForm(f => ({
                    ...f,
                    metadata: { ...f.metadata, [attr.name]: e.target.value }
                  }))}
                  required={attr.required}
                  maxLength={attr.max_length}
                  className="w-full border rounded-lg p-2"
                />
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque *</label>
            <input
              type="number"
              min="0"
              value={stockForm.quantity_in_stock}
              onChange={e => setStockForm(f => ({ ...f, quantity_in_stock: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de Estoque Baixo</label>
            <input
              type="number"
              min="0"
              value={stockForm.min_threshold}
              onChange={e => setStockForm(f => ({ ...f, min_threshold: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 10 (alertar quando abaixo deste valor)"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
              {isEdit ? 'Atualizar' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => setShowStockForm(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderDeliveryFormModal() {
    return (
      <ModalOverlay onClose={() => setShowDeliveryForm(false)} title="Criar Pedido de Entrega">
        <p className="text-sm text-gray-500 mb-4">
          Crie um pedido de entrega que voluntários podem aceitar. Quando um voluntário confirmar a entrega, o estoque será atualizado automaticamente.
        </p>
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={deliveryForm.category_id}
              onChange={e => setDeliveryForm(f => ({ ...f, category_id: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
            >
              <option value="">Selecione...</option>
              {categoryList.map(c => (
                <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Necessária</label>
            <input
              type="number"
              min="1"
              value={deliveryForm.quantity}
              onChange={e => setDeliveryForm(f => ({ ...f, quantity: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 50"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Criar Pedido
            </button>
            <button type="button" onClick={() => setShowDeliveryForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderEditDistributionModal() {
    return (
      <ModalOverlay onClose={() => setShowEditDistributionForm(null)} title="Editar Distribuição">
        <form onSubmit={handleEditDistribution} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={distributeForm.category_id}
              disabled
              className="w-full border rounded-lg p-2 bg-gray-100"
            >
              <option value="">Selecione...</option>
              {categoryList.map(c => (
                <option key={c.id} value={c.id}>{c.display_name || c.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">A categoria não pode ser alterada</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              value={distributeForm.quantity}
              onChange={e => setDistributeForm(f => ({ ...f, quantity: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Beneficiário</label>
            <input
              type="text"
              value={distributeForm.recipient_name}
              onChange={e => setDistributeForm(f => ({ ...f, recipient_name: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/RG)</label>
            <input
              type="text"
              value={distributeForm.recipient_document}
              onChange={e => setDistributeForm(f => ({ ...f, recipient_document: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: 123.456.789-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={distributeForm.notes}
              onChange={e => setDistributeForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Família com 5 filhos"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              Salvar Alterações
            </button>
            <button type="button" onClick={() => setShowEditDistributionForm(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }

  function renderAdjustFormModal() {
    return (
      <ModalOverlay onClose={() => setShowAdjustForm(null)} title="Ajustar Quantidade do Pedido">
        <form onSubmit={handleAdjustRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Quantidade</label>
            <input
              type="number"
              min="1"
              value={adjustForm.new_quantity}
              onChange={e => setAdjustForm(f => ({ ...f, new_quantity: e.target.value }))}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              value={adjustForm.reason}
              onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full border rounded-lg p-2"
              placeholder="Ex: Chegaram mais famílias"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Salvar Ajuste
            </button>
            <button type="button" onClick={() => setShowAdjustForm(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </form>
      </ModalOverlay>
    );
  }
}

// ========== REUSABLE COMPONENTS ==========

function StatCard({ title, value, icon, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">{message}</p>
      {actionLabel && (
        <button onClick={onAction} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
