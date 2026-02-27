import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedidosInsumo } from '@/lib/api';
import { Package, Clock, Users, MapPin, AlertCircle } from 'lucide-react';

export default function PedidosInsumoPublic() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      // Carregar pedidos de Juiz de Fora
      const response = await pedidosInsumo.list('juiz-de-fora');
      setPedidos(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case 'alta':
        return 'text-red-600 bg-red-50';
      case 'media':
        return 'text-yellow-600 bg-yellow-50';
      case 'baixa':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgenciaIcon = (urgencia) => {
    switch (urgencia) {
      case 'alta':
        return <AlertCircle className="h-4 w-4" />;
      case 'media':
        return <Clock className="h-4 w-4" />;
      case 'baixa':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos de insumos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedidos de Insumos</h1>
                <p className="text-sm text-gray-600">Juiz de Fora - MG</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="btn btn-outline">
                ← Mapa
              </Link>
              <Link to="/register" className="btn btn-primary">
                Ajudar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Restaurantes e Cozinhas Precisando de Ajuda
          </h2>
          <p className="text-gray-600">
            Estabelecimentos locais solicitando doações de insumos para produzir marmitas solidárias
          </p>
        </div>

        {pedidos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pedido de insumos no momento
            </h3>
            <p className="text-gray-600">
              Volte mais tarde para ver novas solicitações
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pedido.provider?.name || 'Restaurante'}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {pedido.provider?.address || 'Juiz de Fora, MG'}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgenciaColor(pedido.urgencia || 'media')}`}>
                      {getUrgenciaIcon(pedido.urgencia || 'media')}
                      <span className="ml-1">
                        {pedido.urgencia ? pedido.urgencia.charAt(0).toUpperCase() + pedido.urgencia.slice(1) : 'Média'}
                      </span>
                    </span>
                  </div>

                  {/* Quantidade */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Users className="h-4 w-4 mr-1" />
                      Produzindo {pedido.quantidade_marmitas} marmitas
                    </div>
                    <div className="text-sm text-gray-600">
                      {pedido.provider?.phone && (
                        <div className="flex items-center">
                          <span className="mr-2">📞</span>
                          {pedido.provider.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itens */}
                  {pedido.itens && pedido.itens.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Insumos necessários:</h4>
                      <div className="space-y-1">
                        {pedido.itens.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm text-gray-600">
                            <span>{item.nome}</span>
                            <span>{item.quantidade} {item.unidade}</span>
                          </div>
                        ))}
                        {pedido.itens.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{pedido.itens.length - 3} outros itens...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      pedido.status === 'DISPONIVEL' 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-gray-600 bg-gray-50'
                    }`}>
                      {pedido.status === 'DISPONIVEL' ? 'Disponível' : pedido.status}
                    </span>
                    <Link 
                      to="/register" 
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Quero ajudar →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-primary-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Quer ajudar estes restaurantes?
            </h3>
            <p className="text-gray-600 mb-6">
              Cadastre-se como voluntário comprador e ajude a fornecer os insumos necessários
            </p>
            <Link to="/register" className="btn btn-primary">
              Cadastrar como Voluntário
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
