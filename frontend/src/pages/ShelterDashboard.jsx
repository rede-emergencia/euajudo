import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resourceRequests } from '../lib/api';
import { OrderStatus, display, colorClass } from '../shared/enums';
import Header from '../components/Header';

export default function ShelterDashboard() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    startTime: '',
    endTime: '',
  });
  const [savingOrder, setSavingOrder] = useState(false);
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState(false);
  const [deliveryToConfirm, setDeliveryToConfirm] = useState(null);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [pedidoAtivo, setPedidoAtivo] = useState([]);
  const [showConfirmarEntregaModal, setShowConfirmarEntregaModal] = useState(false);
  const [entregaParaConfirmar, setEntregaParaConfirmar] = useState(null);
  const [codigoEntrega, setCodigoEntrega] = useState('');
  const [showFormPedido, setShowFormPedido] = useState(false);
  const [formPedido, setFormPedido] = useState({
    product_type: 'meal',
    quantity: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [productTypes, setProductTypes] = useState([]);

  useEffect(() => {
    loadPedidos();
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/product-config/');
      if (response.ok) {
        const types = await response.json();
        setProductTypes(types);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de produto:', error);
    }
  };

  const getToken = () => localStorage.getItem('token');

  const loadPedidos = async () => {
    setLoadingPedidos(true);
    try {
      // Carregar pedidos de recursos deste abrigo
      const response = await fetch('/api/resources/requests/my', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPedidoAtivo(data);
      } else {
        setPedidoAtivo([]);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidoAtivo([]);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const handleCriarPedido = async () => {
    const selectedProduct = productTypes.find(p => p.product_type === formPedido.product_type);
    
    if (!formPedido.quantity || !formPedido.startTime || !formPedido.endTime) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (selectedProduct.requires_description && !formPedido.description) {
      alert('Descreva os detalhes do pedido');
      return;
    }

    setSalvandoPedido(true);
    try {
      const response = await fetch('/api/resources/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          quantity_meals: parseInt(formPedido.quantity),
          receiving_time: new Date().toISOString(),
          items: [{
            name: selectedProduct.name,
            quantity: parseInt(formPedido.quantity),
            unit: selectedProduct.unit_label
          }]
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erro ao criar pedido');
      }

      alert('Pedido criado com sucesso!');
      setShowFormPedido(false);
      setFormPedido({
        product_type: 'meal',
        quantity: '',
        startTime: '',
        endTime: '',
        description: '',
      });
      loadPedidos();
    } catch (error) {
      alert(error.message);
    } finally {
      setSalvandoPedido(false);
    }
  };

  const handleCancelarPedido = async (pedidoId) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;

    try {
      const response = await fetch(`/api/resources/requests/${pedidoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erro ao cancelar pedido');
      }

      alert('Pedido cancelado com sucesso!');
      loadPedidos();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAbrirConfirmarEntrega = (entregaId) => {
    setEntregaParaConfirmar(entregaId);
    setCodigoEntrega('');
    setShowConfirmarEntregaModal(true);
  };

  const confirmarRecebimento = async () => {
    if (!codigoEntrega || codigoEntrega.length !== 6) {
      alert('Digite o código de 6 dígitos');
      return;
    }

    try {
      const response = await fetch(
        `/api/deliveries/${entregaParaConfirmar}/confirm-delivery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ delivery_code: codigoEntrega }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erro ao confirmar recebimento');
      }

      alert('Recebimento confirmado com sucesso!');
      setShowConfirmarEntregaModal(false);
      setEntregaParaConfirmar(null);
      setCodigoEntrega('');
      loadPedidos();
    } catch (error) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass('OrderStatus', status)}`}>
      {display('OrderStatus', status)}
    </span>
  );

  const getStatusActions = (pedido) => {
    if (!pedido) return null;
    
    const status = String(pedido.status);

    if (status === 'requesting') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleCancelarPedido(pedido.id)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Cancelar Pedido
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Header />
      <div className="p-6 max-w-6xl mx-auto" style={{ paddingTop: '100px' }}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Abrigo</h1>
          <p className="text-gray-600">Bem-vindo, {user?.nome}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Meus Pedidos</h2>
            <button
              onClick={() => setShowFormPedido(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + Novo Pedido
            </button>
          </div>

          {loadingPedidos ? (
            <p className="text-gray-500 text-center py-6">Carregando...</p>
          ) : pedidoAtivo && pedidoAtivo.length > 0 ? (
            <div className="space-y-4">
              {pedidoAtivo.map((pedido) => (
                <div key={pedido.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Pedido #{pedido.id}</h3>
                      <div className="bg-blue-50 px-3 py-1 rounded-lg inline-block mt-1">
                        <span className="text-2xl font-bold text-blue-900">{pedido.quantity_meals}</span>
                        <span className="text-sm text-blue-700 ml-1">
                          {pedido.items?.[0]?.unit || 'marmitas'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-semibold">{display('OrderStatus', pedido.status)}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Criado em: {new Date(pedido.created_at).toLocaleString('pt-BR')}
                      </p>
                      {pedido.receiving_time && (
                        <p className="text-sm text-gray-500">
                          Horário desejado: {new Date(pedido.receiving_time).toLocaleString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(pedido.status)}
                  </div>

                  {pedido.items && pedido.items.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <h4 className="font-semibold text-sm mb-2">Itens solicitados:</h4>
                      {pedido.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {item.quantity} {item.unit} de {item.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {getStatusActions(pedido)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Você não tem nenhum pedido no momento.</p>
              <button
                onClick={() => setShowFormPedido(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Criar Primeiro Pedido
              </button>
            </div>
          )}
        </div>

        {showConfirmarEntregaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Confirmar Recebimento</h3>
              <p className="text-gray-600 mb-4">
                Digite o código de 6 dígitos que o voluntário tem para confirmar o recebimento.
              </p>
              <input
                type="text"
                maxLength="6"
                value={codigoEntrega}
                onChange={(e) => setCodigoEntrega(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmarEntregaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRecebimento}
                  disabled={codigoEntrega.length !== 6}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    codigoEntrega.length === 6 ? 'bg-green-600' : 'bg-gray-400'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Criar Pedido */}
        {showFormPedido && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Fazer Pedido</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Produto *
                  </label>
                  <select
                    value={formPedido.product_type}
                    onChange={(e) => setFormPedido({...formPedido, product_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {productTypes.map((type) => (
                      <option key={type.product_type} value={type.product_type}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade ({productTypes.find(p => p.product_type === formPedido.product_type)?.unit_label || 'unidades'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPedido.quantity}
                    onChange={(e) => setFormPedido({...formPedido, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário Início Desejado *
                  </label>
                  <input
                    type="time"
                    value={formPedido.startTime}
                    onChange={(e) => setFormPedido({...formPedido, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário Fim Desejado *
                  </label>
                  <input
                    type="time"
                    value={formPedido.endTime}
                    onChange={(e) => setFormPedido({...formPedido, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {productTypes.find(p => p.product_type === formPedido.product_type)?.requires_description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição *
                    </label>
                    <textarea
                      value={formPedido.description}
                      onChange={(e) => setFormPedido({...formPedido, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Descreva detalhes do seu pedido..."
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowFormPedido(false);
                    setFormPedido({
                      product_type: 'meal',
                      quantity: '',
                      startTime: '',
                      endTime: '',
                      description: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarPedido}
                  disabled={salvandoPedido}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvandoPedido ? 'Criando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
