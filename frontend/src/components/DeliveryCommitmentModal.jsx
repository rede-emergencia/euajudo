import { useState } from 'react';
import { X } from 'lucide-react';

export default function DeliveryCommitmentModal({ 
  delivery, 
  onClose, 
  onCommit 
}) {
  const [quantity, setQuantity] = useState(delivery?.quantity || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!delivery) return null;

  const handleCommit = async () => {
    if (quantity <= 0 || quantity > delivery.quantity) {
      setError(`Quantidade deve estar entre 1 e ${delivery.quantity}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCommit(delivery.id, quantity);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao se comprometer com a entrega');
    } finally {
      setLoading(false);
    }
  };

  const productTypeLabels = {
    'meal': '🍽️ Marmitas',
    'hygiene': '🧼 Itens Higiênicos',
    'clothing': '👕 Roupas',
    'medicine': '💊 Medicamentos',
    'cleaning': '🧹 Produtos de Limpeza'
  };

  const productLabel = productTypeLabels[delivery.product_type] || delivery.product_type;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Me Comprometer - Entregar {productLabel}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Delivery Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Detalhes da Entrega</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Tipo:</strong> {productLabel}</p>
              <p><strong>Local:</strong> {delivery.location?.name}</p>
              <p><strong>Endereço:</strong> {delivery.location?.address}</p>
              <p><strong>Quantidade Disponível:</strong> {delivery.quantity} unidades</p>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade que você pode entregar
            </label>
            <input
              type="number"
              min="1"
              max={delivery.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Você pode se comprometer com parte ou toda a quantidade necessária
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> Ao se comprometer, você terá 24 horas para 
              adquirir e entregar os produtos no local indicado. Você receberá um código 
              de confirmação para validar a entrega.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleCommit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : 'Me Comprometer'}
          </button>
        </div>
      </div>
    </div>
  );
}
