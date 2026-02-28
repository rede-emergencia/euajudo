import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { locaisEntrega } from '@/lib/api';
import { Package, MapPin, Users } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

export default function HomeLeaflet() {
  const [locais, setLocais] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadLocais();
  }, []);

  useEffect(() => {
    if (!mapLoaded && typeof window !== 'undefined') {
      loadLeafletMap();
    }
  }, []);

  const loadLocais = async () => {
    try {
      // Carregar apenas locais de Juiz de Fora
      const response = await locaisEntrega.list(false, 'juiz-de-fora');
      setLocais(response.data.filter(l => l.ativo));
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeafletMap = async () => {
    if (typeof window === 'undefined') return;

    // Check if map already exists and remove it
    if (window.leafletMap) {
      window.leafletMap.remove();
    }

    // Load Leaflet dynamically
    const L = await import('leaflet');
    
    // Fix Leaflet default icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map('map').setView([-21.7642, -43.3505], 12); // Juiz de Fora

    // Add zoom controls
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Store map reference
    window.leafletMap = map;

    // Add markers for locations (use mock data if locais is empty)
    const locationsToUse = locais.length > 0 ? locais : [
      { nome: "Abrigo Central", endereco: "Rua A, 123", latitude: -21.7642, longitude: -43.3505, responsavel: "João", telefone: "3236881234", necessidade_diaria: 80 },
      { nome: "Casa de Apoio", endereco: "Rua B, 456", latitude: -21.7542, longitude: -43.3405, responsavel: "Maria", telefone: "3236992345", necessidade_diaria: 60 }
    ];
    
    locationsToUse.forEach(local => {
      const lat = local.latitude || -21.7642 + (Math.random() - 0.5) * 0.1;
      const lng = local.longitude || -43.3505 + (Math.random() - 0.5) * 0.1;

      const marker = L.marker([lat, lng]).addTo(map);
      
      const popupContent = `
        <div class="p-2 max-w-xs">
          <h3 class="font-bold text-gray-900 mb-2">${local.nome}</h3>
          <p class="text-sm text-gray-600 mb-1">${local.endereco}</p>
          ${local.responsavel ? `<p class="text-sm text-gray-600"><strong>Responsável:</strong> ${local.responsavel}</p>` : ''}
          ${local.telefone ? `<p class="text-sm text-gray-600"><strong>Telefone:</strong> ${local.telefone}</p>` : ''}
          ${local.necessidade_diaria ? `<p class="text-sm text-blue-600 font-medium mt-2">Necessidade: ${local.necessidade_diaria} marmitas/dia</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });

    setMapLoaded(true);
  };

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
                <p className="text-sm text-gray-600">Marmitas Solidárias - Juiz de Fora</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <Link to="/pedidos-insumos" className="flex items-center space-x-2 text-gray-700 hover:text-primary-600">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span>Pedidos de Insumos</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Locais de Entrega</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Pontos de Produção</span>
                </div>
              </div>
              <Link to="/login" className="btn btn-primary">
                Participar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div id="map" className="w-full h-full pt-16"></div>

      {/* Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t shadow-lg md:hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around text-xs">
            <Link to="/pedidos-insumos" className="flex items-center space-x-1 text-gray-700">
              <Package className="h-4 w-4 text-orange-600" />
              <span>Pedidos</span>
            </Link>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>Entrega</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Produção</span>
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

      {/* Map Loading */}
      {!mapLoaded && !loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
}
