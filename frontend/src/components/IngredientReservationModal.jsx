import { useState } from 'react';
import { resourceReservations } from '../lib/api';
import IngredientReservationSuccessModal from './IngredientReservationSuccessModal';
import { formatProductWithQuantity } from '../shared/enums';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

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
      
      // Preparar dados para o modal de sucesso
      const successReservation = {
        provider: request.provider,
        estimated_delivery: formData.estimated_delivery,
        items: reservationItems.map(item => {
          const originalItem = formData.items.find(i => i.resource_item_id === item.resource_item_id);
          return {
            name: originalItem.name,
            quantity: item.quantity,
            unit: originalItem.unit
          };
        }),
        isPartialReservation: totalItems < request.items.length || 
          reservationItems.some((resItem, idx) => {
            const originalItem = formData.items.find(i => i.resource_item_id === resItem.resource_item_id);
            return resItem.quantity < originalItem.quantity_total;
          })
      };
      
      setSuccessData(successReservation);
      setShowSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('❌ Erro: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    onClose();
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
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Header Compacto */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>
              🛒 {request.provider?.name}
            </h2>
            <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
              Para {request.quantity_meals} {formatProductWithQuantity(request.product_type, request.quantity_meals)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '18px',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content Compacto */}
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {/* Previsão de Entrega */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>
              Previsão de Entrega *
            </label>
            <input
              type="datetime-local"
              value={formData.estimated_delivery}
              onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: errors.estimated_delivery ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            {errors.estimated_delivery && (
              <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', margin: '3px 0 0 0' }}>
                {errors.estimated_delivery}
              </p>
            )}
          </div>

          {/* Dica Compacta */}
          <div style={{ 
            background: '#eff6ff', 
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            padding: '8px 10px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#1e40af'
          }}>
            💡 Você pode reservar apenas parte dos ingredientes!
          </div>
          
          {/* Ingredientes Compactos */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
              Ingredientes ({formData.items.filter(i => i.quantity_available > 0).length}/{formData.items.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {formData.items.map((item, index) => (
                <div 
                  key={item.resource_item_id}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: item.quantity_available > 0 ? '#f9fafb' : '#fef3c7'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{item.name}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: item.quantity_available > 0 ? '#059669' : '#d97706',
                      fontWeight: '600'
                    }}>
                      {item.quantity_available}{item.unit}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                    Total: {item.quantity_total}{item.unit} | Reservado: {item.quantity_reserved}{item.unit}
                  </div>
                  
                  {item.quantity_available > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        max={item.quantity_available}
                        value={item.quantity_to_reserve}
                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                        placeholder="0"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: errors[`quantity_${index}`] ? '1px solid #ef4444' : '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{item.unit}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#d97706', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                      Já totalmente reservado
                    </p>
                  )}
                  
                  {errors[`quantity_${index}`] && (
                    <p style={{ color: '#ef4444', fontSize: '10px', marginTop: '3px', margin: '3px 0 0 0' }}>
                      {errors[`quantity_${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {errors.items && (
              <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', margin: '6px 0 0 0' }}>
                {errors.items}
              </p>
            )}
          </div>

          {/* Resumo Compacto */}
          {formData.items.some(item => item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0) && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#065f46' }}>
                📋 Resumo ({formData.items.filter(i => i.quantity_to_reserve && parseFloat(i.quantity_to_reserve) > 0).length} itens)
              </h4>
              <div style={{ fontSize: '11px', color: '#047857', lineHeight: '1.3' }}>
                {formData.items
                  .filter(item => item.quantity_to_reserve && parseFloat(item.quantity_to_reserve) > 0)
                  .map(item => (
                    <div key={item.resource_item_id} style={{ marginBottom: '2px' }}>
                      • {item.name}: <strong>{item.quantity_to_reserve}{item.unit}</strong>
                      {parseFloat(item.quantity_to_reserve) < item.quantity_total && (
                        <span style={{ color: '#6b7280' }}>
                          {' '}({item.quantity_total}{item.unit} total)
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions Compactas */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '13px',
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
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {loading ? '⏳...' : '✅ Reservar'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal de Sucesso */}
      <IngredientReservationSuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        reservation={successData}
      />
    </div>
  );
}
