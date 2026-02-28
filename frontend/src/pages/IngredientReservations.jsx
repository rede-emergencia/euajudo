import { useEffect, useState } from 'react';
import { pedidosInsumo, reservasInsumo } from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import { ShoppingCart, Check, X } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function ReservasInsumo() {
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [formData, setFormData] = useState({
    data_entrega_estimada: '',
    itens: [],
  });
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pedidosResp, reservasResp] = await Promise.all([
        pedidosInsumo.list(),
        reservasInsumo.getMinhas(),
      ]);
      setPedidosDisponiveis(
        pedidosResp.data.filter(p => 
          p.status === 'disponivel' || p.status === 'parcialmente_reservado'
        )
      );
      setMinhasReservas(reservasResp.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = (pedido) => {
    setSelectedPedido(pedido);
    setFormData({
      data_entrega_estimada: '',
      itens: pedido.itens.map(item => ({
        item_insumo_id: item.id,
        nome: item.nome,
        quantidade_total: item.quantidade,
        quantidade_disponivel: item.quantidade - item.quantidade_reservada,
        quantidade: 0,
        unidade: item.unidade,
      })),
    });
    setShowModal(true);
  };

  const handleItemChange = (index, quantidade) => {
    const newItens = [...formData.itens];
    newItens[index].quantidade = parseFloat(quantidade) || 0;
    setFormData({ ...formData, itens: newItens });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const itensSelecionados = formData.itens.filter(item => item.quantidade > 0);
    
    if (itensSelecionados.length === 0) {
      showAlert('Seleção Obrigatória', 'Selecione pelo menos um item para reservar', 'warning');
      return;
    }

    try {
      const data = {
        pedido_id: selectedPedido.id,
        data_entrega_estimada: new Date(formData.data_entrega_estimada).toISOString(),
        itens: itensSelecionados.map(item => ({
          item_insumo_id: item.item_insumo_id,
          quantidade: item.quantidade,
        })),
      };
      
      await reservasInsumo.create(data);
      setShowModal(false);
      loadData();
    } catch (error) {
      showAlert('Erro ao Criar Reserva', error.response?.data?.detail || 'Erro ao criar reserva', 'error');
    }
  };

  const handleCancelar = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      await reservasInsumo.cancel(id);
      loadData();
    } catch (error) {
      showAlert('Erro ao Cancelar Reserva', error.response?.data?.detail || 'Erro ao cancelar reserva', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comprar Insumos</h1>
        <p className="text-gray-600 mt-2">Ajude comprando insumos para produtores</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pedidos Disponíveis</h2>
          {pedidosDisponiveis.length === 0 ? (
            <div className="card text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum pedido disponível no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosDisponiveis.map((pedido) => (
                <div key={pedido.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Pedido #{pedido.id}</h3>
                      <p className="text-sm text-gray-600">
                        Produtor: {pedido.produtor?.nome}
                      </p>
                      <p className="text-sm text-gray-600">
                        Para: {pedido.quantidade_marmitas} marmitas
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(pedido.status)}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {pedido.itens.map((item) => {
                      const disponivel = item.quantidade - item.quantidade_reservada;
                      return (
                        <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{item.nome}</span>
                          <span className="font-medium">
                            {disponivel > 0 ? (
                              <span className="text-blue-600">{disponivel} {item.unidade} disponível</span>
                            ) : (
                              <span className="text-gray-400">Reservado</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleReservar(pedido)}
                    className="btn btn-primary w-full"
                  >
                    Reservar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Minhas Reservas</h2>
          {minhasReservas.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">Você ainda não tem reservas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {minhasReservas.map((reserva) => (
                <div key={reserva.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Reserva #{reserva.id}</h3>
                      <p className="text-sm text-gray-600">
                        Pedido #{reserva.pedido_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Entrega estimada: {formatDate(reserva.data_entrega_estimada)}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(reserva.status)}`}>
                      {getStatusLabel(reserva.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {reserva.itens.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>Item #{item.item_insumo_id}</span>
                        <span className="font-medium">{item.quantidade}</span>
                      </div>
                    ))}
                  </div>

                  {reserva.status === 'ativa' && (
                    <button
                      onClick={() => handleCancelar(reserva.id)}
                      className="btn btn-danger w-full"
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reservar Insumos</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="label">Data/Hora de Entrega Estimada</label>
                  <input
                    type="datetime-local"
                    value={formData.data_entrega_estimada}
                    onChange={(e) => setFormData({ ...formData, data_entrega_estimada: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label mb-3">Selecione os itens que você vai comprar:</label>
                  <div className="space-y-3">
                    {formData.itens.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{item.nome}</span>
                          <span className="text-sm text-gray-600">
                            Disponível: {item.quantidade_disponivel} {item.unidade}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            placeholder="Quantidade"
                            value={item.quantidade || ''}
                            onChange={(e) => handleItemChange(index, e.target.value)}
                            className="input flex-1"
                            min="0"
                            max={item.quantidade_disponivel}
                            step="0.1"
                          />
                          <span className="text-gray-600">{item.unidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        show={alert.show}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}
