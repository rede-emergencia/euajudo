import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { locaisEntrega } from '@/lib/api';
import { Package, MapPin, Users, ChefHat, Heart, Truck, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const defaultCenter = {
  lat: -19.9167,
  lng: -43.9345, // Belo Horizonte
};

export default function Home() {
  const { user, hasRole } = useAuth();
  const [locais, setLocais] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    loadLocais();
    // Mostrar modal de boas-vindas se usuário estiver logado
    if (user) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  const loadLocais = async () => {
    try {
      const response = await locaisEntrega.list(false);
      setLocais(response.data.filter(l => l.ativo));
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <Package className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">EuAjudo</h1>
          <p className="text-gray-600 mb-4">
            Configure a chave da API do Google Maps no arquivo .env.local
          </p>
          <Link to="/login" className="btn btn-primary">
            Acessar Sistema
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EuAjudo</h1>
                <p className="text-sm text-gray-600">Conectando quem ajuda com quem precisa</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="relative">
                    <MapPin className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">Locais de Entrega</span>
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Pontos de distribuição</span>
                  </div>
                </div>
                <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                  <div className="relative">
                    <Users className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">Pontos de Produção</span>
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Cozinhas solidárias</span>
                  </div>
                </div>
              </div>
              <Link to="/login" className="btn btn-primary">
                Participar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {locais.map((local) => (
            <Marker
              key={local.id}
              position={{
                lat: local.latitude || defaultCenter.lat + (Math.random() - 0.5) * 0.1,
                lng: local.longitude || defaultCenter.lng + (Math.random() - 0.5) * 0.1,
              }}
              onClick={() => setSelectedLocal(local)}
              icon={{
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxMGI5ODEiLz4KPHBhdGggZD0iTTE2IDhDMTIuNjg2MyA4IDEwIDEwLjY4NjMgMTAgMTRDMTAgMTguNSAxNiAyNCAxNiAyNEMxNiAyNCAyMiAxOC41IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
                scaledSize: window.google && window.google.maps ? new window.google.maps.Size(32, 32) : {width: 32, height: 32},
              }}
            />
          ))}

          {selectedLocal && (
            <InfoWindow
              position={{
                lat: selectedLocal.latitude || defaultCenter.lat,
                lng: selectedLocal.longitude || defaultCenter.lng,
              }}
              onCloseClick={() => setSelectedLocal(null)}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-gray-900 mb-2">{selectedLocal.nome}</h3>
                <p className="text-sm text-gray-600 mb-1">{selectedLocal.endereco}</p>
                {selectedLocal.responsavel && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Responsável:</span> {selectedLocal.responsavel}
                  </p>
                )}
                {selectedLocal.telefone && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Telefone:</span> {selectedLocal.telefone}
                  </p>
                )}
                {selectedLocal.necessidade_diaria && (
                  <p className="text-sm text-blue-600 font-medium mt-2">
                    Necessidade: {selectedLocal.necessidade_diaria} marmitas/dia
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t shadow-lg md:hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around">
            <div className="group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
              <div className="relative">
                <MapPin className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-700 font-medium block">Entregas</span>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Pontos de distribuição</span>
              </div>
            </div>
            <div className="group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
              <div className="relative">
                <Users className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-700 font-medium block">Produção</span>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Cozinhas solidárias</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando locais...</p>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Content based on role */}
            {hasRole('provider') && (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <ChefHat className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full opacity-60 animate-pulse" />
                  <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-green-400 rounded-full opacity-60 animate-pulse delay-100" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Bem-vindo, Fornecedor! 👨‍🍳
                </h2>
                <p className="text-lg text-gray-700 mb-2">Olá, {user.name}!</p>
                <p className="text-sm text-gray-600 mb-6">
                  Veja o que você pode fazer hoje:
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Suas ações disponíveis:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Ofertar marmitas:</strong> Crie lotes de marmitas prontas para entrega</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Pedir insumos:</strong> Solicite ingredientes que você precisa</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Gerenciar retiradas:</strong> Acompanhe as entregas dos voluntários</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/provider"
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                >
                  <ChefHat className="h-5 w-5" />
                  Ir para Dashboard
                </Link>
              </div>
            )}

            {hasRole('shelter') && (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full opacity-60 animate-pulse" />
                  <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-pulse delay-100" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Bem-vindo, Abrigo! 🏠
                </h2>
                <p className="text-lg text-gray-700 mb-2">Olá, {user.name}!</p>
                <p className="text-sm text-gray-600 mb-6">
                  Veja o que você pode fazer hoje:
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-red-500" />
                    Suas ações disponíveis:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Pedir marmitas:</strong> Solicite refeições para seu abrigo</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Pedir insumos:</strong> Solicite ingredientes e suprimentos</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Acompanhar entregas:</strong> Veja o status das suas solicitações</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 text-left">
                      <strong>Novidade:</strong> Agora você pode pedir marmitas mesmo tendo pedidos de insumos ativos!
                    </p>
                  </div>
                </div>

                <Link
                  to="/shelter"
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-md"
                >
                  <Heart className="h-5 w-5" />
                  Ir para Dashboard
                </Link>
              </div>
            )}

            {hasRole('volunteer') && (
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Truck className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full opacity-60 animate-pulse" />
                  <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-purple-400 rounded-full opacity-60 animate-pulse delay-100" />
                </div>
                
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Bem-vindo, Voluntário! 🚚
                </h2>
                <p className="text-lg text-gray-700 mb-2">Olá, {user.name}!</p>
                <p className="text-sm text-gray-600 mb-6">
                  Veja o que você pode fazer hoje:
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    Suas ações disponíveis:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Aceitar entregas:</strong> Veja marmitas disponíveis para entrega</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Doar insumos:</strong> Contribua com ingredientes para fornecedores</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span><strong>Gerenciar rotas:</strong> Acompanhe suas entregas ativas</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/volunteer"
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
                >
                  <Truck className="h-5 w-5" />
                  Ir para Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
