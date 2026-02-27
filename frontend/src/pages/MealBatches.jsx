import { useEffect, useState } from 'react';
import { lotesMarmita, entregasMarmita, locaisEntrega } from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import { Plus, X, Package, MapPin } from 'lucide-react';

export default function MealBatches() {
  const [batches, setBatches] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    description: '',
    donatedIngredients: true,
  });
  const [deliveryData, setDeliveryData] = useState({
    locationId: '',
    quantity: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lotesResp, locaisResp] = await Promise.all([
        lotesMarmita.getMinhas(),
        locaisEntrega.list(),
      ]);
      setLotes(lotesResp.data);
      setLocais(locaisResp.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        quantidade: parseInt(formData.quantidade),
        descricao: formData.descricao,
        com_insumo_doado: formData.com_insumo_doado,
      };
      await lotesMarmita.create(data);
      setShowModal(false);
      setFormData({ quantidade: '', descricao: '', com_insumo_doado: true });
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao criar lote');
    }
  };

  const handleMarcarPronto = async (id) => {
    if (!confirm('Marcar este lote como pronto para entrega?')) return;
    try {
      await lotesMarmita.marcarPronto(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao marcar como pronto');
    }
  };

  const handleCriarEntrega = (lote) => {
    setSelectedLote(lote);
    setEntregaData({ local_id: '', quantidade: '' });
    setShowEntregaModal(true);
  };

  const handleSubmitEntrega = async (e) => {
    e.preventDefault();
    try {
      const data = {
        lote_id: selectedLote.id,
        local_id: parseInt(entregaData.local_id),
        quantidade: parseInt(entregaData.quantidade),
      };
      await entregasMarmita.create(data);
      setShowEntregaModal(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao criar entrega');
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
          <h1 className="text-3xl font-bold text-gray-900">Lotes de Marmitas</h1>
          <p className="text-gray-600 mt-2">Gerencie a produção de marmitas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Novo Lote
        </button>
      </div>

      {lotes.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lote criado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro lote de marmitas</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Criar Lote
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {lotes.map((lote) => (
            <div key={lote.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lote #{lote.id}</h3>
                  <p className="text-sm text-gray-600">
                    Quantidade: {lote.quantidade} marmitas
                  </p>
                  <p className="text-sm text-gray-600">
                    Criado em: {formatDate(lote.created_at)}
                  </p>
                  {lote.pronto_at && (
                    <p className="text-sm text-gray-600">
                      Pronto em: {formatDate(lote.pronto_at)}
                    </p>
                  )}
                  {lote.descricao && (
                    <p className="text-sm text-gray-600 mt-2">
                      Descrição: {lote.descricao}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {lote.com_insumo_doado ? 'Com insumo doado' : 'Insumo próprio'}
                  </p>
                </div>
                <span className={`badge ${getStatusBadgeClass(lote.status)}`}>
                  {getStatusLabel(lote.status)}
                </span>
              </div>

              <div className="flex space-x-2">
                {lote.status === 'em_producao' && (
                  <button
                    onClick={() => handleMarcarPronto(lote.id)}
                    className="btn btn-primary"
                  >
                    Marcar como Pronto
                  </button>
                )}
                {lote.status === 'pronto' && (
                  <button
                    onClick={() => handleCriarEntrega(lote)}
                    className="btn btn-primary"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Criar Entrega
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Novo Lote de Marmitas</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Quantidade de Marmitas</label>
                  <input
                    type="number"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    className="input"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="label">Descrição (opcional)</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Ex: Arroz, feijão, frango, salada"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.com_insumo_doado}
                      onChange={(e) => setFormData({ ...formData, com_insumo_doado: e.target.checked })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Produzido com insumo doado</span>
                  </label>
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
                    Criar Lote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEntregaModal && selectedLote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Criar Entrega</h2>
                <button onClick={() => setShowEntregaModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitEntrega} className="space-y-4">
                <div>
                  <label className="label">Local de Entrega</label>
                  <select
                    value={entregaData.local_id}
                    onChange={(e) => setEntregaData({ ...entregaData, local_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Selecione um local</option>
                    {locais.map((local) => (
                      <option key={local.id} value={local.id}>
                        {local.nome} - {local.endereco}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Quantidade de Marmitas</label>
                  <input
                    type="number"
                    value={entregaData.quantidade}
                    onChange={(e) => setEntregaData({ ...entregaData, quantidade: e.target.value })}
                    className="input"
                    required
                    min="1"
                    max={selectedLote.quantidade}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: {selectedLote.quantidade} marmitas
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEntregaModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Criar Entrega
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
