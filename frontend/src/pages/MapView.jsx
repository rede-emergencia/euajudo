import { useEffect, useState } from 'react';
import { 
  MapPin, X, Phone, Clock,
  Home, Store, Truck, 
  UtensilsCrossed, Pill, Droplet, Shirt, Sparkles,
  Filter, Info
} from 'lucide-react';
import Header from '../components/Header';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import IngredientReservationModal from '../components/IngredientReservationModal';
import DeliveryCommitmentModal from '../components/DeliveryCommitmentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import { getProductInfo, getProductText } from '../lib/productUtils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// SVG paths dos ícones Lucide para uso no mapa (mesmos da legenda)
const LUCIDE_ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', // Home
  store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', // Store (similar)
  truck: 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', // Truck
  utensils: 'M3 2v7c0 1.1.9 2 2 2h2v11h2V11h2c1.1 0 2-.9 2-2V2 M16 2v20 M21 15V2', // UtensilsCrossed
  pill: 'M10.5 20.5 3 13l6.5-6.5a7 7 0 1 1 1 1l-6.5 6.5 6.5 6.5a7 7 0 1 1-1-1z', // Pill
  droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z', // Droplet
  shirt: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z', // Shirt
  sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z M20 3v4 M22 5h-4 M4 17v4 M6 19H2' // Sparkles
};

// Cores baseadas no estado (mesmas da legenda)
const STATE_COLORS = {
  available: '#10b981',    // Verde - Disponível / Sem necessidade
  urgent: '#ef4444',       // Vermelho - Urgente / Com pedido ativo
  inTransit: '#3b82f6',    // Azul - Em trânsito
  inactive: '#9ca3af'      // Cinza - Inativo
};

// Cores por tipo de recurso (mesmas da legenda)
const RESOURCE_COLORS = {
  meal: '#f59e0b',         // Âmbar - Marmitas
  medicine: '#ef4444',     // Vermelho - Medicamentos
  hygiene: '#3b82f6',      // Azul - Higiene
  clothing: '#8b5cf6',     // Roxo - Roupas
  cleaning: '#14b8a6'      // Teal - Limpeza
};

