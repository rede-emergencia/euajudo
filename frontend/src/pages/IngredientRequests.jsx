import { useEffect, useState } from 'react';
import { pedidosInsumo } from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import { Plus, X, Package } from 'lucide-react';
import AlertModal from '../components/AlertModal';

export default function PedidosInsumo() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [formData, setFormData] = useState({
    quantidade_marmitas: '',
    horario_recebimento: '',
    itens: [{ nome: '', quantidade: '', unidade: 'kg' }],
  });

  useEffect(() => {
    loadPedidos();
  }, []);

  const showAlert = (title, message, type = 'error') => {
    setAlertModal({
      show: true,
      title,
      message,
      type
    });
  };

  const closeAlert = () => {
    setAlertModal({
      show: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  const loadPedidos = async () => {
    try {
      const response = await pedidosInsumo.getMeus();
      setPedidos(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      itens: [...formData.itens, { nome: '', quantidade: '', unidade: 'kg' }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      itens: formData.itens.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...formData.itens];
    newItens[index][field] = value;
    setFormData({ ...formData, itens: newItens });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        quantidade_marmitas: parseInt(formData.quantidade_marmitas),
        horario_recebimento: formData.horario_recebimento || null,
        itens: formData.itens.map(item => ({
          nome: item.nome,
          quantidade: parseFloat(item.quantidade),
          unidade: item.unidade,
        })),
      };
      await pedidosInsumo.create(data);
      setShowModal(false);
      setFormData({
        quantidade_marmitas: '',
        horario_recebimento: '',
        itens: [{ nome: '', quantidade: '', unidade: 'kg' }],
      });
      loadPedidos();
    } catch (error) {
      showAlert('Erro ao Criar Pedido', error.response?.data?.detail || 'Erro ao criar pedido', 'error');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    try {
      await pedidosInsumo.cancel(id);
      loadPedidos();
    } catch (error) {
      showAlert('Erro ao Cancelar Pedido', error.response?.data?.detail || 'Erro ao cancelar pedido', 'error');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos de Insumo</h1>
          <p className="text-gray-600 mt-2">Solicite insumos para produzir marmitas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Novo Pedido
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido criado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro pedido de insumos</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Criar Pedido
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pedido #{pedido.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Para produzir: {pedido.quantidade_marmitas} marmitas
                  </p>
                  <p className="text-sm text-gray-600">
                    Criado em: {formatDate(pedido.created_at)}
                  </p>
                  {pedido.horario_recebimento && (
                    <p className="text-sm text-gray-600">
                      Recebimento: {formatDate(pedido.horario_recebimento)}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getStatusBadgeClass(pedido.status)}`}>
                    {getStatusLabel(pedido.status)}
                  </span>
                  {pedido.status === 'disponivel' && (
                    <button
                      onClick={() => handleCancel(pedido.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Insumos Solicitados:</h4>
                <div className="space-y-2">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <span className="font-medium">{item.nome}</span>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{item.quantidade} {item.unidade}</span>
                        {item.quantidade_reservada > 0 && (
                          <span className="ml-2 text-blue-600">
                            ({item.quantidade_reservada} reservado)
                          </span>
                        )}
                        {item.quantidade_entregue > 0 && (
                          <span className="ml-2 text-green-600">
                            ({item.quantidade_entregue} entregue)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Novo Pedido de Insumo</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Quantidade de Marmitas</label>
                    <input
                      type="number"
                      value={formData.quantidade_marmitas}
                      onChange={(e) => setFormData({ ...formData, quantidade_marmitas: e.target.value })}
                      className="input"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="label">Horário de Recebimento (opcional)</label>
                    <input
                      type="datetime-local"
                      value={formData.horario_recebimento}
                      onChange={(e) => setFormData({ ...formData, horario_recebimento: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="label mb-0">Insumos Necessários</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-secondary btn-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.itens.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nome do insumo"
                          value={item.nome}
                          onChange={(e) => handleItemChange(index, 'nome', e.target.value)}
                          className="input flex-1"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Quantidade"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                          className="input w-32"
                          required
                          min="0.1"
                          step="0.1"
                        />
                        <select
                          value={item.unidade}
                          onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                          className="input w-24"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="L">L</option>
                          <option value="ml">ml</option>
                          <option value="un">un</option>
                        </select>
                        {formData.itens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="btn btn-danger"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
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
                    Criar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        show={alertModal.show}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
