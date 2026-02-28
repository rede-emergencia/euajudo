import { X, Package, Pill } from 'lucide-react';
import { useState } from 'react';

export default function CommitmentModal({ 
  isOpen, 
  onClose, 
  location,
  deliveries,
  onCommit
}) {
  const [quantities, setQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !location) return null;

  // Inicializar quantidades para cada tipo disponível
  const availableDeliveries = deliveries || [];
  const productTypes = [...new Set(availableDeliveries.map(d => d.product_type))];
  
  // Setup initial quantities
  if (Object.keys(quantities).length === 0) {
    const initialQuantities = {};
    productTypes.forEach(type => {
      initialQuantities[type] = 0;
    });
    setQuantities(initialQuantities);
  }

  const handleQuantityChange = (productType, value) => {
    const maxQuantity = availableDeliveries
      .filter(d => d.product_type === productType)
      .reduce((sum, d) => sum + d.quantity, 0);

    const newValue = Math.max(0, Math.min(parseInt(value) || 0, maxQuantity));
    setQuantities(prev => ({
      ...prev,
      [productType]: newValue
    }));
  };

  const handleSubmit = async () => {
    const totalQuantity = Object.values(quantities).reduce((sum, q) => sum + q, 0);
    
    if (totalQuantity === 0) {
      alert('Selecione pelo menos um item.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const commitments = Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productType, quantity]) => ({
          product_type: productType,
          quantity
        }));

      await onCommit(location.id, commitments);
      
      setQuantities({});
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao comprometer. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductInfo = (productType) => {
    const info = {
      meal: { icon: Package, name: 'Marmitas', color: 'text-orange-600' },
      medicine: { icon: Pill, name: 'Medicamentos', color: 'text-green-600' }
    };
    return info[productType] || info.meal;
  };

  const getMaxQuantity = (productType) => {
    return availableDeliveries
      .filter(d => d.product_type === productType)
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-xl text-white relative">
          <button onClick={onClose} className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full p-1">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-center">Comprometer Entrega</h2>
          <p className="text-blue-100 text-sm text-center mt-1">{location.name}</p>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-3">
          {/* Endereço */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">{location.address}</p>
          </div>

          {/* Seleção de Quantidades */}
          <div className="space-y-3">
            {productTypes.map(productType => {
              const Icon = getProductInfo(productType).icon;
              const maxQty = getMaxQuantity(productType);
              
              return (
                <div key={productType} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={getProductInfo(productType).color} size={18} />
                    <span className="font-medium text-sm">{getProductInfo(productType).name}</span>
                    <span className="text-xs text-gray-500">(Disp: {maxQty})</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={maxQty}
                    value={quantities[productType] || 0}
                    onChange={(e) => handleQuantityChange(productType, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Quantidade"
                  />
                </div>
              );
            })}
          </div>

          {/* Resumo */}
          {Object.values(quantities).some(q => q > 0) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                {Object.entries(quantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([type, qty]) => (
                    <div key={type} className="flex justify-between">
                      <span>{getProductInfo(type).name}:</span>
                      <span className="font-medium">{qty}</span>
                    </div>
                  ))}
                <div className="border-t border-blue-200 mt-2 pt-2 font-semibold flex justify-between">
                  <span>Total:</span>
                  <span>{Object.values(quantities).reduce((sum, q) => sum + q, 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !Object.values(quantities).some(q => q > 0)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-3 rounded-lg text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Comprometendo...' : 'Comprometer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
