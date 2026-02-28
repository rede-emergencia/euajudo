import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pedidosInsumo, reservasInsumo, locaisProducao, lotesMarmita, batches } from '../lib/api';
import { BatchStatus, display, colorClass } from '../shared/enums';
import Header from '../components/Header';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [myRequests, setMyRequests] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [myPickups, setMyPickups] = useState([]); // Retiradas dos meus lotes
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCreateBatchForm, setShowCreateBatchForm] = useState(false);
  const [formData, setFormData] = useState({
    quantity_meals: '',
    items: [{ name: '', quantity: '', unit: 'kg' }]
  });
  const [batchForm, setBatchForm] = useState({
    quantity: '',
    description: '',
    pickupDeadline: ''
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [batchToCancel, setBatchToCancel] = useState(null);
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pedidos') {
        try {
          const response = await pedidosInsumo.getMy();
          setMyRequests(response.data || []);
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
          setMyRequests([]);
        }
      } else if (activeTab === 'ofertas') {
        try {
          const batchesResp = await lotesMarmita.getMy();
          // Filter out cancelled batches
          const activeBatches = (batchesResp.data || []).filter(b => b.status !== 'cancelled');
          setMyBatches(activeBatches);
        } catch (error) {
          console.error('Erro ao carregar ofertas:', error);
          setMyBatches([]);
        }
      } else if (activeTab === 'retiradas') {
        try {
          // Carregar retiradas dos meus lotes
          console.log('🔍 [DEBUG] Iniciando carregamento de retiradas...');
          console.log('🔍 [DEBUG] Token:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
          
          const response = await fetch('/api/deliveries/my-deliveries', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('🔍 [DEBUG] Response status:', response.status);
          console.log('🔍 [DEBUG] Response ok:', response.ok);
          
          if (response.ok) {
            const retiradas = await response.json();
            console.log('🔍 [DEBUG] Retiradas recebidas:', retiradas);
            console.log('🔍 [DEBUG] Quantidade de retiradas:', retiradas.length);
            
            retiradas.forEach((r, index) => {
              console.log(`🔍 [DEBUG] Retirada ${index + 1}:`, {
                id: r.id,
                status: r.status,
                pickup_code: r.pickup_code,
                quantity: r.quantity,
                volunteer: r.volunteer?.name,
                location: r.location?.name
              });
            });
            
            setMyPickups(retiradas);
            console.log('🔍 [DEBUG] Estado myPickups atualizado');
          } else {
            const errorText = await response.text();
            console.error('🔍 [DEBUG] Erro na resposta:', response.status, errorText);
            setMyPickups([]);
          }
        } catch (error) {
          console.error('🔍 [DEBUG] Erro no fetch:', error);
          setMyPickups([]);
        }
      }
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async (deliveryId) => {
    if (!confirm('Are you sure you want to confirm this pickup? The volunteer is already at the location.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/deliveries/${deliveryId}/confirm-pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error confirming pickup');
      }

      showAlert('Sucesso', '✅ Pickup confirmed successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      showAlert('Erro', '❌ Error: ' + error.message, 'error');
    }
  };

  const handleCancelPickup = async (deliveryId) => {
    if (!confirm('Are you sure you want to cancel this pickup? The meals will be returned to available stock.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error canceling pickup');
      }

      const result = await response.json();
      const quantityReturned = result.quantity_returned || result.quantity || 0;
      
      showAlert('Sucesso', `✅ Pickup canceled successfully!\n📦 ${quantityReturned} meals returned to stock.`, 'success');
      loadData();
    } catch (error) {
      console.error('Error canceling pickup:', error);
      showAlert('Erro', '❌ Error: ' + error.message, 'error');
    }
  };

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { name: '', quantity: '', unit: 'kg' }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quantity_meals: parseInt(formData.quantity_meals),
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: item.unit
        }))
      };
      await pedidosInsumo.create(payload);
      showAlert('Sucesso', '✅ Pedido de insumos criado com sucesso!', 'success');
      setShowForm(false);
      setFormData({ quantity_meals: '', items: [{ name: '', quantity: '', unit: 'kg' }] });
      loadData();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      showAlert('Erro', '❌ Erro ao criar pedido: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_type: "meal",
        quantity: parseInt(batchForm.quantity),
        description: batchForm.description,
        donated_ingredients: true,
        pickup_deadline: batchForm.pickupDeadline
      };
      await batches.create(payload);
      showAlert('Sucesso', '✅ Marmitas publicadas com sucesso! Disponíveis para retirada por 4 horas.', 'success');
      setShowCreateBatchForm(false);
      setBatchForm({ quantity: '', description: '', pickupDeadline: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao publicar marmitas:', error);
      showAlert('Erro', '❌ Erro ao publicar: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCancelBatch = (batchId) => {
    const batch = myBatches.find(b => b.id === batchId);
    if (batch && batch.quantidade_reservada > 0) {
      showAlert('Erro', '❌ Cannot cancel: reservations already exist for this batch.', 'error');
      return;
    }
    setBatchToCancel(batchId);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!batchToCancel) return;
    
    try {
      await lotesMarmita.cancel(batchToCancel);
      setShowCancelModal(false);
      setBatchToCancel(null);
      loadData();
    } catch (error) {
      console.error('Error canceling batch:', error);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }
    
    try {
      await pedidosInsumo.cancel(requestId);
      showAlert('Sucesso', '✅ Request canceled successfully!', 'success');
      loadData();
    } catch (error) {
      console.error('Error canceling request:', error);
      showAlert('Erro', '❌ Error canceling: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const getStatusColor = (status) => colorClass('OrderStatus', status) || colorClass('BatchStatus', status);
  const getStatusLabel = (status) => display('OrderStatus', status) || display('BatchStatus', status);

  if (loading) return (
    <>
      <Header />
      <div style={{ paddingTop: '100px' }} className="p-4">Carregando...</div>
    </>
  );

  return (
    <>
      <Header />
      <div className="p-6 max-w-6xl mx-auto" style={{ paddingTop: '100px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Fornecedor</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie seus pedidos e produções</p>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'pedidos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          � Pedidos
        </button>
        <button
          onClick={() => setActiveTab('ofertas')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'ofertas'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🍽️ Ofertas
        </button>
        <button
          onClick={() => setActiveTab('retiradas')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'retiradas'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🚚 Retiradas
        </button>
      </div>

      {activeTab === 'pedidos' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : '+ Novo Pedido'}
          </button>
        </div>
      )}

      {activeTab === 'ofertas' && (
        <div className="flex justify-end mb-4">
          {/* Verificar se há lote ativo (status não é 'delivered' ou 'cancelled') */}
          {(() => {
            const temLoteAtivo = myBatches.some(lote =>
              lote.status !== BatchStatus.COMPLETED && lote.status !== BatchStatus.CANCELLED
            );
            
            if (temLoteAtivo) {
              return (
                <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                  📦 Você já tem uma oferta ativa
                </div>
              );
            }
            
            return (
              <button
                onClick={() => setShowCreateBatchForm(!showCreateBatchForm)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {showCreateBatchForm ? 'Cancelar' : '+ Nova Oferta'}
              </button>
            );
          })()}
        </div>
      )}

      {activeTab === 'pedidos' && showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Criar Novo Pedido</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Quantidade de Marmitas a Produzir
              </label>
              <input
                type="number"
                value={formData.quantity_meals}
                onChange={(e) => setFormData({ ...formData, quantity_meals: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                required
                min="1"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Insumos Necessários</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Adicionar Item
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nome (ex: Arroz)"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="flex-1 border rounded-lg px-4 py-2"
                    required
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Quantidade"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-32 border rounded-lg px-4 py-2"
                    required
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-24 border rounded-lg px-4 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                  </select>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Criar Pedido
            </button>
          </form>
        </div>
      )}

      
      {activeTab === 'ofertas' && showCreateBatchForm && !myBatches.some(lote => lote.status !== BatchStatus.COMPLETED && lote.status !== BatchStatus.CANCELLED) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Nova Oferta de Marmitas</h2>
          <p className="text-sm text-gray-600 mb-4">
            📍 Local: {user?.endereco || 'Seu endereço cadastrado'}<br/>
            ⏱️ Disponível por: 4 horas (expira automaticamente)
          </p>
          <form onSubmit={handleCreateBatch}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Quantidade de Marmitas Disponíveis</label>
              <input
                type="number"
                value={batchForm.quantity}
                onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                required
                min="1"
                placeholder="Ex: 50"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                value={batchForm.description}
                onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                rows="3"
                placeholder="Ex: Marmitas com arroz, feijão, carne e salada. Aquecidas e prontas para consumo."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Horário Limite para Retirada</label>
              <input
                type="time"
                value={batchForm.pickupDeadline}
                onChange={(e) => setBatchForm({ ...batchForm, pickupDeadline: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                As marmitas estarão disponíveis até este horário ou por 4 horas (o que vier primeiro).
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Publicar Oferta
            </button>
          </form>
        </div>
      )}

      {activeTab === 'pedidos' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Meus Pedidos</h2>
        
        {myRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum pedido criado ainda. Clique em "Novo Pedido" para começar.
          </p>
        ) : (
          <div className="space-y-4">
            {myRequests.map((pedido) => (
              <div key={pedido.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      Pedido #{pedido.id} - {pedido.quantity_meals || pedido.quantidade_marmitas} marmitas
                    </h3>
                    <p className="text-sm text-gray-600">
                      Criado em {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.status)}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                    {(pedido.status === 'REQUESTING' || pedido.status === 'DISPONIVEL') && (
                      <button
                        onClick={() => handleCancelRequest(pedido.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        title="Cancelar pedido"
                      >
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="font-semibold text-sm mb-2">Insumos:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(pedido.items || pedido.itens)?.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-2 rounded text-sm">
                        <span className="font-medium">{item.name || item.nome}:</span> {item.quantity || item.quantidade}{item.unit || item.unidade}
                        {(item.quantity_reserved || item.quantidade_reservada) > 0 && (
                          <span className="text-blue-600 ml-2">
                            ({item.quantity_reserved || item.quantidade_reservada} reservado)
                          </span>
                        )}
                        {(item.quantity_delivered || item.quantidade_entregue) > 0 && (
                          <span className="text-green-600 ml-2">
                            ({item.quantity_delivered || item.quantidade_entregue} entregue ✓)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(pedido.status === 'RESERVED' || pedido.status === 'reservado_completo') && pedido.confirmation_code && (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-3">
                    <h4 className="font-bold text-sm mb-2 text-yellow-800">🔑 Código de Confirmação</h4>
                    <p className="text-xs text-yellow-700 mb-2">
                      Forneça este código ao voluntário quando ele entregar os insumos:
                    </p>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <span className="text-3xl font-mono font-bold tracking-widest text-yellow-800">
                        {pedido.confirmation_code}
                      </span>
                    </div>
                  </div>
                )}

                {(pedido.reservations || pedido.reservas)?.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2">Reservas:</h4>
                    <div className="space-y-2">
                      {(pedido.reservations || pedido.reservas).map((reserva) => (
                        <div key={reserva.id} className="bg-blue-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="text-sm font-medium">Voluntário: {reserva.volunteer?.name || reserva.voluntario?.name || `ID ${reserva.volunteer_id || reserva.voluntario_id}`}</span>
                              <span className="text-xs text-gray-600 ml-2">Status: {reserva.status}</span>
                            </div>
                          </div>
                          {reserva.status === 'RESERVED' && (
                            <div>
                              <p className="text-xs text-gray-600 mb-2">
                                Aguardando voluntário comprar e entregar os insumos
                              </p>
                            </div>
                          )}
                          {reserva.status === 'COMPLETED' && (
                            <span className="text-xs text-green-600 font-medium">✓ Insumos recebidos</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {activeTab === 'ofertas' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Minhas Ofertas</h2>
          
          {myBatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma oferta publicada ainda. Clique em "Nova Oferta" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {myBatches.map((lote) => (
                <div key={lote.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">
                        {lote.quantity || lote.quantidade} marmitas disponíveis
                      </h3>
                      <p className="text-sm text-gray-600">{lote.description || lote.descricao}</p>
                      <p className="text-sm text-gray-500">
                        Publicado em {new Date(lote.created_at).toLocaleString('pt-BR')}
                      </p>
                      {lote.pickup_deadline && (
                        <p className="text-sm text-blue-600">
                          ⏰ Retirada até: {lote.pickup_deadline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass('BatchStatus', lote.status)}`}>
                        {display('BatchStatus', lote.status)}
                      </span>
                      {(!lote.quantity_available || lote.quantity_available === lote.quantity) && (
                        <button
                          onClick={() => handleCancelBatch(lote.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          title="Cancelar oferta"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="text-gray-700">
                      📍 <strong>Local:</strong> {lote.provider?.address || user?.address || 'Endereço do fornecedor'}<br/>
                      ⏱️ <strong>Expira em:</strong> {lote.expires_at ? new Date(lote.expires_at).toLocaleString('pt-BR') : '4 horas após publicação'}
                    </p>
                  </div>

                  {lote.quantity_available < lote.quantity && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600">
                        ✓ {lote.quantity - lote.quantity_available} marmitas já reservadas
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'retiradas' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">🚚 Manage Pickups</h2>
          
          
          {myPickups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pickups scheduled yet.
            </p>
          ) : (
            <div className="space-y-4">
              {myPickups.map((retirada) => {
                return (
                <div key={retirada.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">
                        Pickup #{retirada.id} - {retirada.quantity} marmitas
                      </h3>
                      <p className="text-sm text-gray-600">
                        Volunteer: {retirada.volunteer?.name || `ID ${retirada.volunteer_id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {retirada.location?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 {retirada.location?.address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass('DeliveryStatus', retirada.status)}`}>
                      {display('DeliveryStatus', retirada.status)}
                    </span>
                  </div>
                  
                  {retirada.status === 'reserved' && (
                    <>
                      <div className="bg-yellow-50 p-3 rounded text-sm mb-3">
                        <p className="text-yellow-800">
                          ⏳ Waiting for volunteer to pick up the meals...
                        </p>
                      </div>
                      
                      {retirada.pickup_code ? (
                        <>
                          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 mb-3">
                            <h4 className="font-bold text-sm mb-2 text-orange-800">🔑 Pickup Code</h4>
                            <p className="text-xs text-orange-700 mb-2">
                              Provide this code to the volunteer to confirm pickup:
                            </p>
                            <div className="bg-white rounded-lg p-3 text-center">
                              <span className="text-3xl font-mono font-bold tracking-widest text-orange-800">
                                {retirada.pickup_code}
                              </span>
                            </div>
                            <p className="text-xs text-orange-600 mt-2 text-center">
                              Volunteer: {retirada.volunteer?.name || `ID ${retirada.volunteer_id}`}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="bg-red-50 p-3 rounded text-sm mb-3">
                          <p className="text-red-800">
                            ⚠️ Pickup code not found!
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleConfirmPickup(retirada.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ✅ Confirm Pickup
                        </button>
                        <button
                          onClick={() => handleCancelPickup(retirada.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ❌ Cancel Pickup
                        </button>
                      </div>
                    </>
                  )}
                  
                  {retirada.status === 'picked_up' && (
                    <>
                      <div className="bg-blue-50 p-3 rounded text-sm mb-3">
                        <p className="text-blue-800">
                          🚚 Volunteer has picked up! Waiting for delivery to the shelter.
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
                        <h4 className="font-bold text-sm mb-2 text-orange-800">🔑 Delivery Code</h4>
                        <p className="text-xs text-orange-700 mb-2">
                          Provide this code to the volunteer to confirm delivery to the shelter:
                        </p>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <span className="text-3xl font-mono font-bold tracking-widest text-orange-800">
                            {retirada.delivery_code || 'SEM CÓDIGO'}
                          </span>
                        </div>
                        <p className="text-xs text-orange-600 mt-2 text-center">
                          Volunteer: {retirada.volunteer?.name || `ID ${retirada.volunteer_id}`}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {retirada.status === 'delivered' && (
                    <div className="bg-green-50 p-3 rounded text-sm">
                      <p className="text-green-800">
                        ✅ Delivery completed successfully!
                      </p>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">❌ Cancel Offer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this meal offer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setBatchToCancel(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={confirmCancellation}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        show={alert.show}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
