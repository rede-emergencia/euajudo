import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, Package, ShoppingCart, Truck, MapPin, BarChart3 } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Vou Ajudar</span>
              </Link>
              
              {user && (
                <div className="hidden md:flex space-x-4">
                  <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                    <MapPin className="h-4 w-4" />
                    <span>Mapa</span>
                  </Link>
                  
                  {hasRole('produtor') && (
                    <>
                      <Link to="/pedidos-insumo" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Insumos</span>
                      </Link>
                      <Link to="/lotes-marmita" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                        <Package className="h-4 w-4" />
                        <span>Marmitas</span>
                      </Link>
                    </>
                  )}
                  
                  {hasRole('voluntario_comprador') && (
                    <Link to="/reservas-insumo" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Comprar Insumos</span>
                    </Link>
                  )}
                  
                  {hasRole('voluntario_entregador') && (
                    <Link to="/entregas-marmita" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                      <Truck className="h-4 w-4" />
                      <span>Entregas</span>
                    </Link>
                  )}
                  
                  {hasRole('admin') && (
                    <>
                      <Link to="/locais-entrega" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                        <MapPin className="h-4 w-4" />
                        <span>Locais</span>
                      </Link>
                      <Link to="/admin" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50">
                        <BarChart3 className="h-4 w-4" />
                        <span>Admin</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user.name || user.nome}</div>
                    <div className="text-gray-500 text-xs">
                      {Array.isArray(user.roles) 
                        ? user.roles.map(r => r.replace('_', ' ')).join(', ')
                        : user.roles.split(',').map(r => r.trim()).map(r => r.replace('_', ' ')).join(', ')
                      }
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