// Função para criar ícones Lucide no mapa (consistente com a legenda)
function makeLucideIcon(iconKey, color, size = 30) {
  const svgPath = LUCIDE_ICONS[iconKey] || LUCIDE_ICONS.home;
  
  return L.divIcon({
    html: `<div style="
      background: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border: 2px solid white; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      z-index: 1000;
      position: relative;
    ">
      <svg width="${size * 0.5}" height="${size * 0.5}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="${svgPath}"/>
      </svg>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Função auxiliar para determinar cor baseada no estado
function getStateColor(hasActiveOrder, isInTransit) {
  if (isInTransit) return STATE_COLORS.inTransit;
  if (hasActiveOrder) return STATE_COLORS.urgent;
  return STATE_COLORS.available;
}

// Função auxiliar para determinar tamanho baseado no estado
function getStateSize(hasActiveOrder) {
  return hasActiveOrder ? 32 : 28;
}

export default function MapView() {
  const [activeFilters, setActiveFilters] = useState({ abrigos: true, fornecedores: true, insumos: true });
  const [pendingFilters, setPendingFilters] = useState({ abrigos: true, fornecedores: true, insumos: true });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsWithStatus, setLocationsWithStatus] = useState([]);
  const [providers, setProviders] = useState([]);
  const [resourceRequests, setResourceRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModalChooseLocation, setShowModalChooseLocation] = useState(false);
  const [chosenLocation, setChosenLocation] = useState(null);
  const [quantityToReserve, setQuantityToReserve] = useState(1);
  const [showModalReserveIngredient, setShowModalReserveIngredient] = useState(false);
  const [selectedIngredientRequest, setSelectedIngredientRequest] = useState(null);
  const [showDeliveryCommitmentModal, setShowDeliveryCommitmentModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  const [legendOpen, setLegendOpen] = useState(false);
  const { user } = useAuth(); // Adicionar hook do AuthContext

  // Helper function para mostrar modal de confirmação
  const showConfirmation = (title, message, onConfirm, type = 'info') => {
    setConfirmationData({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setShowConfirmationModal(false);
      },
      type
    });
    setShowConfirmationModal(true);
  };

  // Máquina de Estados: Verifica se usuário tem QUALQUER compromisso ativo
  const getUserActiveCommitments = () => {
    if (!user) return { hasActiveCommitment: true, commitments: [] };
    
    const commitments = [];
    
    // 1. Verificar entregas de marmitas ativas (deliveries)
    const activeDeliveryStatuses = new Set(['available', 'reserved', 'picked_up', 'in_transit']);
    const userActiveDeliveries = deliveries.filter(d => 
      d.volunteer_id === user.id && activeDeliveryStatuses.has(d.status)
    );
    
    if (userActiveDeliveries.length > 0) {
      commitments.push({
        type: 'delivery',
        count: userActiveDeliveries.length,
        description: 'Entrega de marmitas em andamento'
      });
    }
    
    // 2. Verificar reservas de ingredientes ativas (resource requests)
    const activeResourceStatuses = new Set(['reserved', 'in_progress']);
    const userActiveResourceReservations = resourceRequests.filter(r => {
      // Verificar se alguma reserva do request pertence ao usuário
      return r.reservations?.some(res => 
        res.volunteer_id === user.id && activeResourceStatuses.has(res.status)
      );
    });
    
    if (userActiveResourceReservations.length > 0) {
      commitments.push({
        type: 'resource_reservation',
        count: userActiveResourceReservations.length,
        description: 'Reserva de ingredientes em andamento'
      });
    }
    
    return {
      hasActiveCommitment: commitments.length > 0,
      commitments: commitments
    };
  };

  // Helper function simplificada para verificar se usuário está ocioso
  const isUserIdle = () => {
    const { hasActiveCommitment } = getUserActiveCommitments();
    return !hasActiveCommitment;
  };

  useEffect(() => {
    loadData();
    
    // Reload data every 10 seconds to get new requests
    // Recarregar dados a cada 10 segundos para pegar novos pedidos
    const interval = setInterval(() => {
      loadData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Shelter has active order when there is a delivery in progress for it
    if (locations.length > 0) {
      const activeDeliveryStatuses = new Set(['available', 'reserved', 'picked_up', 'in_transit']);
      const updated = locations.map(location => {
        const hasActiveOrder = deliveries.some(d => (
          d.location_id === location.id && activeDeliveryStatuses.has(d.status)
        ));
        return { ...location, hasActiveOrder };
      });
      setLocationsWithStatus(updated);
    }
  }, [locations, deliveries]);

  useEffect(() => {
    console.log('🔄 useEffect disparado - iniciando mapa');
    initMap();
  }, [locationsWithStatus, batches, resourceRequests, providers, activeFilters.abrigos, activeFilters.fornecedores, activeFilters.insumos]);

  const loadData = async () => {
    try {
      console.log('🔄 Carregando dados...');
      
      // Carregar locais de entrega (agora usando locations)
      const responseEntrega = await fetch('http://localhost:8000/api/locations/?active_only=true');
      if (responseEntrega.ok) {
        const data = await responseEntrega.json();
        console.log('📍 Locations carregadas:', data.length);
        setLocations(data);
      }

      // Mostrar pedidos de insumos disponíveis (agora usando resource requests)
      const responseInsumos = await fetch('http://localhost:8000/api/resources/requests?status=requesting');
      if (responseInsumos.ok) {
        const pedidos = await responseInsumos.json();
        setResourceRequests(pedidos);
        console.log('Resource requests loaded:', pedidos);
      }

      // Carregar providers (para poder mostrar provider idle no mapa)
      const responseUsers = await fetch('http://localhost:8000/api/users/');
      if (responseUsers.ok) {
        const users = await responseUsers.json();
        setProviders((users || []).filter(u => String(u.roles || '').includes('provider')));
      }

      // Carregar deliveries para shelters (pedidos de marmita)
      const responseDeliveries = await fetch('http://localhost:8000/api/deliveries/');
      if (responseDeliveries.ok) {
        const pedidos = await responseDeliveries.json();
        console.log('🚚 Deliveries carregados:', pedidos.length);
        setDeliveries(pedidos);
      } else {
        console.error('Erro ao carregar deliveries:', responseDeliveries.status);
      }

      // Carregar lotes de marmitas disponíveis para retirada (agora usando batches)
      const responseBatches = await fetch('http://localhost:8000/api/batches/ready');
      if (responseBatches.ok) {
        const lotes = await responseBatches.json();
        console.log('📦 Batches carregados:', lotes.length);
        setBatches(lotes);
      } else {
        console.error('Erro ao carregar batches:', responseBatches.status);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Usar dados mock em caso de erro
      setLocations([
        {
          id: 1,
          name: "Abrigo Municipal Centro",
          address: "Praça da República, 100 - Centro",
          latitude: -21.7642,
          longitude: -43.3505,
          responsible: "Maria Silva",
          phone: "3236881234",
          daily_need: 80,
          operating_hours: "08:00 - 18:00"
        },
        {
          id: 2,
          name: "Centro de Acolhimento São Sebastião",
          address: "Rua São Sebastião, 200 - São Sebastião",
          latitude: -21.7842,
          longitude: -43.3705,
          responsible: "João Santos",
          phone: "3236992345",
          daily_need: 60,
          operating_hours: "07:00 - 19:00"
        }
      ]);
    }
  };

  const initMap = async () => {
    console.log('🗺️ Inicializando mapa...');
    
    if (typeof window === 'undefined') return;
    
    // Se o mapa já existe, apenas atualizar marcadores
    if (mapInstance) {
      console.log('♻️ Mapa já existe, atualizando marcadores...');
      updateMarkers(mapInstance);
      return;
    }

    try {
      console.log('🆕 Criando novo mapa...');
      
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('❌ Container do mapa não encontrado!');
        return;
      }
      
      // Criar mapa com Leaflet já importado
      const map = L.map('map', {
        center: [-21.7642, -43.3502],
        zoom: 13
      });
      
      // Adicionar tiles do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      
      console.log('✅ Mapa criado com sucesso');
      
      setMapInstance(map);
      setMapLoaded(true);
      
      // Adicionar marcadores
      updateMarkers(map);
      
    } catch (error) {
      console.error('❌ Erro ao criar mapa:', error);
    }
  };
  
  const updateMarkers = (map) => {
    if (!map) return;
    
    console.log('🔄 Atualizando marcadores...');
    console.log('Dados:', {
      locations: locations.length,
      deliveries: deliveries.length,
      batches: batches.length,
      filterType
    });

    // All icons use makeIcon() + getMapIconColor() from shared/enums.json
    // Shelter: house shape, color by status
    // Provider: fork shape, color by status (requesting=orange, ready=green, idle=yellow)

    // Limpar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Adicionar marcadores baseados no filtro
    
    if (activeFilters.abrigos) {
      console.log('🏠 Processando abrigos...');
      
      // Agrupar deliveries por location para mostrar múltiplos tipos de recursos
      const deliveriesByLocation = {};
      deliveries.forEach(delivery => {
        if (!deliveriesByLocation[delivery.location_id]) {
          deliveriesByLocation[delivery.location_id] = [];
        }
        if (['available', 'reserved', 'picked_up', 'in_transit'].includes(delivery.status)) {
          deliveriesByLocation[delivery.location_id].push(delivery);
        }
      });
      
      let shelterMarkers = 0;
      
      // Mostrar todos os abrigos com cores baseadas no estado
      locationsWithStatus.forEach(location => {
        if (location.latitude && location.longitude) {
          const activeDeliveries = deliveriesByLocation[location.id] || [];
          
          const filteredDeliveries = activeDeliveries;
          
          const hasActiveOrder = filteredDeliveries.length > 0;
          
          // Usar ícone Home com cor baseada no estado (consistente com legenda)
          const color = getStateColor(hasActiveOrder, false);
          const size = getStateSize(hasActiveOrder);
          const icon = makeLucideIcon('home', color, size);
          
          const titleColor = hasActiveOrder ? '#ef4444' : '#10b981';
          const statusIcon = hasActiveOrder ? '🔴' : '📍';
          const statusText = hasActiveOrder ? 'Possui pedido ativo' : 'Sem pedido ativo no momento';
          
          // Agrupar por tipo de produto
          const productTypes = {};
          filteredDeliveries.forEach(d => {
            const type = d.product_type || 'meal';
            if (!productTypes[type]) {
              productTypes[type] = { count: 0, quantity: 0 };
            }
            productTypes[type].count++;
            productTypes[type].quantity += d.quantity;
          });
          
          const productTypeLabels = {
            'meal': '🍽️ Marmitas',
            'hygiene': '🧼 Itens Higiênicos',
            'clothing': '👕 Roupas',
            'medicine': '💊 Medicamentos',
            'cleaning': '🧹 Limpeza'
          };
          
          const marker = L.marker([location.latitude, location.longitude], { icon })
            .addTo(map);
          
          shelterMarkers++;
          console.log(`📍 Abrigo adicionado: ${location.name} em [${location.latitude}, ${location.longitude}]`);
          
          let productsHtml = '';
          let buttonsHtml = '';
          
          if (hasActiveOrder) {
            productsHtml = '<div style="margin: 8px 0; padding: 8px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #ef4444;">';
            productsHtml += '<p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #dc2626;">📋 Necessidades Ativas:</p>';
            
            // Mostrar deliveries disponíveis (sem voluntário)
            const availableDeliveries = filteredDeliveries.filter(d => 
              d.status === 'available' && !d.volunteer_id
            );
            
            availableDeliveries.forEach(delivery => {
              const label = productTypeLabels[delivery.product_type] || delivery.product_type;
              productsHtml += `<p style="margin: 2px 0; font-size: 12px; color: #374151;">• ${label}: <strong>${delivery.quantity} unidades</strong></p>`;
              
              // Adicionar botão para cada delivery disponível
              buttonsHtml += `
                <button 
                  ${isUserIdle() ? `onclick="window.commitToDelivery(${delivery.id})"` : ''}
                  style="background: ${isUserIdle() ? '#3b82f6' : '#9ca3af'}; 
                         color: white; 
                         border: none; 
                         padding: 8px 12px; 
                         border-radius: 6px; 
                         cursor: ${isUserIdle() ? 'pointer' : 'not-allowed'}; 
                         font-size: 12px; 
                         width: 100%; 
                         margin-top: 6px; 
                         font-weight: 500;
                         opacity: ${isUserIdle() ? '1' : '0.6'};"
                >
                  ${isUserIdle() ? `🤝 Me Comprometer - ${label}` : '⏳ Compromisso em Andamento'}
                </button>
              `;
            });
            
            productsHtml += '</div>';
          }
          
          marker.bindPopup(`
            <div style="min-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: ${titleColor};">${statusIcon} ${location.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Endereço:</strong> ${location.address}</p>
              ${location.contact_person ? `<p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Responsável:</strong> ${location.contact_person}</p>` : ''}
              ${location.phone ? `<p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Telefone:</strong> ${location.phone}</p>` : ''}
              ${location.operating_hours ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Horário:</strong> ${location.operating_hours}</p>` : ''}
              ${productsHtml}
              ${buttonsHtml}
              ${!hasActiveOrder ? `<p style="margin: 0; font-size: 12px; color: #6b7280; font-style: italic;">📋 ${statusText}</p>` : ''}
            </div>
          `);
        }
      });
      
      console.log(`📍 ${shelterMarkers} marcadores de abrigos criados`);
    }

    // Adicionar marcadores para lotes de produtos disponíveis APENAS se estiverem READY
    if (activeFilters.fornecedores) {
      console.log('🏪 Processando fornecedores com produtos disponíveis...');
      let batchMarkers = 0;

      batches.forEach(batch => {
        // MOSTRAR APENAS FORNECEDORES COM PRODUTOS DISPONÍVEIS (READY)
        if (batch.provider &&
            batch.provider.latitude &&
            batch.provider.longitude &&
            batch.status === 'ready' &&  // Apenas batches prontos!
            batch.quantity_available > 0) { // E com quantidade disponível!

          const coords = [batch.provider.latitude, batch.provider.longitude];
          
          // Definir ícone e emoji baseado no tipo de produto
          const productIcons = {
            'meal': { emoji: '🍽️', label: 'Marmitas', color: '#f59e0b' },
            'hygiene': { emoji: '🧼', label: 'Itens Higiênicos', color: '#3b82f6' },
            'clothing': { emoji: '👕', label: 'Roupas', color: '#8b5cf6' },
            'medicine': { emoji: '💊', label: 'Medicamentos', color: '#ef4444' },
            'cleaning': { emoji: '🧹', label: 'Produtos de Limpeza', color: '#14b8a6' }
          };
          
          const productType = batch.product_type || 'meal';
          const productInfo = productIcons[productType] || productIcons['meal'];
          
          // Usar ícone Store com cor verde (disponível) - consistente com legenda
          const icon = makeLucideIcon('store', STATE_COLORS.available, 30);
          const marker = L.marker(coords, { icon })
            .addTo(map);
          
          batchMarkers++;
          const establishmentType = batch.provider.establishment_type || 'Cozinha';
          console.log(`🏪 ${establishmentType} DISPONÍVEL adicionado: ${batch.provider.name} (${productInfo.label}) em [${coords[0]}, ${coords[1]}]`);
        }
      });
      
      console.log(`🏪 ${batchMarkers} marcadores de fornecedores disponíveis criados`);
    }
    
    console.log('✅ Todos os marcadores foram adicionados ao mapa');

    if (activeFilters.insumos) {
      // Adicionar marcadores para pedidos de insumos
      resourceRequests.forEach(request => {
        // Para pedidos de insumos, o provider está no relacionamento
        if (request.provider && request.provider.latitude && request.provider.longitude) {
          const coords = [request.provider.latitude, request.provider.longitude];
          
          // Calcular quantidades já reservadas
          const itemsWithStatus = (request.items || []).map(item => {
            const quantityAvailable = item.quantity - (item.quantity_reserved || 0);
            const isCompletelyReserved = quantityAvailable <= 0;
            
            return {
              ...item,
              quantityAvailable,
              isCompletelyReserved
            };
          });
          
          // Verificar se algum item ainda tem quantidade disponível
          const hasItemsAvailable = itemsWithStatus.some(item => !item.isCompletelyReserved);
          const isCompletelyReserved = !hasItemsAvailable;
          
          // Usar ícone Store com cor baseada no estado
          const color = isCompletelyReserved ? STATE_COLORS.inactive : STATE_COLORS.urgent;
          const icon = makeLucideIcon('store', color, 30);
          const titleColor = isCompletelyReserved ? '#eab308' : '#3b82f6';
          const statusText = isCompletelyReserved ? '⏳ Reservado' : '🛒 Disponível';
          
          const marker = L.marker(coords, { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 300px;">
                <h3 style="margin: 0 0 8px 0; color: ${titleColor};">${statusText} - Pedido de Insumos</h3>
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Cozinha:</strong> ${request.provider.name}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Para produzir:</strong> ${request.quantity_meals} marmitas</p>
                
                <div style="margin: 8px 0;">
                  <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold;">Ingredientes necessários:</h4>
                  ${itemsWithStatus.map(item => `
                    <div style="margin: 2px 0; padding: 4px; background: ${item.isCompletelyReserved ? '#fef3c7' : '#f0f9ff'}; border-radius: 4px; font-size: 12px;">
                      <strong>${item.name}:</strong> 
                      <span style="color: ${item.isCompletelyReserved ? '#d97706' : '#1e40af'}">
                        ${item.quantityAvailable}${item.unit} disponíveis
                      </span>
                      ${item.quantityAvailable < item.quantity ? 
                        `<span style="color: #6b7280;"> (de ${item.quantity}${item.unit} total)</span>` : ''
                      }
                    </div>
                  `).join('')}
                </div>
                
                ${!isCompletelyReserved ? `
                  <button 
                    ${isUserIdle() ? `onclick="window.acceptIngredientRequest(${request.id})"` : ''}
                    style="background: ${isUserIdle() ? '#3b82f6' : '#9ca3af'}; 
                           color: white; 
                           border: none; 
                           padding: 8px 12px; 
                           border-radius: 4px; 
                           cursor: ${isUserIdle() ? 'pointer' : 'not-allowed'}; 
                           font-size: 12px; 
                           width: 100%; 
                           margin-top: 8px;
                           opacity: ${isUserIdle() ? '1' : '0.6'};"
                  >
                    ${isUserIdle() ? 'Quero Fornecer Parte' : '⏳ Compromisso em Andamento'}
                  </button>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; text-align: center; font-style: italic;">
                    ${isUserIdle() ? 'Você pode fornecer apenas parte dos ingredientes' : 'Finalize seu compromisso atual para criar um novo'}
                  </p>
                ` : `
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #eab308; text-align: center; font-style: italic;">
                    Todos os ingredientes já foram reservados
                  </p>
                `}
              </div>
            `);
        }
      });

      // Adicionar marcadores para lotes de produtos disponíveis
    }

    // Adicionar marcadores para lotes de produtos disponíveis
    if (activeFilters.fornecedores) {
      batches.forEach(batch => {
        if (batch.provider && batch.provider.latitude && batch.provider.longitude) {
          const coords = [batch.provider.latitude, batch.provider.longitude];
          
          // Definir ícone e emoji baseado no tipo de produto
          const productIcons = {
            'meal': { emoji: '🍽️', label: 'Marmitas', color: '#10b981' },
            'hygiene': { emoji: '🧼', label: 'Itens Higiênicos', color: '#3b82f6' },
            'clothing': { emoji: '👕', label: 'Roupas', color: '#8b5cf6' },
            'medicine': { emoji: '💊', label: 'Medicamentos', color: '#ec4899' },
            'cleaning': { emoji: '🧹', label: 'Produtos de Limpeza', color: '#14b8a6' }
          };
          
          const productType = batch.product_type || 'meal';
          const productInfo = productIcons[productType] || productIcons['meal'];
          
          // Usar ícone Store com cor verde (disponível) - consistente com legenda
          const icon = makeLucideIcon('store', STATE_COLORS.available, 30);
          const marker = L.marker(coords, { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: ${productInfo.color}; font-size: 16px;">${productInfo.emoji} Fornecedor Ofertando ${productInfo.label}</h3>
                <div style="background: #dcfce7; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                  <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>🏪 Cozinha:</strong> ${batch.provider.name}</p>
                  <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📦 Disponível:</strong> ${batch.quantity_available || batch.quantity} marmitas</p>
                  <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📍 Retirar em:</strong> ${batch.provider.address}</p>
                  ${batch.provider.phone ? `<p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📞 Contato:</strong> ${batch.provider.phone}</p>` : ''}
                  ${batch.pickup_deadline ? `<p style="margin: 0 0 6px 0; font-size: 14px;"><strong>⏰ Retirar até:</strong> ${batch.pickup_deadline}</p>` : ''}
                  ${batch.description ? `<p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">"${batch.description}"</p>` : ''}
                </div>
                <div style="background: #fef2f2; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                  <p style="margin: 0; font-size: 12px; color: #dc2626; text-align: center;">
                    ⚠️ Expira em: ${batch.expires_at ? new Date(batch.expires_at).toLocaleString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '4h'}
                  </p>
                </div>
                
                <button ${isUserIdle() ? `onclick="window.reserveBatch(${batch.id})"` : ''} 
                        style="background: ${isUserIdle() ? '#059669' : '#9ca3af'}; 
                               color: white; 
                               border: none; 
                               padding: 10px 16px; 
                               border-radius: 6px; 
                               cursor: ${isUserIdle() ? 'pointer' : 'not-allowed'}; 
                               font-size: 13px; 
                               font-weight: 600; 
                               width: 100%; 
                               transition: background 0.2s; 
                               opacity: ${isUserIdle() ? '1' : '0.6'};" 
                        ${isUserIdle() ? 'onmouseover="this.style.background=\'#047857\'" onmouseout="this.style.background=\'#059669\'"' : ''}>
                  ${isUserIdle() ? '🚚 Quero Entregar' : '⏳ Entrega em Andamento'}
                </button>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280; text-align: center;">
                  ${isUserIdle() ? 'Você escolherá o abrigo de destino' : 'Finalize sua entrega atual para criar uma nova'}
                </p>
              </div>
            `);
        }
      });

      // NÃO MOSTRAR MAIS FORNECEDORES IDLE (amarelos)
      // Apenas fornecedores com produtos disponíveis (READY) aparecem no mapa
    }

    setMapLoaded(true);
  };

  // Adicionar função global para seleção de locais
  useEffect(() => {
    window.selectLocation = (location, type) => {
      setSelectedLocation(location);
      setSelectedType(type);
    };
    
    window.acceptIngredientRequest = async (requestId) => {
      if (!user) {
        showConfirmation(
          'Login Necessário',
          'Você precisa estar logado como voluntário para aceitar pedidos',
          () => setShowLoginModal(true),
          'warning'
        );
        return;
      }
      
      if (!user.roles.includes('volunteer') && !user.roles.includes('volunteer_comprador')) {
        showConfirmation(
          'Acesso Restrito',
          'Apenas voluntários podem aceitar pedidos de insumos',
          () => {},
          'error'
        );
        return;
      }

      // Verificar se usuário tem algum compromisso ativo usando máquina de estados
      const { hasActiveCommitment, commitments } = getUserActiveCommitments();
      if (hasActiveCommitment) {
        const commitmentDescriptions = commitments.map(c => `• ${c.description}`).join('\n');
        showConfirmation(
          '⚠️ Compromisso em Andamento',
          `Você já possui compromisso(s) ativo(s):\n\n${commitmentDescriptions}\n\nPor favor, finalize seu compromisso atual antes de criar um novo.`,
          () => {},
          'warning'
        );
        return;
      }
      
      // Buscar o pedido completo com itens
      const request = resourceRequests.find(r => r.id === requestId);
      if (request) {
        setSelectedIngredientRequest(request);
        setShowModalReserveIngredient(true);
      }
    };

    window.reserveBatch = (batchId) => {
      if (!user) {
        showConfirmation(
          'Login Necessário',
          'Você precisa estar logado para reservar entregas',
          () => setShowLoginModal(true),
          'warning'
        );
        return;
      }

      // Verificar se usuário tem algum compromisso ativo usando máquina de estados
      const { hasActiveCommitment, commitments } = getUserActiveCommitments();
      if (hasActiveCommitment) {
        const commitmentDescriptions = commitments.map(c => `• ${c.description}`).join('\n');
        showConfirmation(
          '⚠️ Compromisso em Andamento',
          `Você já possui compromisso(s) ativo(s):\n\n${commitmentDescriptions}\n\nPor favor, finalize seu compromisso atual antes de criar um novo.`,
          () => {},
          'warning'
        );
        return;
      }

      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        setSelectedBatch(batchId);
        setShowModalChooseLocation(true);
      }
    };

    window.commitToDelivery = async (deliveryId) => {
      if (!user) {
        showConfirmation(
          'Login Necessário',
          'Você precisa estar logado como voluntário para se comprometer com entregas',
          () => setShowLoginModal(true),
          'warning'
        );
        return;
      }
      
      if (!user.roles.includes('volunteer')) {
        showConfirmation(
          'Acesso Restrito',
          'Apenas voluntários podem se comprometer com entregas',
          () => {},
          'error'
        );
        return;
      }

      // Verificar se usuário tem algum compromisso ativo usando máquina de estados
      const { hasActiveCommitment, commitments } = getUserActiveCommitments();
      if (hasActiveCommitment) {
        const commitmentDescriptions = commitments.map(c => `• ${c.description}`).join('\n');
        showConfirmation(
          '⚠️ Compromisso em Andamento',
          `Você já possui compromisso(s) ativo(s):\n\n${commitmentDescriptions}\n\nPor favor, finalize seu compromisso atual antes de criar um novo.`,
          () => {},
          'warning'
        );
        return;
      }
      
      // Buscar o delivery completo
      const delivery = deliveries.find(d => d.id === deliveryId);
      if (delivery) {
        setSelectedDelivery(delivery);
        setShowDeliveryCommitmentModal(true);
      }
    };
    
    return () => {
      delete window.acceptIngredientRequest;
      delete window.reserveBatch;
      delete window.commitToDelivery;
    };
  }, [resourceRequests, batches, deliveries, user]);

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  };

  const openRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const handleDeliveryCommitment = async (deliveryId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/deliveries/${deliveryId}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao se comprometer com a entrega');
      }

      const committedDelivery = await response.json();
      const productInfo = getProductInfo(delivery.product_type);
      
      showConfirmation(
        '✅ Compromisso Confirmado!',
        `Você tem 24 horas para entregar ${getProductText(delivery.product_type, quantity)}. Código de confirmação: ${committedDelivery.delivery_code}`,
        () => {
          // Recarregar dados após fechar modal
          loadData();
        },
        'success'
      );
      await loadData();
      
      // Fechar modal
      setShowDeliveryCommitmentModal(false);
      setSelectedDelivery(null);
      
    } catch (error) {
      console.error('Erro ao se comprometer:', error);
      throw error;
    }
  };

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  // Filtrar e ordenar locais por distância e compatibilidade com quantidade
  const getLocationsForDelivery = () => {
    if (!selectedBatch) return [];
    
    // Encontrar o batch selecionado para obter coordenadas do restaurante
    const batch = batches.find(b => b.id === selectedBatch);
    if (!batch || !batch.provider) return [];
    
    const restLat = batch.provider.latitude;
    const restLon = batch.provider.longitude;
    
    // Filtrar apenas locais com pedidos em aberto
    const locationsWithOrder = locationsWithStatus.filter(location => location.hasActiveOrder);
    
    // Adicionar compatibilidade e calcular distância
    const locationsWithInfo = locationsWithOrder.map(location => {
      const shelterOrder = deliveries.find(d => d.location_id === location.id);
      const shelterNeed = shelterOrder?.quantity || 25;
      const maxToReserve = Math.min(batch.quantity_available, shelterNeed);
      const canTakeAll = maxToReserve === shelterNeed; // Se pode levar tudo que o abrigo precisa
      
      return {
        ...location,
        distance: calculateDistance(restLat, restLon, location.latitude, location.longitude),
        shelterNeed,
        maxToReserve,
        canTakeAll
      };
    });
    
    // Ordenar por prioridade:
    // 1. Locais onde pode levar tudo (mais próximos primeiro)
    // 2. Locais onde não pode levar tudo (mais próximos primeiro)
    const sortedLocations = [
      ...locationsWithInfo.filter(l => l.canTakeAll).sort((a, b) => a.distance - b.distance),
      ...locationsWithInfo.filter(l => !l.canTakeAll).sort((a, b) => a.distance - b.distance)
    ];
    
    return sortedLocations;
  };

  const confirmReservation = async () => {
    if (!chosenLocation) {
      showConfirmation(
        'Local Não Selecionado',
        'Por favor, escolha um local de entrega',
        () => {},
        'warning'
      );
      return;
    }

    // Verificação de segurança: garantir que usuário ainda está ocioso
    const { hasActiveCommitment, commitments } = getUserActiveCommitments();
    if (hasActiveCommitment) {
      const commitmentDescriptions = commitments.map(c => `• ${c.description}`).join('\n');
      showConfirmation(
        '⚠️ Compromisso em Andamento',
        `Você já possui compromisso(s) ativo(s):\n\n${commitmentDescriptions}\n\nPor favor, finalize seu compromisso atual antes de criar um novo.`,
        () => {
          setShowModalChooseLocation(false);
          setSelectedBatch(null);
          setChosenLocation(null);
        },
        'warning'
      );
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/deliveries/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batch_id: selectedBatch,
          location_id: chosenLocation,
          quantity: quantityToReserve
        })
      });
      
      if (response.ok) {
        const delivery = await response.json();
        const pickupCode = delivery.pickup_code;
        const deliveryCode = delivery.delivery_code || 'Será gerado após retirada';
        const productInfo = getProductInfo(selectedBatch.product_type);
        const location = getProductLocation(selectedBatch.product_type);
        
        showConfirmation(
          '✅ Entrega Criada com Sucesso!',
          `📋 Seus códigos:\n\n🏪 CÓDIGO DE RETIRADA: ${pickupCode}\n   Use este código na ${location} para ${getProductAction(selectedBatch.product_type)}\n\n🏠 CÓDIGO DE ENTREGA: ${deliveryCode}\n   Use este código no abrigo para confirmar a entrega\n\n📍 Próximos passos:\n1. Vá até a ${location} e informe o código de retirada\n2. ${getProductAction(selectedBatch.product_type).charAt(0).toUpperCase() + getProductAction(selectedBatch.product_type).slice(1)}\n3. Leve até o abrigo escolhido\n4. Informe o código de entrega no abrigo`,
          () => {
            setShowModalChooseLocation(false);
            setSelectedBatch(null);
            setChosenLocation(null);
            loadData();
          },
          'success'
        );
        
        setShowModalChooseLocation(false);
        setSelectedBatch(null);
        setChosenLocation(null);
        setQuantityToReserve(1);
        loadData();
      } else {
        const error = await response.json();
        showConfirmation(
          '❌ Erro ao Reservar',
          error.detail || 'Erro desconhecido',
          () => {},
          'error'
        );
      }
    } catch (error) {
      console.error('Erro ao reservar:', error);
      showConfirmation(
        '❌ Erro ao Reservar',
        'Tente novamente.',
        () => {},
        'error'
      );
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Header
        onLoginClick={openLoginModal}
        onRegisterClick={openRegisterModal}
      />

      {/* Map */}
      <div id="map" style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        position: 'absolute',
        top: '60px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      }}></div>

      {/* Legend — bottom-left, collapsible on mobile */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
      }}>
        {/* Toggle button (always visible) */}
        <button
          onClick={() => setLegendOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          <MapPin size={14} color="#2563eb" />
          Legenda
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{legendOpen ? '▼' : '▲'}</span>
        </button>

        {/* Legend panel */}
        {legendOpen && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            width: '200px',
          }}>
            {/* Abrigos */}
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Abrigos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Sem pedido ativo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ef4444', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Com pedido ativo</span>
              </div>
            </div>

            {/* Fornecedores */}
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fornecedores</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>🍽️ Cozinha</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  <svg width="11" height="11" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>⚕️ Farmácia</span>
              </div>
            </div>

            {/* Cores de status */}
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { color: '#10b981', label: 'Disponível' },
                { color: '#f97316', label: 'Solicitando' },
                { color: '#eab308', label: 'Ocioso' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#374151' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter button — bottom-center */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Panel (opens above the button) */}
        {showFilterPanel && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            width: '252px',
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mostrar no mapa
            </p>

            {[
              { key: 'abrigos',      emoji: '🏠', label: 'Abrigos precisando de ajuda' },
              { key: 'fornecedores', emoji: '🍽️', label: 'Fornecedores com itens' },
              { key: 'insumos',      emoji: '📦', label: 'Pedidos de insumos' },
            ].map(({ key, emoji, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: pendingFilters[key] ? '#f0fdf4' : 'transparent',
                  marginBottom: '4px',
                  transition: 'background 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={pendingFilters[key]}
                  onChange={() => setPendingFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                  style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: pendingFilters[key] ? '600' : '400' }}>
                  {emoji} {label}
                </span>
              </label>
            ))}

            {/* Ações */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
              <button
                onClick={() => {
                  setPendingFilters({ abrigos: true, fornecedores: true, insumos: true });
                  setActiveFilters({ abrigos: true, fornecedores: true, insumos: true });
                  setShowFilterPanel(false);
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Remover filtros
              </button>
              <button
                onClick={() => {
                  setActiveFilters({ ...pendingFilters });
                  setShowFilterPanel(false);
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#1d4ed8',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => {
            if (!showFilterPanel) setPendingFilters({ ...activeFilters });
            setShowFilterPanel(o => !o);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: showFilterPanel ? '#1d4ed8' : 'white',
            color: showFilterPanel ? 'white' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtros
          {Object.values(activeFilters).some(v => !v) && (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
              {Object.values(activeFilters).filter(v => !v).length}
            </span>
          )}
        </button>
      </div>

      {/* Modal de Escolha de Local de Entrega */}
      {showModalChooseLocation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            height: window.innerWidth <= 768 ? '80vh' : '70vh',
            maxHeight: window.innerWidth <= 768 ? '80vh' : '70vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                📍 Locais com Pedidos em Aberto
              </h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                Apenas abrigos necessitando marmitas (ordenados por distância)
              </p>
            </div>

            <div style={{ 
              padding: '20px',
              flex: 1,
              overflow: 'auto',
              minHeight: 0
            }}>
              {/* Info do Lote e Quantidade */}
              {selectedBatch && (() => {
                const batch = batches.find(b => b.id === selectedBatch);
                const location = chosenLocation ? locationsWithStatus.find(l => l.id === chosenLocation) : null;
                if (!batch) return null;
                
                const shelterOrder = chosenLocation ? deliveries.find(d => d.location_id === chosenLocation) : null;
                const shelterNeed = shelterOrder?.quantity || 25;
                const maxToReserve = Math.min(batch.quantity_available, shelterNeed);
                
                return (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #bae6fd'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
                      📦 Informações da Reserva
                    </h4>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Restaurante tem</p>
                        <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#0284c7' }}>
                          {batch.quantity_available} marmitas
                        </p>
                      </div>
                      {location && (
                        <div>
                          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Abrigo precisa</p>
                          <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>
                            {shelterNeed} marmitas
                          </p>
                        </div>
                      )}
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>Você pode levar</p>
                        <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                          até {maxToReserve}
                        </p>
                      </div>
                    </div>
                    
                    {chosenLocation && (
                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '6px'
                        }}>
                          Quantidade a Entregar (máx: {maxToReserve})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="number"
                            min="1"
                            max={maxToReserve}
                            value={quantityToReserve}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setQuantityToReserve(Math.min(Math.max(val, 1), maxToReserve));
                            }}
                            style={{
                              width: '100px',
                              padding: '10px 12px',
                              border: '2px solid #3b82f6',
                              borderRadius: '8px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>
                            de {maxToReserve} disponíveis
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                          💡 Dica: Motoboy pode levar poucas, carro pode levar mais
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const filteredLocations = getLocationsForDelivery();
                return filteredLocations.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
                    Nenhum local com pedidos em aberto disponível no momento
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      onClick={() => setChosenLocation(location.id)}
                      style={{
                        padding: '16px',
                        border: chosenLocation === location.id ? '2px solid #10b981' : '1px solid #d1d5db',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        backgroundColor: chosenLocation === location.id ? '#f0fdf4' : 'white',
                        transition: 'all 0.2s',
                        borderLeft: location.canTakeAll ? '4px solid #10b981' : '4px solid #f59e0b',
                        boxShadow: chosenLocation === location.id ? '0 4px 6px -1px rgba(16, 185, 129, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: chosenLocation === location.id ? '6px solid #10b981' : '2px solid #d1d5db',
                          flexShrink: 0,
                          marginTop: '2px'
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', flex: 1 }}>
                              {location.name}
                              {location.canTakeAll && (
                                <span style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '10px',
                                  marginLeft: '8px',
                                  fontWeight: 'normal'
                                }}>
                                  ✅ Ideal
                                </span>
                              )}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                              <span style={{ 
                                backgroundColor: location.canTakeAll ? '#10b981' : '#f59e0b', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                📍 {location.distance.toFixed(1)} km
                              </span>
                              <span style={{
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 'medium'
                              }}>
                                Precisa: {location.shelterNeed}
                              </span>
                            </div>
                          </div>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                            📍 {location.address}
                          </p>
                          {location.responsible && (
                            <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#6b7280' }}>
                              👤 {location.responsible}
                            </p>
                          )}
                          {location.phone && (
                            <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                              📞 {location.phone}
                            </p>
                          )}
                          {location.canTakeAll ? (
                            <div style={{
                              backgroundColor: '#f0fdf4',
                              padding: '8px',
                              borderRadius: '6px',
                              marginTop: '8px',
                              border: '1px solid #bbf7d0'
                            }}>
                              <p style={{ margin: 0, fontSize: '11px', color: '#166534', fontWeight: 'medium', lineHeight: '1.3' }}>
                                🎯 **Perfeito!** Você pode levar todas as {location.shelterNeed} marmitas que este abrigo precisa em uma única entrega.
                              </p>
                            </div>
                          ) : (
                            <div style={{
                              backgroundColor: '#fef3c7',
                              padding: '8px',
                              borderRadius: '6px',
                              marginTop: '8px',
                              border: '1px solid #fde68a'
                            }}>
                              <p style={{ margin: 0, fontSize: '11px', color: '#92400e', fontWeight: 'medium', lineHeight: '1.3' }}>
                                ⚠️ Você pode levar até {location.maxToReserve} de {location.shelterNeed} marmitas. O restante precisará de outro voluntário.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                );
              })()}
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              flexShrink: 0
            }}>
              <button
                onClick={() => {
                  setShowModalChooseLocation(false);
                  setSelectedBatch(null);
                  setChosenLocation(null);
                  setQuantityToReserve(1);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 'medium',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmReservation}
                disabled={!chosenLocation}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: chosenLocation ? '#10b981' : '#d1d5db',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'medium',
                  cursor: chosenLocation ? 'pointer' : 'not-allowed'
                }}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reserva de Ingredientes */}
      {showModalReserveIngredient && selectedIngredientRequest && (
        <IngredientReservationModal
          request={selectedIngredientRequest}
          onClose={() => {
            setShowModalReserveIngredient(false);
            setSelectedIngredientRequest(null);
          }}
          onSuccess={() => {
            loadData(); // Recarregar dados para atualizar o mapa
          }}
        />
      )}

      {/* Modal de Login */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal}
          onClose={closeModals} 
          onSwitchToRegister={openRegisterModal}
        />
      )}

      {/* Modal de Registro */}
      {showRegisterModal && (
        <RegisterModal 
          isOpen={showRegisterModal}
          onClose={closeModals} 
          onSwitchToLogin={openLoginModal}
        />
      )}

      {/* Modal de Reserva de Ingredientes */}
      {showModalReserveIngredient && selectedIngredientRequest && (
        <IngredientReservationModal
          request={selectedIngredientRequest}
          onClose={() => {
            setShowModalReserveIngredient(false);
            setSelectedIngredientRequest(null);
          }}
          onSuccess={() => {
            loadData(); // Recarregar dados para atualizar o mapa
          }}
        />
      )}

      {/* Modal de Compromisso de Delivery */}
      {showDeliveryCommitmentModal && selectedDelivery && (
        <DeliveryCommitmentModal
          delivery={selectedDelivery}
          onClose={() => {
            setShowDeliveryCommitmentModal(false);
            setSelectedDelivery(null);
          }}
          onCommit={handleDeliveryCommitment}
        />
      )}

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={confirmationData.onConfirm}
        title={confirmationData.title}
        message={confirmationData.message}
        type={confirmationData.type}
      />
    </div>
  );
}

<style jsx>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style>
