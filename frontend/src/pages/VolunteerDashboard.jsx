import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pedidosInsumo, reservasInsumo, reservasMarmita, locaisProducao } from '../lib/api';
import { display, colorClass } from '../shared/enums';
import { getProductInfo, getProductText, getProviderText, getProductAction, getProductLocation } from '../lib/productUtils';
import Header from '../components/Header';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('entregas');
  const [myReservations, setMyReservations] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);
  const [minhasEntregas, setMinhasEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [showCodigoRetiradaModal, setShowCodigoRetiradaModal] = useState(false);
  const [showCodigoEntregaModal, setShowCodigoEntregaModal] = useState(false);
  const [showCancelarEntregaModal, setShowCancelarEntregaModal] = useState(false);
  const [entregaParaCancelar, setEntregaParaCancelar] = useState(null);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
  const [entregaSelecionada, setEntregaSelecionada] = useState(null);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');
  const [codigoRetirada, setCodigoRetirada] = useState('');
  const [codigoEntrega, setCodigoEntrega] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'doacoes') {
        try {
          const reservas = await reservasInsumo.list();
          setMinhasReservas(reservas.data || []);
        } catch (error) {
          console.error('Erro ao carregar reservas:', error);
          setMinhasReservas([]);
        }
      } else if (activeTab === 'entregas') {
        try {
          const response = await fetch('/api/deliveries/my-deliveries', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            setMinhasEntregas(await response.json());
          } else {
            setMinhasEntregas([]);
          }
        } catch (error) {
          console.error('Erro ao carregar entregas:', error);
          setMinhasEntregas([]);
        }
      }
    } catch (error) {
      console.error('Erro geral no loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    if (!confirm('Deseja realmente cancelar esta reserva?')) {
      return;
    }
    
    try {
      await reservasInsumo.cancel(reservaId);
      alert('✅ Reserva cancelada com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      alert('❌ Erro ao cancelar: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMarcarEntrega = async (reservaId) => {
    setReservaSelecionada(reservaId);
    setCodigoConfirmacao('');
    setShowCodigoModal(true);
  };

  const confirmarEntrega = async () => {
    if (!codigoConfirmacao || codigoConfirmacao.length !== 6) {
      alert('❌ Por favor, digite o código de 6 dígitos');
      return;
    }
    
    try {
      await reservasInsumo.marcarEntrega(reservaSelecionada, codigoConfirmacao);
      alert('✅ Entrega confirmada com sucesso! Obrigado por sua contribuição!');
      setShowCodigoModal(false);
      setReservaSelecionada(null);
      setCodigoConfirmacao('');
      loadData();
    } catch (error) {
      console.error('Erro ao marcar entrega:', error);
      alert('❌ Erro ao marcar entrega: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleConfirmarEntregaInsumo = async (reservaId) => {
    try {
      await reservasInsumo.confirmarEntrega(reservaId);
      alert('✅ Entrega de insumos confirmada pelo fornecedor!');
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleReservarMarmitas = async (pedidoId, quantidade, localEntregaId = 1) => {
    try {
      await reservasMarmita.create({
        pedido_marmita_id: pedidoId,
        local_entrega_id: localEntregaId,
        quantidade: parseInt(quantidade)
      });

      alert('✅ Entrega de marmitas reservada!');
      loadData();
    } catch (error) {
      console.error('Erro ao reservar entrega:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    }
  };

  
  const handleConfirmarRetirada = (entregaId) => {
    setEntregaSelecionada(entregaId);
    setCodigoRetirada('');
    setShowCodigoRetiradaModal(true);
  };

  const confirmarRetiradaMarmitas = async () => {
    if (!codigoRetirada || codigoRetirada.length !== 6) {
      alert('❌ Por favor, digite o código de 6 dígitos');
      return;
    }
    
    try {
      const response = await fetch(`/api/deliveries/${entregaSelecionada}/confirm-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ pickup_code: codigoRetirada })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao confirmar retirada');
      }

      const entrega = await response.json();
      alert(`✅ Retirada confirmada!\nAgora você pode iniciar a entrega.`);
      setShowCodigoRetiradaModal(false);
      setEntregaSelecionada(null);
      setCodigoRetirada('');
      loadData();
    } catch (error) {
      console.error('Erro ao confirmar retirada:', error);
      alert('❌ Erro: ' + error.message);
    }
  };

  const handleConfirmarEntrega = (entregaId) => {
    setEntregaSelecionada(entregaId);
    setCodigoEntrega('');
    setShowCodigoEntregaModal(true);
  };

  const confirmarEntregaMarmitas = async () => {
    if (!codigoEntrega || codigoEntrega.length !== 6) {
      alert('❌ Por favor, digite o código de 6 dígitos');
      return;
    }
    
    try {
      const response = await fetch(`/api/deliveries/${entregaSelecionada}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ delivery_code: codigoEntrega })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao confirmar entrega');
      }

      alert('✅ Entrega confirmada com sucesso! Obrigado por sua contribuição!');
      setShowCodigoEntregaModal(false);
      setEntregaSelecionada(null);
      setCodigoEntrega('');
      loadData();
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      alert('❌ Erro: ' + error.message);
    }
  };

  const handleCancelarEntrega = (entregaId) => {
    setEntregaParaCancelar(entregaId);
    setShowCancelarEntregaModal(true);
  };

  const confirmarCancelamentoEntrega = async () => {
    if (!entregaParaCancelar) return;
    
    try {
      const response = await fetch(`/api/deliveries/${entregaParaCancelar}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao cancelar entrega');
      }

      alert('✅ Entrega cancelada com sucesso!');
      setShowCancelarEntregaModal(false);
      setEntregaParaCancelar(null);
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar entrega:', error);
      alert('❌ Erro ao cancelar: ' + error.message);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Voluntário</h1>
        <p className="text-gray-600">Bem-vindo, {user?.nome}</p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setActiveTab('doacoes')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'doacoes'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          💝 Doações
        </button>
        <button
          onClick={() => setActiveTab('entregas')}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === 'entregas'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🚚 Minhas Entregas
        </button>
      </div>

      {activeTab === 'doacoes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">💝 Minhas Doações de Insumos</h2>
            {minhasReservas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Você ainda não tem reservas</p>
            ) : (
              <div className="space-y-4">
                {minhasReservas.map((reserva) => (
                  <div key={reserva.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">Reserva #{reserva.id}</h3>
                        <p className="text-sm text-gray-600">
                          Pedido #{reserva.pedido_id} - Status: {reserva.status}
                        </p>
                      </div>
                      {reserva.status === 'ATIVA' || reserva.status === 'ativa' ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                          Aguardando Compra
                        </span>
                      ) : reserva.status === 'ENTREGUE' || reserva.status === 'entregue' ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          Entregue ✓
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                          {reserva.status}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <h4 className="font-semibold text-sm mb-2">Itens para comprar:</h4>
                      <div className="space-y-1">
                        {(reserva.request?.items || reserva.pedido?.itens)?.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            {item.name || item.nome}: {item.quantity || item.quantidade} {item.unit || item.unidade}
                          </div>
                        ))}
                      </div>
                    </div>

                    {(reserva.status === 'RESERVED' || reserva.status === 'ATIVA' || reserva.status === 'ativa') && (
                      <>
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded mb-3">
                          💡 <strong>Entregar em:</strong> {reserva.request?.provider?.name || reserva.pedido?.provider?.name}
                          <br />
                          📍 <strong>Endereço:</strong> {reserva.request?.provider?.address || reserva.pedido?.provider?.address}
                          <br />
                          📞 <strong>Telefone:</strong> {reserva.request?.provider?.phone || reserva.pedido?.provider?.phone}
                          <br />
                          ⏰ <strong>Horário de recebimento:</strong> {reserva.request?.receiving_time || reserva.pedido?.horario_recebimento || 'A combinar'}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarcarEntrega(reserva.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            ✅ Marcar como Entregue
                          </button>
                          <button
                            onClick={() => handleCancelarReserva(reserva.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            ❌ Cancelar Reserva
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entregas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              🚚 Minhas Entregas
              {minhasEntregas.length > 0 && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({minhasEntregas.map(e => getProductInfo(e.product_type).icon).join(' ')})
                </span>
              )}
            </h2>
            {minhasEntregas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Você ainda não aceitou nenhuma entrega.
                <br />
                Vá ao mapa e clique em "Reservar para Entrega" em fornecedores com produtos disponíveis.
              </p>
            ) : (
              <div className="space-y-4">
                {minhasEntregas.map((entrega) => {return (
                  <div key={entrega.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">Entrega #{entrega.id}</h3>
                        <div className="bg-blue-50 px-3 py-1 rounded-lg mt-1 inline-block">
                          <span className="text-2xl font-bold text-blue-900">{entrega.quantity}</span>
                          <span className="text-sm text-blue-700 ml-1">
                            {getProductInfo(entrega.product_type).pluralName.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          📍 De: {entrega.batch?.provider?.name || entrega.lote?.provider?.name || 'Restaurante'}
                        </p>
                        <p className="text-sm text-gray-500">
                          📍 Para: {entrega.location?.name || entrega.local?.nome || 'Abrigo'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass('DeliveryStatus', entrega.status)}`}>
                        {display('DeliveryStatus', entrega.status)}
                      </span>
                    </div>

                    {/* Status: reserved - Precisa confirmar retirada com código do fornecedor */}
                    {entrega.status === 'reserved' && (
                      <div className="space-y-3">
                        <div className="bg-yellow-50 p-3 rounded text-sm">
                          <p className="font-semibold text-yellow-800 mb-2">📋 Próximo passo:</p>
                          <p className="text-yellow-700">
                            Vá à <strong>{getProductLocation(entrega.product_type)}</strong> <strong>{entrega.batch?.provider?.name || entrega.lote?.provider?.name}</strong> e {getProductAction(entrega.product_type)}.
                            <br />
                            📍 {entrega.batch?.provider?.address || entrega.lote?.provider?.address}
                            <br />
                            ⏰ Prazo: 24 horas após compromisso
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelarEntrega(entrega.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ❌ Cancelar Entrega
                        </button>
                        <button
                          onClick={() => handleConfirmarRetirada(entrega.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ✅ Confirmar Retirada (digite código do fornecedor)
                        </button>
                      </div>
                    )}

                    {/* Status: picked_up - Em rota de entrega */}
                    {entrega.status === 'picked_up' && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                          <p className="font-semibold mb-2">🚚 Retirada confirmada!</p>
                          <p>Você já {getProductAction(entrega.product_type)}. Agora entregue no abrigo e confirme com o código do local.</p>
                          <p className="text-xs mt-2">
                            <strong>Código da entrega:</strong> {entrega.delivery_code}
                          </p>
                        </div>
                        <button
                          onClick={() => handleConfirmarEntrega(entrega.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ✅ Confirmar Entrega (digite código do abrigo)
                        </button>
                        <button
                          onClick={() => handleCancelarEntrega(entrega.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ❌ Cancelar Entrega
                        </button>
                      </div>
                    )}

                    {/* Status: delivered - Concluído */}
                    {entrega.status === 'delivered' && (
                      <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                        ✅ Entrega concluída com sucesso! Obrigado por sua contribuição! 🎉
                      </div>
                    )}

                    {/* Fallback - Mostrar botões para qualquer status não entregue */}
                    {entrega.status !== 'delivered' && entrega.status !== 'reserved' && entrega.status !== 'picked_up' && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p className="font-semibold text-gray-800 mb-2">Status: {entrega.status}</p>
                        </div>
                        <button
                          onClick={() => handleConfirmarRetirada(entrega.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ✅ Confirmar Retirada (digite código do fornecedor)
                        </button>
                        <button
                          onClick={() => handleCancelarEntrega(entrega.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          ❌ Cancelar Entrega
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Código - Doações */}
      {showCodigoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirmar Entrega de Doação</h3>
            <p className="text-gray-600 mb-4">
              Digite o código de 6 dígitos fornecido pelo restaurante/cozinha para confirmar a entrega dos insumos.
            </p>
            <input
              type="text"
              maxLength="6"
              value={codigoConfirmacao}
              onChange={(e) => setCodigoConfirmacao(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodigoModal(false);
                  setReservaSelecionada(null);
                  setCodigoConfirmacao('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEntrega}
                disabled={codigoConfirmacao.length !== 6}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  codigoConfirmacao.length === 6
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Retirada */}
      {showCodigoRetiradaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              🍱 Confirmar Retirada
              {entregaSelecionada && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  {getProductInfo(entregaSelecionada.product_type).icon}
                </span>
              )}
            </h3>
            <p className="text-gray-600 mb-4">
              Digite o código de 6 dígitos que está no <strong>Dashboard do Fornecedor</strong> para confirmar que você {entregaSelecionada ? getProductAction(entregaSelecionada.product_type) : 'retirou os produtos'}.
            </p>
            <input
              type="text"
              maxLength="6"
              value={codigoRetirada}
              onChange={(e) => setCodigoRetirada(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodigoRetiradaModal(false);
                  setEntregaSelecionada(null);
                  setCodigoRetirada('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRetiradaMarmitas}
                disabled={codigoRetirada.length !== 6}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  codigoRetirada.length === 6
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Confirmar Retirada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Entrega */}
      {showCodigoEntregaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              📍 Confirmar Entrega no Abrigo
              {entregaSelecionada && (
                <span className="text-lg font-normal text-gray-600 ml-2">
                  {getProductInfo(entregaSelecionada.product_type).icon}
                </span>
              )}
            </h3>
            <p className="text-gray-600 mb-4">
              Digite o código de 6 dígitos que está no <strong>aplicativo do Abrigo</strong> para confirmar que você entregou {entregaSelecionada ? getProductText(entregaSelecionada.product_type, entregaSelecionada.quantity) : 'os produtos'}.
            </p>
            <input
              type="text"
              maxLength="6"
              value={codigoEntrega}
              onChange={(e) => setCodigoEntrega(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodigoEntregaModal(false);
                  setEntregaSelecionada(null);
                  setCodigoEntrega('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEntregaMarmitas}
                disabled={codigoEntrega.length !== 6}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  codigoEntrega.length === 6
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar Entrega */}
      {showCancelarEntregaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">❌ Cancelar Entrega</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar esta entrega{entregaParaCancelar && minhasEntregas.find(e => e.id === entregaParaCancelar) ? ` de ${getProductText(minhasEntregas.find(e => e.id === entregaParaCancelar).product_type, minhasEntregas.find(e => e.id === entregaParaCancelar).quantity)}` : ''}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelarEntregaModal(false);
                  setEntregaParaCancelar(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamentoEntrega}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
