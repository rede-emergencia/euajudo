import { useState } from 'react';
import { getMessageFormatter } from '../lib/messages';
import { batches } from '../lib/api';

/**
 * Generic Batch Form Component
 * Allows providers to create product batches
 */
export default function BatchForm({ 
  productType = 'MEAL', 
  onSuccess, 
  onCancel,
  initialData = null 
}) {
  const formatter = getMessageFormatter(productType);
  const [formData, setFormData] = useState({
    product_type: productType,
    quantity: initialData?.quantity || '',
    description: initialData?.description || '',
    donated_ingredients: initialData?.donated_ingredients !== false,
    pickup_deadline: initialData?.pickup_deadline || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que 0';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        product_type: formData.product_type,
        quantity: parseInt(formData.quantity),
        description: formData.description.trim(),
        donated_ingredients: formData.donated_ingredients,
        pickup_deadline: formData.pickup_deadline || null
      };

      await batches.create(payload);
      
      alert(formatter.getBatchCreatedMessage());
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        product_type: productType,
        quantity: '',
        description: '',
        donated_ingredients: true,
        pickup_deadline: ''
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <h3 className="font-semibold text-blue-900 mb-4">
        {formatter.getCreateBatchModalTitle()}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de {formatter.getProductEmoji()} {formatter.getProductEmoji() ? formatter.getProductEmoji() + ' ' : ''}{formatter.getProductDisplayName?.() || formatter.product?.getDisplayName?.() || 'itens'}
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.quantity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Ex: 50 ${formatter.getProductUnitLabel?.() || formatter.product?.getUnitLabel?.() || 'unidades'}`}
          />
          {errors.quantity && (
            <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={3}
            placeholder={`Descreva os ${formatter.getProductDisplayName?.() || formatter.product?.getDisplayName?.() || 'itens'} que estão disponíveis...`}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horário Limite para Retirada (opcional)
          </label>
          <input
            type="time"
            value={formData.pickup_deadline}
            onChange={(e) => setFormData({ ...formData, pickup_deadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deixe em branco se não houver horário limite
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="donated_ingredients"
            checked={formData.donated_ingredients}
            onChange={(e) => setFormData({ ...formData, donated_ingredients: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="donated_ingredients" className="text-sm text-gray-700">
            Ingredientes doados
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Criando...' : 'Criar Lote'}
          </button>
        </div>
      </form>
    </div>
  );
}
