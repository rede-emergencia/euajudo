import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LocationPicker({ 
  latitude, 
  longitude, 
  address,
  onLocationChange,
  onAddressChange,
  onLocationSelect 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState(address || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialLat = latitude || -21.7642;
    const initialLng = longitude || -43.3502;

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Adicionar marcador inicial se houver coordenadas
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], {
        draggable: true
      }).addTo(map);

      markerRef.current.on('dragend', function(e) {
        const position = e.target.getLatLng();
        onLocationChange(position.lat, position.lng);
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
          onLocationChange(position.lat, position.lng);
        });
      }

      onLocationChange(lat, lng);
      
      // Chamar onLocationSelect se existir
      if (onLocationSelect) {
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: searchQuery || `Localização: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      }
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

  // Atualizar marcador quando coordenadas mudarem externamente
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!latitude || !longitude) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], {
        draggable: true
      }).addTo(mapInstanceRef.current);

      markerRef.current.on('dragend', function(e) {
        const position = e.target.getLatLng();
        onLocationChange(position.lat, position.lng);
      });
    }

    mapInstanceRef.current.setView([latitude, longitude], 15);
  }, [latitude, longitude]);

  // Buscar endereços usando Nominatim
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`
      );
      const results = await response.json();
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddress(searchQuery);
      } else if (searchQuery.length === 0) {
        // Só limpar se estiver vazio, não se estiver digitando
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    onLocationChange(lat, lng);
    onAddressChange(result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);

    // Chamar onLocationSelect se existir
    if (onLocationSelect) {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: result.display_name
      });
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true
        }).addTo(mapInstanceRef.current);

        markerRef.current.on('dragend', function(e) {
          const position = e.target.getLatLng();
          onLocationChange(position.lat, position.lng);
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Campo de busca */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar Endereço
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <X className="h-4 w-4" />
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
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Buscando...</p>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localização no Mapa
        </label>
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-lg border-2 border-gray-300"
          style={{ zIndex: 1 }}
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Clique no mapa ou arraste o marcador para ajustar a localização
        </p>
      </div>

      {/* Coordenadas selecionadas */}
      {latitude && longitude && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Coordenadas:</span>
            <span className="text-blue-700">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
