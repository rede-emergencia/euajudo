import { useState } from 'react';
import { getMessageFormatter } from '../lib/messages';
import { resourceRequests } from '../lib/api';

/**
 * Request Form Component for MVP
 * - Shelters: Request meals for delivery
 * - Providers: Request ingredients to produce meals
 */
export default function RequestForm({ 
  productType = 'MEAL', 
  onSuccess, 
  onCancel,
  initialData = null,
  userRole = null
}) {
  const formatter = getMessageFormatter(productType);
  const isShelter = userRole === 'shelter';
  const isProvider = userRole === 'provider';
  
  const [formData, setFormData] = useState({
    quantity_meals: initialData?.quantity_meals || '',
    receiving_time: initialData?.receiving_time || '',
    notes: initialData?.notes || '',
    // Para providers que pedem insumos
    items: isProvider ? [
      { name: 'Arroz', quantity: '', unit: 'kg' },
      { name: 'Feijão', quantity: '', unit: 'kg' },
      { name: 'Carne', quantity: '', unit: 'kg' },
      { name: 'Salada', quantity: '', unit: 'kg' }
    ] : []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.quantity_meals || formData.quantity_meals <= 0) {
      newErrors.quantity_meals = 'Quantidade deve ser maior que 0';
    }
    
    if (isShelter && !formData.receiving_time) {
      newErrors.receiving_time = 'Horário de recebimento é obrigatório';
    }
    
    // Para providers, validar itens
    if (isProvider) {
      const validItems = formData.items.filter(item => item.name.trim() && item.quantity);
      if (validItems.length === 0) {
        newErrors.items = 'Pelo menos um ingrediente é obrigatório';
      }
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
        quantity_meals: parseInt(formData.quantity_meals),
        receiving_time: isShelter ? formData.receiving_time : null,
        notes: formData.notes
      };
      
      // Para providers, adicionar itens (ingredientes)
      if (isProvider) {
        const validItems = formData.items
          .filter(item => item.name.trim() && item.quantity)
          .map(item => ({
            name: item.name.trim(),
            quantity: parseFloat(item.quantity),
            unit: item.unit.trim()
          }));
        payload.items = validItems;
      }

      await resourceRequests.create(payload);
      
      const successMessage = isShelter 
        ? '✅ Pedido de marmitas criado com sucesso! Os providers serão notificados.'
        : '✅ Pedido de insumos criado com sucesso! Os voluntários serão notificados.';
      
      alert(successMessage);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        quantity_meals: '',
        receiving_time: '',
        notes: '',
        items: isProvider ? [
          { name: 'Arroz', quantity: '', unit: 'kg' },
          { name: 'Feijão', quantity: '', unit: 'kg' },
          { name: 'Carne', quantity: '', unit: 'kg' },
          { name: 'Salada', quantity: '', unit: 'kg' }
        ] : []
      });
    } catch (error) {
      console.error('Error creating request:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: '', unit: '' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className={`border rounded-lg p-4 ${
      isShelter ? 'bg-blue-50' : 'bg-orange-50'
    }`}>
      <h3 className={`font-semibold mb-4 ${
        isShelter ? 'text-blue-900' : 'text-orange-900'
      }`}>
        {isShelter ? '🏠 Pedir Marmitas para o Abrigo' : '👨‍🍳 Pedir Insumos para Produção'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de {formatter.getProductEmoji()} Marmitas
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity_meals}
            onChange={(e) => setFormData({ ...formData, quantity_meals: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg ${
              errors.quantity_meals ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: 50"
          />
          {errors.quantity_meals && (
            <p className="text-red-500 text-xs mt-1">{errors.quantity_meals}</p>
          )}
        </div>

        {isShelter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horário de Recebimento
            </label>
            <input
              type="time"
              value={formData.receiving_time}
              onChange={(e) => setFormData({ ...formData, receiving_time: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.receiving_time ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.receiving_time && (
              <p className="text-red-500 text-xs mt-1">{errors.receiving_time}</p>
            )}
          </div>
        )}

        {isProvider && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredientes Necessários
            </label>
            
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="Nome do ingrediente"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  placeholder="Qtd"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  placeholder="Unidade"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}
            
            {errors.items && (
              <p className="text-red-500 text-xs mt-1">{errors.items}</p>
            )}
            
            <button
              type="button"
              onClick={addItem}
              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              + Adicionar Ingrediente
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações (opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="Ex: Preferencialmente marmitas vegetarianas, sem pimentão..."
          />
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
              loading ? 'bg-gray-400' : isShelter ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {loading ? 'Criando...' : (isShelter ? 'Pedir Marmitas' : 'Pedir Insumos')}
          </button>
        </div>
      </form>
    </div>
  );
}
