import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deliveries } from '@/lib/api';
import { Truck, Package, Pill, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function MinhasEntregas() {
  const { user } = useAuth();
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyDeliveries();
  }, []);

  const loadMyDeliveries = async () => {
    try {
      const response = await deliveries.list();
      setMyDeliveries(response.data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_confirmation':
        return <Clock className="text-yellow-600" size={20} />;
      case 'picked_up':
        return <Truck className="text-blue-600" size={20} />;
      case 'delivered':
        return <CheckCircle className="text-green-600" size={20} />;
      default:
        return <AlertCircle className="text-gray-600" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_confirmation':
        return 'Aguardando Confirmação';
      case 'picked_up':
        return 'Em Trânsito';
      case 'delivered':
        return 'Entregue';
      default:
        return status;
    }
  };

  const getProductIcon = (productType) => {
    switch (productType) {
      case 'meal':
        return <Package className="text-orange-600" size={20} />;
      case 'medicine':
        return <Pill className="text-green-600" size={20} />;
      default:
        return <Package className="text-gray-600" size={20} />;
    }
  };

  const getProductName = (productType) => {
    switch (productType) {
      case 'meal':
        return 'Marmitas';
      case 'medicine':
        return 'Medicamentos';
      default:
        return productType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Agrupar entregas por local
  const groupedDeliveries = {};
  myDeliveries.forEach(delivery => {
    const locationId = delivery.location_id;
    if (!groupedDeliveries[locationId]) {
      groupedDeliveries[locationId] = {
        location: delivery.location,
        deliveries: []
      };
    }
    groupedDeliveries[locationId].deliveries.push(delivery);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minhas Entregas</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas entregas comprometidas
        </p>
      </div>

      {myDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma entrega ativa</h3>
          <p className="text-gray-600 mb-4">
            Você não tem entregas comprometidas no momento.
          </p>
          <a
            href="/mapa"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Truck size={16} className="mr-2" />
            Ver Entregas Disponíveis
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDeliveries).map(([locationId, group]) => (
            <div key={locationId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.location.name}
                  </h3>
                  <p className="text-sm text-gray-600">{group.location.address}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {group.deliveries.length} produto(s)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.deliveries.map(delivery => (
                  <div key={delivery.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getProductIcon(delivery.product_type)}
                        <span className="font-medium text-gray-900">
                          {getProductName(delivery.product_type)}
                        </span>
                      </div>
                      {getStatusIcon(delivery.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantidade:</span>
                        <span className="font-medium">{delivery.quantity}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-gray-900">
                          {getStatusText(delivery.status)}
                        </span>
                      </div>
                      
                      {delivery.pickup_code && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Código Retirada:</span>
                          <span className="font-mono font-medium text-blue-600">
                            {delivery.pickup_code}
                          </span>
                        </div>
                      )}
                      
                      {delivery.delivery_code && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Código Entrega:</span>
                          <span className="font-mono font-medium text-green-600">
                            {delivery.delivery_code}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
