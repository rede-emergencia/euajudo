import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProductInterface } from '../lib/productUtils';
import { useCancel } from '../hooks/useCancel';
import RequestForm from './RequestForm';
import BatchForm from './BatchForm';
import UserStateWidget from './UserStateWidget';
import { getCurrentDomain, getProductInterface, getRoleInterface } from '../lib/interfaces';
import { batches, deliveries, resourceRequests, resourceReservations } from '../lib/api';

/**
 * Generic Dashboard Component
 * Can be configured for any product type and role through domain configuration
 */
export default function GenericDashboard() {
  const { user } = useAuth();
  const { cancelDelivery } = useCancel();
  const [activeTab, setActiveTab] = useState('batches');
  const [myBatches, setMyBatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  
  const domain = getCurrentDomain();
  const userRole = getRoleInterface(user?.role);
  const defaultProduct = getProductInterface('MEAL'); // Default to meals for now
  
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'batches':
          await loadBatches();
          break;
        case 'requests':
          await loadRequests();
          break;
        case 'reservations':
          await loadReservations();
          break;
        case 'deliveries':
          await loadDeliveries();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const response = await batches.getMy();
      setMyBatches(response.data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
      setMyBatches([]);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await resourceRequests.getMy();
      setMyRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      setMyRequests([]);
    }
  };

  const loadReservations = async () => {
    try {
      const response = await resourceReservations.getMy();
      setMyReservations(response.data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setMyReservations([]);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      return;
    }

    try {
      const response = await fetch(`/api/resources/requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Pedido cancelado com sucesso!');
        loadRequests(); // Recarregar a lista
      } else {
        const error = await response.json();
        alert('❌ Erro ao cancelar pedido: ' + (error.detail || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      alert('❌ Erro ao cancelar pedido');
    }
  };

  const loadDeliveries = async () => {
    try {
      const response = await deliveries.list();
      setMyDeliveries(response.data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      setMyDeliveries([]);
    }
  };

  const getStatusColor = (status, productType = 'MEAL') => {
    const colors = {
      'REQUESTING': 'bg-yellow-100 text-yellow-800',
      'RESERVED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'EXPIRED': 'bg-gray-100 text-gray-800',
      'PRODUCING': 'bg-yellow-100 text-yellow-800',
      'READY': 'bg-green-100 text-green-800',
      'PICKED_UP': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status, productType = 'MEAL') => {
    const product = getProductInterface(productType);
    return product.getStatusLabels()[status] || status;
  };

  const renderTabs = () => {
    const tabs = [];
    
    if (userRole?.can('create_batches')) {
      tabs.push(
        <button
          key="batches"
          onClick={() => setActiveTab('batches')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'batches'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {defaultProduct.getEmoji()} Meus Lotes
        </button>
      );
    }

    if (userRole?.can('view_requests')) {
      tabs.push(
        <button
          key="requests"
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 Meus Pedidos
        </button>
      );
    }

    if (userRole?.can('reserve_deliveries')) {
      tabs.push(
        <button
          key="reservations"
          onClick={() => setActiveTab('reservations')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'reservations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🤝 Minhas Reservas
        </button>
      );
    }

    if (userRole?.can('manage_own_deliveries')) {
      tabs.push(
        <button
          key="deliveries"
          onClick={() => setActiveTab('deliveries')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'deliveries'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🚚 Minhas Entregas
        </button>
      );
    }

    return tabs;
  };

  const renderBatches = () => (
    <>
      {showBatchForm && (
        <BatchForm
          productType="MEAL"
          onSuccess={() => {
            setShowBatchForm(false);
            loadBatches();
          }}
          onCancel={() => setShowBatchForm(false)}
        />
      )}
      
      <div className="space-y-4">
        {myBatches.length === 0 && !showBatchForm ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Nenhum lote criado ainda.
            </p>
            <button
              onClick={() => setShowBatchForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              + Criar Novo Lote
            </button>
          </div>
        ) : (
          <>
            {!showBatchForm && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Meus Lotes</h3>
                <button
                  onClick={() => setShowBatchForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  + Novo Lote
                </button>
              </div>
            )}
            
            {myBatches.map((batch) => {
              const product = getProductInterface(batch.product_type);
              return (
                <div key={batch.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">
                        {product.getEmoji()} {product.formatQuantity(batch.quantity || 0)}
                      </h3>
                      <p className="text-sm text-gray-600">{batch.description}</p>
                      <p className="text-sm text-gray-500">
                        Criado em {new Date(batch.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                        {getStatusLabel(batch.status, batch.product_type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="text-gray-700">
                      📍 <strong>Local:</strong> {batch.provider?.address || user?.address}
                      <br />
                      ⏱️ <strong>Expira em:</strong> {batch.expires_at ? new Date(batch.expires_at).toLocaleString('pt-BR') : '4 horas após publicação'}
                    </p>
                  </div>

                  {batch.quantity_available < batch.quantity && (
                    <div className="mt-3">
                      <p className="text-sm text-green-600">
                        ✓ {batch.quantity - batch.quantity_available} {product.getUnitLabel()} já reservadas
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );

  const renderRequests = () => (
    <>
      {showRequestForm && (
        <RequestForm
          productType="MEAL"
          userRole={userRole?.roleName}
          onSuccess={() => {
            setShowRequestForm(false);
            loadRequests();
          }}
          onCancel={() => setShowRequestForm(false)}
        />
      )}
      
      <div className="space-y-4">
        {myRequests.length === 0 && !showRequestForm ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Nenhum pedido criado ainda.
            </p>
            {userRole?.roleName === 'shelter' && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                + Pedir Marmitas
              </button>
            )}
            {userRole?.roleName === 'provider' && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg"
              >
                + Pedir Insumos
              </button>
            )}
          </div>
        ) : (
          <>
            {!showRequestForm && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {userRole?.roleName === 'shelter' ? 'Meus Pedidos de Marmitas' : 'Meus Pedidos de Insumos'}
                </h3>
                {(userRole?.roleName === 'shelter' || userRole?.roleName === 'provider') && (
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className={`px-4 py-2 rounded-lg text-white ${
                      userRole?.roleName === 'shelter' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    + {userRole?.roleName === 'shelter' ? 'Novo Pedido' : 'Pedir Insumos'}
                  </button>
                )}
              </div>
            )}
            
            {myRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      {userRole?.roleName === 'shelter' 
                        ? `Pedido #${request.id} - ${request.quantity_meals} marmitas`
                        : `Pedido #${request.id} - Para ${request.quantity_meals} marmitas`
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      Criado em {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {request.receiving_time && (
                      <p className="text-sm text-gray-600">
                        Horário: {request.receiving_time}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    {userRole?.roleName === 'provider' && request.status === 'REQUESTING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {userRole?.roleName === 'provider' && request.items && request.items.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm mb-2">Insumos necessários:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {request.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-2 rounded text-sm">
                          <span className="font-medium">{item.name}:</span> {item.quantity}{item.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {request.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <strong>Observações:</strong> {request.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );

  const renderReservations = () => (
    <div className="space-y-4">
      {myReservations.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhuma reserva encontrada.
        </p>
      ) : (
        myReservations.map((reservation) => (
          <div key={reservation.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">Reserva #{reservation.id}</h3>
                <p className="text-sm text-gray-600">
                  Pedido #{reservation.request_id} - Status: {reservation.status}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                {getStatusLabel(reservation.status)}
              </span>
            </div>

            <div className="mb-3">
              <h4 className="font-semibold text-sm mb-2">Itens para comprar:</h4>
              <div className="space-y-1">
                {(reservation.request?.items || [])?.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    {item.name}: {item.quantity} {item.unit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDeliveries = () => (
    <div className="space-y-4">
      {myDeliveries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhuma entrega encontrada.
        </p>
      ) : (
        myDeliveries.map((delivery) => {
          const product = getProductInterface(delivery.product_type);
          return (
            <div key={delivery.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold">Entrega #{delivery.id}</h3>
                  <div className="bg-blue-50 px-3 py-1 rounded-lg mt-1 inline-block">
                    <span className="text-2xl font-bold text-blue-900">{delivery.quantity}</span>
                    <span className="text-sm text-blue-700 ml-1">{product.getUnitLabel()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    📍 De: {delivery.batch?.provider?.name || 'Fornecedor'}
                  </p>
                  <p className="text-sm text-gray-500">
                    📍 Para: {delivery.location?.name || 'Destino'}
                  </p>
                  
                  {/* Códigos de Confirmação */}
                  {delivery.pickup_code && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-green-800 mb-1">📋 Códigos de Confirmação:</p>
                      <p className="text-sm text-green-700">
                        <strong>Retirada:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{delivery.pickup_code}</span>
                      </p>
                      {delivery.delivery_code && (
                        <p className="text-sm text-green-700 mt-1">
                          <strong>Entrega:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{delivery.delivery_code}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                  {getStatusLabel(delivery.status)}
                </span>
              </div>
              
              {/* Botões de Ação */}
              {(delivery.status === 'PENDING_CONFIRMATION' || delivery.status === 'RESERVED') && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={async () => {
                      const result = await cancelDelivery(delivery.id, {
                        onSuccess: () => {
                          alert('✅ Entrega cancelada com sucesso!');
                          loadDeliveries();
                        },
                        onError: (result) => {
                          alert('❌ Erro ao cancelar: ' + result.message);
                        }
                      });
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    ❌ Cancelar Entrega
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) return <p className="text-gray-500 text-center py-6">Carregando...</p>;

    switch (activeTab) {
      case 'batches':
        return renderBatches();
      case 'requests':
        return renderRequests();
      case 'reservations':
        return renderReservations();
      case 'deliveries':
        return renderDeliveries();
      default:
        return <p className="text-gray-500 text-center py-6">Selecione uma aba</p>;
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 max-w-6xl mx-auto" style={{ paddingTop: '100px' }}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {domain.displayName}
          </h1>
          <p className="text-gray-600">
            Bem-vindo, {user?.name} - {userRole?.getDisplayName()}
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          {renderTabs()}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    
    {/* Widget de Estado do Usuário */}
    <UserStateWidget position="bottom-left" size="medium" />
    </>
  );
}
