import { useState, useEffect, useRef } from 'react';
import { MapPin, Crosshair, Lock, Unlock } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ImprovedLocationPicker = ({ 
  initialLat, 
  initialLon, 
  onLocationChange, 
  locked = false, 
  address = null 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState({
    lat: initialLat || -21.7642, // Default: Juiz de Fora centro
    lon: initialLon || -43.3505
  });
  const [isLocked, setIsLocked] = useState(locked);

  // Fix para ícones do Leaflet
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([currentLocation.lat, currentLocation.lon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marcador inicial
    const marker = L.marker([currentLocation.lat, currentLocation.lon], {
      draggable: !isLocked
    }).addTo(map);

    markerRef.current = marker;

    // Evento de mover marcador
    marker.on('dragend', (e) => {
      if (isLocked) return;
      
      const position = e.target.getLatLng();
      const newLocation = {
        lat: position.lat,
        lon: position.lng
      };
      
      setCurrentLocation(newLocation);
      onLocationChange(newLocation.lat, newLocation.lon);
    });

    // Evento de clique no mapa
    map.on('click', (e) => {
      if (isLocked) return;
      
      const position = e.latlng;
      marker.setLatLng([position.lat, position.lng]);
      
      const newLocation = {
        lat: position.lat,
        lon: position.lng
      };
      
      setCurrentLocation(newLocation);
      onLocationChange(newLocation.lat, position.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLocked]);

  // Atualizar posição quando mudar externamente
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lon], 15);
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lon]);
    }
  }, [currentLocation]);

  // Atualizar quando endereço mudar
  useEffect(() => {
    if (address && address.coordenadas) {
      const newLocation = {
        lat: address.coordenadas.lat,
        lon: address.coordenadas.lon
      };
      setCurrentLocation(newLocation);
      onLocationChange(newLocation.lat, newLocation.lon);
    }
  }, [address]);

  // Bloquear/desbloquear
  const toggleLock = () => {
    const newLocked = !isLocked;
    setIsLocked(newLocked);
    
    if (markerRef.current) {
      markerRef.current.setDraggable(!newLocked);
    }
  };

  // Usar localização atual
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          setCurrentLocation(newLocation);
          onLocationChange(newLocation.lat, newLocation.lon);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newLocation.lat, newLocation.lon], 15);
          }
          
          if (markerRef.current) {
            markerRef.current.setLatLng([newLocation.lat, newLocation.lon]);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização atual');
        }
      );
    } else {
      alert('Seu navegador não suporta geolocalização');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLock}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isLocked 
                ? 'bg-gray-100 border-gray-300 text-gray-700' 
                : 'bg-blue-50 border-blue-300 text-blue-700'
            }`}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {isLocked ? 'Bloqueado' : 'Ajuste Livre'}
          </button>
          
          <button
            onClick={getCurrentLocation}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Crosshair className="h-4 w-4" />
            Minha Localização
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
        </div>
      </div>

      {/* Mapa */}
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">
              {isLocked ? '📍 Localização fixa' : '🎯 Ajuste a localização'}
            </div>
            <ul className="space-y-1">
              {isLocked ? (
                <>
                  <li>• Localização baseada no endereço selecionado</li>
                  <li>• Clique em "Ajuste Livre" para permitir modificações</li>
                </>
              ) : (
                <>
                  <li>• Arraste o marcador para ajustar a posição exata</li>
                  <li>• Ou clique em qualquer ponto do mapa</li>
                  <li>• Use "Minha Localização" para sua posição atual</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Endereço de referência */}
      {address && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-600">
            <div className="font-medium">Endereço de referência:</div>
            <div>{address.endereco_completo}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedLocationPicker;
