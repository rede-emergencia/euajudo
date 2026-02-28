import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboard } from '@/lib/api';
import { Package, ShoppingCart, Truck, MapPin, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboard.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {user.nome}!</h1>
        <p className="text-gray-600 mt-2">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasRole('produtor') && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lotes de Marmitas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_batches || 0}</p>
                  <p className="text-xs text-green-600 mt-1">{stats.active_batches || 0} ativos</p>
                </div>
                <Package className="h-12 w-12 text-green-600" />
              </div>
            </div>
          </>
        )}

        {hasRole('volunteer') && (
          <>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Minhas Entregas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_deliveries || 0}</p>
                  <p className="text-xs text-purple-600 mt-1">{stats.completed_deliveries || 0} concluídas</p>
                </div>
                <Truck className="h-12 w-12 text-purple-600" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasRole('volunteer') && (
          <Link to="/mapa" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <Truck className="h-10 w-10 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Entregas</h3>
                <p className="text-sm text-gray-600">Visualize e comprometa-se com entregas</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
