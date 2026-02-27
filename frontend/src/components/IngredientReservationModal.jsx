import { useState } from 'react';
import { resourceReservations } from '../lib/api';

/**
 * Modal for volunteers to reserve specific ingredients and quantities
 * Allows partial reservations of ingredient requests
 */
export default function IngredientReservationModal({ 
  request, 
  onClose, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    estimated_delivery: '',
    items: (request.items || []).map(item => ({
      resource_item_id: item.id,
      name: item.name,
      quantity_total: item.quantity,
      quantity_reserved: item.quantity_reserved || 0,
      quantity_available: item.quantity - (item.quantity_reserved || 0),
      quantity_to_reserve: '',
      unit: item.unit
    }))
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.estimated_delivery) {
      newErrors.estimated_delivery = 'Previsão de entrega é obrigatória';
    }
    
    // Verificar se pelo menos um item foi selecionado com quantidade
    const hasItems = formData.items.some(item => 
      item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0
    );
    
    if (!hasItems) {
      newErrors.items = 'Selecione pelo menos um ingrediente para fornecer';
    }
    
    // Validar quantidades
    formData.items.forEach((item, index) => {
      const quantity = parseFloat(item.quantity_to_reserve);
      if (item.quantity_to_reserve && (isNaN(quantity) || quantity <= 0)) {
        newErrors[`quantity_${index}`] = 'Quantidade inválida';
      }
      if (item.quantity_to_reserve && quantity > item.quantity_available) {
        newErrors[`quantity_${index}`] = `Máximo: ${item.quantity_available}${item.unit}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateItemQuantity = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].quantity_to_reserve = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Preparar items para a reserva (apenas itens com quantidade)
      const reservationItems = formData.items
        .filter(item => item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0)
        .map(item => ({
          resource_item_id: item.resource_item_id,
          quantity: parseFloat(item.quantity_to_reserve)
        }));

      const payload = {
        request_id: request.id,
        estimated_delivery: formData.estimated_delivery,
        items: reservationItems
      };

      await resourceReservations.create(payload);
      
      const totalItems = reservationItems.length;
      const totalQuantity = reservationItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Calcular se é reserva parcial ou total
      const totalRequestItems = request.items.length;
      const isPartialReservation = totalItems < totalRequestItems || 
        reservationItems.some((resItem, idx) => {
          const originalItem = formData.items.find(i => i.resource_item_id === resItem.resource_item_id);
          return resItem.quantity < originalItem.quantity_total;
        });
      
      const message = isPartialReservation 
        ? `✅ Reserva PARCIAL criada com sucesso!\n\n📦 Você comprometeu a fornecer:\n- ${totalItems} de ${totalRequestItems} tipos de ingredientes\n\n⚠️ IMPORTANTE:\n- Outros voluntários podem reservar os itens restantes\n- O pedido continuará visível no mapa até ser totalmente reservado\n\n🔔 O fornecedor será notificado da sua contribuição!`
        : `✅ Reserva COMPLETA criada com sucesso!\n\n📦 Você comprometeu a fornecer:\n- TODOS os ${totalItems} ingredientes solicitados\n\n✨ Parabéns! Você completou este pedido!\n🔔 O fornecedor será notificado.`;
      
      alert(message);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              🛒 Reservar Ingredientes
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {request.provider?.name} - Para {request.quantity_meals} marmitas
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ❌
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'medium', marginBottom: '8px' }}>
              Previsão de Entrega *
            </label>
            <input
              type="datetime-local"
              value={formData.estimated_delivery}
              onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.estimated_delivery ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            {errors.estimated_delivery && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.estimated_delivery}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              background: '#eff6ff', 
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                💡 <strong>Dica:</strong> Você pode se comprometer com apenas PARTE dos ingredientes. Outros voluntários poderão reservar o restante!
              </p>
            </div>
            
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
              Ingredientes Disponíveis ({formData.items.filter(i => i.quantity_available > 0).length} de {formData.items.length})
            </h3>
            
            {formData.items.map((item, index) => (
              <div 
                key={item.resource_item_id}
                style={{
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  backgroundColor: item.quantity_available > 0 ? '#f9fafb' : '#fef3c7'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'medium' }}>{item.name}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: item.quantity_available > 0 ? '#059669' : '#d97706',
                    fontWeight: 'medium'
                  }}>
                    {item.quantity_available}{item.unit} disponíveis
                  </span>
                </div>
                
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  Total: {item.quantity_total}{item.unit} | 
                  Já reservado: {item.quantity_reserved}{item.unit}
                </div>
                
                {item.quantity_available > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      max={item.quantity_available}
                      value={item.quantity_to_reserve}
                      onChange={(e) => updateItemQuantity(index, e.target.value)}
                      placeholder="Quantidade"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: errors[`quantity_${index}`] ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>{item.unit}</span>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#d97706', fontStyle: 'italic' }}>
                    Já totalmente reservado
                  </p>
                )}
                
                {errors[`quantity_${index}`] && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors[`quantity_${index}`]}
                  </p>
                )}
              </div>
            ))}
            
            {errors.items && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                {errors.items}
              </p>
            )}
          </div>

          {/* Resumo da Reserva */}
          {formData.items.some(item => item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0) && (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #10b981',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#065f46' }}>
                📋 Resumo da sua Reserva
              </h4>
              {formData.items
                .filter(item => item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0)
                .map(item => (
                  <div key={item.resource_item_id} style={{ 
                    fontSize: '13px', 
                    color: '#047857',
                    marginBottom: '4px'
                  }}>
                    ✓ <strong>{item.name}:</strong> {item.quantity_to_reserve}{item.unit}
                    {parseFloat(item.quantity_to_reserve) < item.quantity_total && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {' '}(de {item.quantity_total}{item.unit} total)
                      </span>
                    )}
                  </div>
                ))}
              <div style={{ 
                marginTop: '8px', 
                paddingTop: '8px', 
                borderTop: '1px solid #d1fae5',
                fontSize: '12px',
                color: '#065f46'
              }}>
                {formData.items.filter(i => i.quantity_to_reserve && parseFloat(i.quantity_to_reserve) > 0).length} de {formData.items.length} ingredientes selecionados
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? '⏳ Reservando...' : '✅ Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
