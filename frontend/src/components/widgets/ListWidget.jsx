/**
 * List Widget Component
 * Displays a list of items with actions
 */
import { useState } from 'react';
import { useWidget } from '../../hooks/useDashboard';
import { dashboardApi } from '../../lib/dashboardApi';
import { display, colorClass, formatProductWithQuantity } from '../../shared/enums';

export default function ListWidget({ widget, onActionComplete }) {
  const { data, loading, error, reload } = useWidget(widget.id);
  const [executingAction, setExecutingAction] = useState(null);

  const executeAction = async (action, item) => {
    if (action.confirmation_message) {
      if (!confirm(action.confirmation_message)) {
        return;
      }
    }

    setExecutingAction(`${action.id}-${item.id}`);
    
    try {
      const endpoint = action.endpoint.replace('{id}', item.id);
      await dashboardApi.executeAction(endpoint, action.method);
      
      alert(`✅ ${action.label} executado com sucesso!`);
      await reload();
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      alert(`❌ Erro: ${err.message}`);
    } finally {
      setExecutingAction(null);
    }
  };

  const renderCardItem = (item) => (
    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {/* Product Info */}
          {item.product_type && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">
                {item.product_type === 'meal' ? '🍱' : '📦'}
              </span>
              <span className="font-bold text-lg">
                {item.quantity} {formatProductWithQuantity(item.product_type, item.quantity)}
              </span>
            </div>
          )}
          
          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          
          {/* Items List (for requests) */}
          {item.items && item.items.length > 0 && (
            <div className="bg-gray-50 rounded p-2 mb-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Itens:</p>
              <div className="grid grid-cols-2 gap-1">
                {item.items.map((subItem, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    • {subItem.name}: {subItem.quantity}{subItem.unit}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1">
            {item.created_at && (
              <div>📅 Criado: {new Date(item.created_at).toLocaleString('pt-BR')}</div>
            )}
            {item.expires_at && (
              <div>⏰ Expira: {new Date(item.expires_at).toLocaleString('pt-BR')}</div>
            )}
            {item.pickup_deadline && (
              <div>🕐 Retirada até: {item.pickup_deadline}</div>
            )}
            {item.pickup_code && (
              <div className="font-mono font-bold text-orange-600">
                🔑 Código Retirada: {item.pickup_code}
              </div>
            )}
            {item.delivery_code && (
              <div className="font-mono font-bold text-green-600">
                🔑 Código Entrega: {item.delivery_code}
              </div>
            )}
          </div>

          {/* Provider/Location Info */}
          {item.provider && (
            <div className="mt-2 text-sm bg-blue-50 rounded p-2">
              <div className="font-semibold text-blue-900">📍 {item.provider.name}</div>
              <div className="text-xs text-blue-700">{item.provider.address}</div>
            </div>
          )}
          
          {item.location && (
            <div className="mt-2 text-sm bg-purple-50 rounded p-2">
              <div className="font-semibold text-purple-900">📍 {item.location.name}</div>
              <div className="text-xs text-purple-700">{item.location.address}</div>
            </div>
          )}
          
          {item.volunteer && (
            <div className="mt-2 text-sm bg-green-50 rounded p-2">
              <div className="font-semibold text-green-900">👤 {item.volunteer.name}</div>
              {item.volunteer.phone && (
                <div className="text-xs text-green-700">📞 {item.volunteer.phone}</div>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        {item.status && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2 ${
            colorClass('BatchStatus', item.status) || 
            colorClass('OrderStatus', item.status) || 
            colorClass('DeliveryStatus', item.status) ||
            'bg-gray-100 text-gray-800'
          }`}>
            {display('BatchStatus', item.status) || 
             display('OrderStatus', item.status) || 
             display('DeliveryStatus', item.status) || 
             item.status}
          </span>
        )}
      </div>

      {/* Actions */}
      {widget.item_actions && widget.item_actions.length > 0 && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {widget.item_actions.map((action) => (
            <button
              key={action.id}
              onClick={() => executeAction(action, item)}
              disabled={executingAction === `${action.id}-${item.id}`}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                action.style === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                  : action.style === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
              }`}
            >
              {executingAction === `${action.id}-${item.id}` ? '...' : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>❌ Erro ao carregar dados: {error}</p>
        <button
          onClick={reload}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">📭 Nenhum item encontrado</p>
        <p className="text-sm">
          {widget.primary_action 
            ? `Clique em "${widget.primary_action.label}" para começar`
            : 'Não há itens para exibir no momento'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(renderCardItem)}
    </div>
  );
}
