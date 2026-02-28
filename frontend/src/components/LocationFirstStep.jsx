import { useEffect, useRef, useState } from 'react';
import { MapPin, X, Search } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function LocationFirstStep({ onLocationSelected, initialLocation = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([-19.9167, -43.9345], 11); // Belo Horizonte

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Adicionar marcador inicial se houver
    if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
      markerRef.current = L.marker([initialLocation.latitude, initialLocation.longitude], {
        draggable: true
      }).addTo(map);

      markerRef.current.on('dragend', function(e) {
        const position = e.target.getLatLng();
        setSelectedLocation({
          latitude: position.lat,
          longitude: position.lng
        });
      });
    }

    // Clique no mapa para adicionar/mover marcador
    map.on('click', function(e) {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true
        }).addTo(map);

        markerRef.current.on('dragend', function(e) {
          const position = e.target.getLatLng();
          setSelectedLocation({
            latitude: position.lat,
            longitude: position.lng
          });
        });
      }

      setSelectedLocation({
        latitude: lat,
        longitude: lng
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Buscar endereço
  const searchAddress = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&country=Brazil`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Selecionar localização da busca
  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        draggable: true
      }).addTo(mapInstanceRef.current);

      markerRef.current.on('dragend', function(e) {
        const position = e.target.getLatLng();
        setSelectedLocation({
          latitude: position.lat,
          longitude: position.lng
        });
      });
    }

    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      address: result.display_name
    });

    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  // Confirmar localização
  const handleConfirm = () => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      onLocationSelected(selectedLocation);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📍 Passo 1: Selecionar Localização
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Clique no mapa ou busque um endereço para selecionar a localização do abrigo
        </p>
      </div>

      {/* Busca de endereço */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchAddress(e.target.value);
          }}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Digite o endereço do abrigo..."
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectLocation(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{result.display_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mapa */}
      <div>
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border-2 border-gray-300"
          style={{ zIndex: 1 }}
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 Clique no mapa ou arraste o marcador para ajustar a localização
        </p>
      </div>

      {/* Coordenadas selecionadas */}
      {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Localização selecionada:</span>
          </div>
          <div className="mt-2 text-sm text-blue-800">
            <p>📍 Endereço: {selectedLocation.address || 'Endereço não informado'}</p>
            <p>🌐 Coordenadas: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</p>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedLocation || !selectedLocation.latitude}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          📍 Confirmar Localização
        </button>
      </div>
    </div>
  );
}
