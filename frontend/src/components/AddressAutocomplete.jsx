import { useState, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';

const AddressAutocomplete = ({ onAddressSelect, initialAddress = '' }) => {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Buscar endereço via CEP usando API do Brasil
  const searchByCep = async (cep) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) return [];

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) return [];

      return [{
        cep: cleanCep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        endereco_completo: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`,
        coordenadas: null // Será preenchido depois
      }];
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return [];
    }
  };

  // Buscar endereço por texto usando Nominatim (OpenStreetMap)
  const searchByText = async (text) => {
    try {
      // Priorizar busca em Juiz de Fora
      const queryWithCity = text.toLowerCase().includes('juiz de fora') 
        ? text 
        : `${text}, Juiz de Fora, Minas Gerais, Brazil`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&limit=5&countrycodes=br&addressdetails=1`
      );
      const data = await response.json();

      return data.map(item => ({
        cep: null,
        logradouro: item.display_name.split(',')[0],
        bairro: item.address?.suburb || item.address?.neighbourhood || '',
        localidade: item.address?.city || item.address?.town || item.address?.village || '',
        uf: item.address?.state || '',
        endereco_completo: item.display_name,
        coordenadas: {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }
      })).filter(addr => 
        addr.localidade.toLowerCase().includes('juiz de fora') ||
        addr.uf === 'MG' ||
        addr.endereco_completo.toLowerCase().includes('juiz de fora')
      );
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return [];
    }
  };

  // Buscar sugestões
  const searchAddress = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    let results = [];

    // Se parece CEP, busca por CEP
    if (/^\d{5}-?\d{3}$/.test(searchText.replace(/\s/g, ''))) {
      results = await searchByCep(searchText);
    } else {
      results = await searchByText(searchText);
    }

    setSuggestions(results);
    setLoading(false);
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Selecionar endereço
  const handleSelect = (address) => {
    setSelectedAddress(address);
    setQuery(address.endereco_completo);
    setSuggestions([]);
    
    // Se não tiver coordenadas, busca por CEP
    if (!address.coordenadas && address.cep) {
      searchByCep(address.cep).then(results => {
        if (results.length > 0) {
          const withCoords = { ...address, coordenadas: results[0].coordenadas };
          setSelectedAddress(withCoords);
          onAddressSelect(withCoords);
        } else {
          onAddressSelect(address);
        }
      });
    } else {
      onAddressSelect(address);
    }
  };

  // Limpar seleção
  const handleClear = () => {
    setQuery('');
    setSelectedAddress(null);
    setSuggestions([]);
    onAddressSelect(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o CEP ou endereço completo..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-10 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
        )}
      </div>

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((address, index) => (
            <button
              key={index}
              onClick={() => handleSelect(address)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {address.logradouro}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.bairro && `${address.bairro}, `}
                    {address.localidade} - {address.uf}
                  </div>
                  {address.cep && (
                    <div className="text-xs text-blue-600 font-medium">
                      CEP: {address.cep}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Endereço selecionado */}
      {selectedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">
                Endereço selecionado:
              </div>
              <div className="text-sm text-green-700">
                {selectedAddress.endereco_completo}
              </div>
              {selectedAddress.coordenadas && (
                <div className="text-xs text-green-600 mt-1">
                  📍 Coordenadas: {selectedAddress.coordenadas.lat.toFixed(6)}, {selectedAddress.coordenadas.lon.toFixed(6)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dicas */}
      <div className="mt-2 text-xs text-gray-500">
        <div>💡 Dicas:</div>
        <ul className="mt-1 space-y-1">
          <li>• Digite o CEP para busca rápida e precisa</li>
          <li>• Ou digite o endereço completo</li>
          <li>• A busca prioriza endereços em Juiz de Fora</li>
        </ul>
      </div>
    </div>
  );
};

export default AddressAutocomplete;
