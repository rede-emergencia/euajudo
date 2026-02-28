import { X, Package, Pill } from 'lucide-react';
import { useState } from 'react';

export default function CommitmentModal({ 
  isOpen, 
  onClose, 
  location,
  deliveries,
  onCommit
}) {
  const [quantities, setQuantities] = useState({
    meal: 0,
    medicine: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !location) return null;

  // Verificar quais tipos de produtos este local pede
  const availableDeliveries = deliveries || [];
  const hasMeals = availableDeliveries.some(d => d.product_type === 'meal');
  const hasMedicines = availableDeliveries.some(d => d.product_type === 'medicine');

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
    const totalQuantity = quantities.meal + quantities.medicine;
    
    if (totalQuantity === 0) {
      alert('Por favor, selecione pelo menos um item para comprometer.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Criar compromissos para cada tipo de produto
      const commitments = [];
      
      if (quantities.meal > 0 && hasMeals) {
        commitments.push({
          product_type: 'meal',
          quantity: quantities.meal
        });
      }
      
      if (quantities.medicine > 0 && hasMedicines) {
        commitments.push({
          product_type: 'medicine',
          quantity: quantities.medicine
        });
      }

      await onCommit(location.id, commitments);
      
      // Resetar e fechar
      setQuantities({ meal: 0, medicine: 0 });
      onClose();
    } catch (error) {
      console.error('Erro ao comprometer:', error);
      alert('Erro ao comprometer. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMaxQuantity = (productType) => {
    return availableDeliveries
      .filter(d => d.product_type === productType)
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 rounded-full p-3 mb-3">
              <Package size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Comprometer Entrega</h2>
            <p className="text-blue-100 mt-2">
              {location.name}
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Informações do local */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Endereço</p>
            <p className="font-medium text-gray-900">{location.address}</p>
            <p className="text-sm text-gray-600 mt-2">Contato: {location.contact_person}</p>
            <p className="text-sm text-gray-600">Telefone: {location.phone}</p>
          </div>

          {/* Seleção de Quantidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Selecione as quantidades:</h3>
            
            {/* Marmitas */}
            {hasMeals && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="text-orange-600" size={20} />
                  <span className="font-medium text-gray-900">Marmitas</span>
                  <span className="text-sm text-gray-500">
                    (Disponível: {getMaxQuantity('meal')})
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={getMaxQuantity('meal')}
                  value={quantities.meal}
                  onChange={(e) => handleQuantityChange('meal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quantidade de marmitas"
                />
              </div>
            )}

            {/* Medicamentos */}
            {hasMedicines && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="text-green-600" size={20} />
                  <span className="font-medium text-gray-900">Medicamentos</span>
                  <span className="text-sm text-gray-500">
                    (Disponível: {getMaxQuantity('medicine')})
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={getMaxQuantity('medicine')}
                  value={quantities.medicine}
                  onChange={(e) => handleQuantityChange('medicine', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quantidade de medicamentos"
                />
              </div>
            )}
          </div>

          {/* Resumo */}
          {(quantities.meal > 0 || quantities.medicine > 0) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Resumo do compromisso:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                {quantities.meal > 0 && (
                  <div>• {quantities.meal} marmita(s)</div>
                )}
                {quantities.medicine > 0 && (
                  <div>• {quantities.medicine} medicamento(s)</div>
                )}
                <div className="font-semibold pt-2 border-t border-blue-200">
                  Total: {quantities.meal + quantities.medicine} itens
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (quantities.meal === 0 && quantities.medicine === 0)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Comprometendo...' : 'Comprometer'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
