import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin, X, Phone, Clock,
  Home, Store, Truck, LayoutDashboard,
  UtensilsCrossed, Pill, Droplet, Shirt, Sparkles,
  Filter, Info
} from 'lucide-react';
import Header from '../components/Header';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import IngredientReservationModal from '../components/IngredientReservationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import CommitmentSuccessModal from '../components/CommitmentSuccessModal';
import DeliveryCommitmentModal from '../components/DeliveryCommitmentModal';
import UserStateWidget from '../components/UserStateWidget';
import { useAuth } from '../contexts/AuthContext';
import { useUserState } from '../contexts/UserStateContext';
import { getProductInfo, getProductText, getProductLocation, getProductAction } from '../lib/productUtils';
import { formatProductWithQuantity } from '../shared/enums';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CSS para melhorar renderização em dispositivos móveis (iPhone/Safari)
const mobileMapCSS = `
  /* Melhorar renderização do mapa em dispositivos móveis */
  #map {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-perspective: 1000;
    perspective: 1000;
  }
  
  /* Evitar blurry em iPhone */
  .leaflet-container {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
  
  /* Melhorar tiles em retina displays */
  .leaflet-tile {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  /* iOS Safari specific */
  @supports (-webkit-touch-callout: none) {
    .leaflet-container {
      -webkit-transform: scale(1) translate3d(0, 0, 0);
      transform: scale(1) translate3d(0, 0, 0);
    }
  }
`;

// Inserir CSS no documento
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mobileMapCSS;
  document.head.appendChild(style);
}

// Sistema de modal único padronizado implementado

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// SVG paths dos ícones personalizados para o mapa
const CUSTOM_ICONS = {
  // Abrigo - Casa com coração (acolhimento)
  shelter: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10 M12 11l-2-2 M12 11l2-2 M10 9l2-2 M14 9l-2-2', // Casa com coração
  
  // Restaurante - Prato/utensílios (alimentação)
  restaurant: 'M3 2v7c0 1.1.9 2 2 2h2v11h2V11h2c1.1 0 2-.9 2-2V2 M16 2v20 M21 15V2 M6 6h12 M6 4h12', // Restaurante/utensílios
  
  // Ícones Lucide para legenda (mantidos para compatibilidade)
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  store: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  truck: 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h2v11h2V11h2c1.1 0 2-.9 2-2V2 M16 2v20 M21 15V2',
  pill: 'M10.5 20.5 3 13l6.5-6.5a7 7 0 1 1 1 1l-6.5 6.5 6.5 6.5a7 7 0 1 1-1-1z',
  droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  shirt: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
  sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z M20 3v4 M22 5h-4 M4 17v4 M6 19H2'
};

// Cores baseadas no estado (mesmas da legenda)
const STATE_COLORS = {
  available: '#10b981',    // Verde - Disponível / Sem necessidade
  urgent: '#ef4444',       // Vermelho - Urgente / Com pedido ativo
  inTransit: '#3b82f6',    // Azul - Em trânsito
  inactive: '#9ca3af',      // Cinza - Inativo
  participant: '#f97316'    // Laranja - Participante com reserva ativa
};

// Cores específicas para tipos de localização
const LOCATION_COLORS = {
  shelter: '#8b5cf6',      // Roxo - Abrigos (acolhimento)
  restaurant: '#f59e0b',   // Âmbar - Restaurantes (alimentação)
  provider: '#f59e0b',     // Âmbar - Fornecedores (legado)
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
  const svgPath = CUSTOM_ICONS[iconKey] || CUSTOM_ICONS.home;
  
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

// Função auxiliar para determinar ícone e cor baseados no tipo de localização
function getLocationIconAndColor(location, hasActiveOrder, isInTransit) {
  const baseColor = getStateColor(hasActiveOrder, isInTransit);
  const size = getStateSize(hasActiveOrder);
  
  // Determinar tipo e ícone baseado no tipo de usuário
  if (location.user?.roles?.includes('shelter')) {
    return {
      icon: makeCustomIcon('shelter', LOCATION_COLORS.shelter, size),
      color: LOCATION_COLORS.shelter,
      type: 'shelter'
    };
  }
  
  if (location.user?.roles?.includes('provider')) {
    // Verificar se é restaurante pelo establishment_type
    const establishmentType = location.user?.establishment_type?.toLowerCase() || '';
    if (establishmentType.includes('restaurante') || establishmentType.includes('cozinha')) {
      return {
        icon: makeCustomIcon('restaurant', LOCATION_COLORS.restaurant, size),
        color: LOCATION_COLORS.restaurant,
        type: 'restaurant'
      };
    }
    
    // Outros tipos de fornecedores
    return {
      icon: makeCustomIcon('store', LOCATION_COLORS.provider, size),
      color: LOCATION_COLORS.provider,
      type: 'provider'
    };
  }
  
  // Padrão
  return {
    icon: makeCustomIcon('home', baseColor, size),
    color: baseColor,
    type: 'default'
  };
}

// Função auxiliar para determinar cor baseada no estado
function getStateColor(hasActiveOrder, isInTransit) {
  if (isInTransit) return STATE_COLORS.inTransit;
  if (hasActiveOrder) return STATE_COLORS.urgent;
  return STATE_COLORS.available;
}

// Função escalável para calcular estado baseado no usuário
function getUserBasedState(location, user, filteredDeliveries) {
  // Verificar se há deliveries disponíveis (sem volunteer)
  const availableDeliveries = filteredDeliveries.filter(d => d.status === 'available' && !d.volunteer_id);
  const hasActiveOrder = filteredDeliveries.length > 0;
  const hasAvailableItems = availableDeliveries.length > 0;
  const isCompletelyReserved = hasActiveOrder && !hasAvailableItems;
  
  // Verificar se o usuário atual tem reserva neste local
  const userDeliveries = filteredDeliveries.filter(d => d.volunteer_id === user?.id);
  const hasUserReservation = userDeliveries.length > 0;
  const hasUserCompletedDelivery = userDeliveries.some(d => d.status === 'delivered');
  
  // Debug logs
  console.log(`🔍 DEBUG STATE - Location ${location.id}:`, {
    userId: user?.id,
    totalDeliveries: filteredDeliveries.length,
    userDeliveries: userDeliveries.length,
    hasUserReservation,
    hasUserCompletedDelivery,
    userDeliveryDetails: userDeliveries.map(d => ({ id: d.id, status: d.status, quantity: d.quantity }))
  });
  
  // Retornar estado baseado na prioridade do usuário
  if (hasUserReservation && !hasUserCompletedDelivery) {
    console.log(`🟠 CAMINHO LARANJA - Location ${location.id}: Usuário tem reserva ativa`);
    return {
      color: STATE_COLORS.participant,  // 🟠 Laranja
      size: getStateSize(true),
      titleColor: '#f97316',
      statusIcon: '🤝',
      statusText: '🟠 Você tem reserva ativa',
      hasUserReservation: true,
      hasUserCompletedDelivery: false,
      isCompletelyReserved: false,
      hasAvailableItems: hasAvailableItems
    };
  } else if (hasUserCompletedDelivery) {
    console.log(`🟢 CAMINHO VERDE COMPLETADO - Location ${location.id}: Usuário completou entrega`);
    return {
      color: STATE_COLORS.available,    // 🟢 Verde
      size: getStateSize(false),
      titleColor: '#10b981',
      statusIcon: '✅',
      statusText: '✅ Entrega completada',
      hasUserReservation: true,
      hasUserCompletedDelivery: true,
      isCompletelyReserved: false,
      hasAvailableItems: false
    };
  } else if (isCompletelyReserved) {
    console.log(`🟢 CAMINHO VERDE RESERVADO - Location ${location.id}: Tudo reservado (público)`);
    return {
      color: STATE_COLORS.available,    // 🟢 Verde (público)
      size: getStateSize(false),
      titleColor: '#10b981',
      statusIcon: '📍',
      statusText: '✅ Tudo reservado',
      hasUserReservation: false,
      hasUserCompletedDelivery: false,
      isCompletelyReserved: true,
      hasAvailableItems: false
    };
  } else if (hasActiveOrder) {
    console.log(`🔴 CAMINHO VERMELHO - Location ${location.id}: Pedido em aberto (público)`);
    return {
      color: STATE_COLORS.urgent,       // 🔴 Vermelho
      size: getStateSize(true),
      titleColor: '#ef4444',
      statusIcon: '🔴',
      statusText: '🔴 Pedido em aberto',
      hasUserReservation: false,
      hasUserCompletedDelivery: false,
      isCompletelyReserved: false,
      hasAvailableItems: hasAvailableItems
    };
  } else {
    console.log(`🟢 CAMINHO VERDE DISPONÍVEL - Location ${location.id}: Disponível (público)`);
    return {
      color: STATE_COLORS.available,    // 🟢 Verde
      size: getStateSize(false),
      titleColor: '#10b981',
      statusIcon: '📍',
      statusText: '✅ Disponível',
      hasUserReservation: false,
      hasUserCompletedDelivery: false,
      isCompletelyReserved: false,
      hasAvailableItems: false
    };
  }
}

// Função auxiliar para determinar tamanho baseado no estado
function getStateSize(hasActiveOrder) {
  return hasActiveOrder ? 32 : 28;
}

export default function MapView() {
  const [searchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState({ abrigos: true, fornecedores: true, insumos: true });
  const [pendingFilters, setPendingFilters] = useState({ abrigos: true, fornecedores: true, insumos: true });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('legend'); // 'legend' ou 'filters'
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
  const [isConfirming, setIsConfirming] = useState(false);
  const [commitmentStep, setCommitmentStep] = useState('select'); // 'select' ou 'confirm'
  const [showModalReserveIngredient, setShowModalReserveIngredient] = useState(false);
  const [selectedIngredientRequest, setSelectedIngredientRequest] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCommitmentSuccess, setShowCommitmentSuccess] = useState(false);
  const [committedDeliveryData, setCommittedDeliveryData] = useState(null);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [selectedLocationForCommitment, setSelectedLocationForCommitment] = useState(null);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'info'
  });
  const { user } = useAuth();
  const { userState, refreshState } = useUserState();
  const navigate = useNavigate();

  const getDashboardRoute = () => {
    if (user?.roles?.includes('provider')) return '/dashboard/fornecedor';
    if (user?.roles?.includes('shelter')) return '/dashboard/abrigo';
    if (user?.roles?.includes('volunteer')) return '/dashboard/voluntario';
    return '/dashboard';
  };

  // Helper function para verificar se usuário pode fazer deliveries
  const canUserDoDeliveries = () => {
    return user && user.roles.includes('volunteer');
  };

  // Helper function para verificar se usuário pode aceitar pedidos de insumos
  const canUserAcceptIngredients = () => {
    return user && (user.roles.includes('volunteer') || user.roles.includes('volunteer_comprador'));
  };

  // Helper function para verificar se usuário pode reservar lotes
  const canUserReserveBatches = () => {
    return user && (user.roles.includes('provider') || user.roles.includes('volunteer'));
  };

  // Helper function para mostrar modal de confirmação
  const showConfirmation = (title, message, onConfirm, type = 'info', showOnlyOk = false) => {
    setConfirmationData({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setShowConfirmationModal(false);
      },
      type,
      showOnlyOk
    });
    setShowConfirmationModal(true);
  };

  // Helper function simplificada para verificar se usuário está ocioso
  const isUserIdle = () => {
    // Usar apenas UserStateContext como fonte única de verdade
    return !userState.activeOperation;
  };

  useEffect(() => {
    loadData();
    // Event-driven: recarregar apenas quando necessário, não a cada 10s
  }, []);

  // Verificar se deve mostrar modal de cadastro
  useEffect(() => {
    const showRegister = searchParams.get('showRegister');
    if (showRegister === 'true' && !user) {
      setShowRegisterModal(true);
      // Limpar parâmetro da URL para não mostrar novamente
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, user]);

  // Recarregar dados quando estado do usuário mudar (após cancelamento/commitment)
  useEffect(() => {
    const handleUserStateChange = (event) => {
      console.log('🔄 Evento userStateChange recebido no MapView:', event.detail);
      
      // Evitar múltiplas atualizações simultâneas
      if (window.mapViewUpdating) {
        console.log('⏸️ MapView já está atualizando, ignorando...');
        return;
      }
      
      window.mapViewUpdating = true;
      console.log('🔄 Recarregando dados do mapa...');
      
      // Pequeno delay para garantir que o backend processou
      setTimeout(async () => {
        try {
          await loadData();
          console.log('✅ Dados do mapa recarregados com sucesso');
        } catch (error) {
          console.error('❌ Erro ao recarregar dados do mapa:', error);
        } finally {
          window.mapViewUpdating = false;
        }
      }, 800);
    };

    window.addEventListener('userStateChange', handleUserStateChange);
    
    // Limpar flag ao desmontar
    return () => {
      window.removeEventListener('userStateChange', handleUserStateChange);
      window.mapViewUpdating = false;
    };
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
    console.log('🔄 useEffect disparado - atualizando mapa');
    if (mapInstance) {
      // Usar whenReady para garantir que o mapa está pronto
      mapInstance.whenReady(() => {
        updateMarkers(mapInstance);
      });
    } else {
      initMap();
    }
  }, [locationsWithStatus, batches, resourceRequests, providers, activeFilters.abrigos, activeFilters.fornecedores, activeFilters.insumos]);

  // Limpar mapa quando componente desmontar
  useEffect(() => {
    return () => {
      if (mapInstance) {
        console.log('🧹 Limpando mapa ao desmontar componente');
        mapInstance.remove();
        setMapInstance(null);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Carregando dados...');

      // Carregar categorias
      const responseCategories = await fetch(`${API_URL}/api/categories/?active_only=true`);
      if (responseCategories.ok) {
        const categoriesData = await responseCategories.json();
        console.log('📦 Categorias carregadas:', categoriesData.length);
        setCategories(categoriesData);
      }

      // Carregar locais de entrega (agora usando locations)
      const responseEntrega = await fetch(`${API_URL}/api/locations/?active_only=true`);
      console.log('📍 Response locations:', responseEntrega.status, responseEntrega.ok);
      if (responseEntrega.ok) {
        const data = await responseEntrega.json();
        console.log('📍 Locations carregadas:', data.length, data);
        setLocations(data);
      } else {
        console.error('❌ Erro ao carregar locations:', responseEntrega.status);
        const errorText = await responseEntrega.text();
        console.error('❌ Error text:', errorText);
      }

      // Mostrar pedidos de insumos disponíveis (agora usando resource requests)
      const responseInsumos = await fetch(`${API_URL}/api/resources/requests?status=requesting`);
      if (responseInsumos.ok) {
        const pedidos = await responseInsumos.json();
        setResourceRequests(pedidos);
        console.log('Resource requests loaded:', pedidos);
      }

      // Carregar providers (para poder mostrar provider idle no mapa)
      const responseUsers = await fetch(`${API_URL}/api/users/`);
      if (responseUsers.ok) {
        const users = await responseUsers.json();
        setProviders((users || []).filter(u => String(u.roles || '').includes('provider')));
      }

      // Carregar deliveries para shelters (pedidos de marmita)
      const responseDeliveries = await fetch(`${API_URL}/api/deliveries/`);
      if (responseDeliveries.ok) {
        const pedidos = await responseDeliveries.json();
        console.log('🚚 Deliveries carregados:', pedidos.length);
        setDeliveries(pedidos);

        // Debug: verificar se as deliveries do João estão vindo
        if (user) {
          const joaoDeliveries = pedidos.filter(d => d.volunteer_id === user.id);
          console.log(`🔍 DEBUG - Deliveries do usuário ${user.id}:`, joaoDeliveries.length);
          joaoDeliveries.forEach(d => {
            console.log(`  - ID: ${d.id}, Status: ${d.status}, Product: ${d.product_type}`);
          });
        }
      } else {
        console.error('Erro ao carregar deliveries:', responseDeliveries.status);
      }

      // Carregar lotes de marmitas disponíveis para retirada (agora usando batches)
      const responseBatches = await fetch(`${API_URL}/api/batches/ready`);
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

    // Verificar se o container já tem um mapa inicializado
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('❌ Container do mapa não encontrado!');
      return;
    }

    // Verificar se já existe uma instância do Leaflet no container
    if (mapContainer._leaflet || mapContainer._leaflet_id) {
      console.log('🔄 Container já tem mapa, reutilizando...');
      return;
    }

    try {
      console.log('🆕 Criando novo mapa...');

      // Criar mapa com Leaflet já importado
      const map = L.map('map', {
        center: [-21.7642, -43.3502],
        zoom: 13,
        zoomControl: false, // Remover controle de zoom padrão
        // Melhorar renderização em dispositivos móveis (iPhone/Safari)
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false
      });

      // Adicionar tiles do OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Criar controle de zoom personalizado no canto inferior direito
      const zoomControl = L.control({ position: 'topleft' });

      zoomControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'custom-zoom-control');
        div.style.backgroundColor = 'white';
        div.style.border = '2px solid #d1d5db';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        div.style.overflow = 'hidden';
        div.style.marginTop = '16px';
        div.style.marginLeft = '16px';

        // Botão de zoom in
        const zoomInButton = L.DomUtil.create('button', '', div);
        zoomInButton.innerHTML = '+';
        zoomInButton.style.cssText = `
          display: block;
          width: 36px;
          height: 36px;
          border: none;
          background: white;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #e5e7eb;
        `;

        // Botão de zoom out
        const zoomOutButton = L.DomUtil.create('button', '', div);
        zoomOutButton.innerHTML = '−';
        zoomOutButton.style.cssText = `
          display: block;
          width: 36px;
          height: 36px;
          border: none;
          background: white;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        `;

        // Hover effects
        zoomInButton.onmouseover = () => {
          zoomInButton.style.backgroundColor = '#f3f4f6';
          zoomInButton.style.color = '#1f2937';
        };
        zoomInButton.onmouseout = () => {
          zoomInButton.style.backgroundColor = 'white';
          zoomInButton.style.color = '#374151';
        };

        zoomOutButton.onmouseover = () => {
          zoomOutButton.style.backgroundColor = '#f3f4f6';
          zoomOutButton.style.color = '#1f2937';
        };
        zoomOutButton.onmouseout = () => {
          zoomOutButton.style.backgroundColor = 'white';
          zoomOutButton.style.color = '#374151';
        };

        // Prevenir eventos de clique no mapa
        L.DomEvent.disableClickPropagation(div);

        // Adicionar eventos de zoom
        L.DomEvent.on(zoomInButton, 'click', function () {
          map.zoomIn();
        });

        L.DomEvent.on(zoomOutButton, 'click', function () {
          map.zoomOut();
        });

        return div;
      };

      zoomControl.addTo(map);

      console.log('✅ Mapa criado com sucesso');

      setMapInstance(map);
      setMapLoaded(true);

      // Esperar o mapa estar totalmente carregado antes de adicionar marcadores
      map.whenReady(() => {
        console.log('🗺️ Mapa está pronto, adicionando marcadores...');
        updateMarkers(map);
      });

    } catch (error) {
      console.error('❌ Erro ao criar mapa:', error);
    }
  };

  const updateMarkers = (map) => {
    if (!map) {
      console.log('⚠️ Mapa não disponível para atualizar marcadores');
      return;
    }

    // Verificar se o container do mapa está no DOM
    const mapContainer = document.getElementById('map');
    if (!mapContainer || !mapContainer.parentNode) {
      console.log('⚠️ Container do mapa não está no DOM');
      return;
    }

    // Verificar se o mapa está inicializado e pronto
    if (!map._container || !map._loaded) {
      console.log('⚠️ Mapa não está totalmente carregado');
      return;
    }

    console.log('🔄 Atualizando marcadores...');
    console.log('Dados:', {
      locations: locations.length,
      deliveries: deliveries.length,
      batches: batches.length
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
        if (['available', 'reserved', 'picked_up', 'in_transit', 'pending_confirmation'].includes(delivery.status)) {
          deliveriesByLocation[delivery.location_id].push(delivery);
        }
      });

      let shelterMarkers = 0;

      // Mostrar todos os abrigos com cores baseadas no estado
      locationsWithStatus.forEach(location => {
        if (location.latitude && location.longitude) {
          const activeDeliveries = deliveriesByLocation[location.id] || [];

          const filteredDeliveries = activeDeliveries;

          // Calcular estado baseado no usuário de forma escalável
          const state = getUserBasedState(location, user, filteredDeliveries);
          const { color, size, titleColor, statusIcon, statusText } = state;
          
          // Debug log para verificar a cor
          console.log(`🎨 DEBUG COLOR - Location ${location.id}:`, {
            color,
            statusText,
            stateKey: state.hasUserReservation ? 'PARTICIPANT' : 'PUBLIC'
          });
          
          const icon = makeLucideIcon('home', color, size);

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

          if (filteredDeliveries.length > 0) {
            productsHtml = `
              <div style="
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 10px;
              ">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #dc2626;">
                  Precisa de:
                </p>
            `;

            // Mostrar deliveries disponíveis (sem voluntário)
            const availableDeliveries = filteredDeliveries.filter(d =>
              d.status === 'available' && !d.volunteer_id
            );

            availableDeliveries.forEach(delivery => {
              // Usar categoria do backend diretamente
              const categoryName = delivery.category?.name || '';
              const displayName = delivery.category?.display_name || 'Produto';
              
              // Mapear unidade por categoria
              const categoryToUnitMap = {
                'agua': 'litros',
                'alimentos': 'kg',
                'refeicoes_prontas': 'porções',
                'higiene': 'unidades',
                'roupas': 'peças',
                'medicamentos': 'unidades'
              };
              const unit = categoryToUnitMap[categoryName] || 'unidades';
              
              productsHtml += `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 6px 0;
                  border-bottom: 1px solid #fecaca;
                ">
                  <span style="font-size: 13px; color: #374151; font-weight: 500;">
                    ${displayName}
                  </span>
                  <span style="font-size: 14px; color: #dc2626; font-weight: 600;">
                    ${delivery.quantity} ${unit}
                  </span>
                </div>
              `;
            });

            // Remover última borda
            productsHtml = productsHtml.replace(/border-bottom: 1px solid #fecaca;<\/div>$/, 'border-bottom: none;</div>');

            // Adicionar botão (apenas se usuário não tiver reserva ativa e houver itens disponíveis)
            if (!state.hasUserReservation && state.hasAvailableItems) {
              const locationDeliveries = deliveries.filter(d => d.location_id === location.id && d.status === 'available');
              if (locationDeliveries.length > 0) {
                const canCommit = canUserDoDeliveries() && isUserIdle();
                productsHtml += `
                  <button 
                    onclick="window.openSimplifiedCommitment(${location.id})"
                    style="
                      background: ${canCommit ? '#10b981' : '#d1d5db'};
                    color: white; 
                    border: none; 
                    padding: 8px 12px; 
                    border-radius: 6px; 
                    cursor: ${canCommit ? 'pointer' : 'not-allowed'}; 
                    font-size: 13px; 
                    width: 100%; 
                    margin-top: 8px; 
                    font-weight: 500;
                  "
                  title="${!canUserDoDeliveries() ? 'Apenas voluntários podem se comprometer' : 'Comprometer-se com entregas'}"
                >
                  ${!canUserDoDeliveries() ? '🚫 Apenas Voluntários' : '🤝 Ajudar'}
                </button>
                ${!canUserDoDeliveries() || !isUserIdle() ? '<p style="margin: 4px 0 0 0; font-size: 10px; color: #6b7280; font-style: italic;">' + (!canUserDoDeliveries() ? 'Apenas voluntários podem se comprometer' : 'Finalize sua entrega atual para ajudar') + '</p>' : ''}
                `;
              }
            }

            productsHtml += '</div>';
          }

          marker.bindPopup(`
            <div style="
              min-width: 280px; 
              max-width: 320px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border: 1px solid #e5e7eb;
              overflow: hidden;
            ">
              <!-- Header simples -->
              <div style="
                background: ${color};
                padding: 12px;
                color: white;
              ">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">${statusIcon}</span>
                  <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                      ${location.name}
                    </h3>
                  </div>
                </div>
              </div>

              <!-- Conteúdo -->
              <div style="padding: 12px;">
                <!-- Endereço compacto -->
                <div style="margin-bottom: 8px;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    ${location.address}
                  </p>
                </div>

                ${productsHtml}
                ${buttonsHtml}
                
                ${state.hasUserReservation && !state.hasUserCompletedDelivery ? `
                  <div style="
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                  ">
                    <p style="margin: 0; font-size: 12px; color: #ea580c; font-weight: 500;">
                      🤝 Você tem ${filteredDeliveries.filter(d => d.volunteer_id === user?.id).reduce((sum, d) => sum + d.quantity, 0)} itens reservados
                    </p>
                  </div>
                ` : ''}
                
                ${state.hasUserCompletedDelivery ? `
                  <div style="
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                  ">
                    <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 500;">
                      ✅ Você completou sua entrega aqui
                    </p>
                  </div>
                ` : ''}
                
                ${!state.hasUserReservation && state.isCompletelyReserved ? `
                  <div style="
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                  ">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 500;">
                      ✅ Todos os itens já foram reservados
                    </p>
                  </div>
                ` : ''}
                
                ${filteredDeliveries.length === 0 ? `
                  <div style="
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                    padding: 8px;
                    text-align: center;
                  ">
                    <p style="margin: 0; font-size: 12px; color: #166534; font-weight: 500;">
                      Sem necessidades no momento
                    </p>
                  </div>
                ` : ''}
              </div>
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
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Solicitante:</strong> ${request.provider?.name || '—'}</p>
                <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Total solicitado:</strong> ${itemsWithStatus.length > 0 ? itemsWithStatus.map(i => `${i.quantity} ${i.name.split(' — ')[0]}`).join(', ') : `${request.quantity_meals} itens`}</p>
                
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
                    ${isUserIdle() && canUserAcceptIngredients() ? `onclick="window.acceptIngredientRequest(${request.id})"` : ''}
                    style="background: ${isUserIdle() && canUserAcceptIngredients() ? '#3b82f6' : '#9ca3af'}; 
                           color: white; 
                           border: none; 
                           padding: 8px 12px; 
                           border-radius: 6px; 
                           cursor: ${isUserIdle() && canUserAcceptIngredients() ? 'pointer' : 'not-allowed'}; 
                           font-size: 12px; 
                           width: 100%; 
                           margin-top: 6px; 
                           font-weight: 500;
                           opacity: ${isUserIdle() && canUserAcceptIngredients() ? '1' : '0.6'};"
                    title="${!canUserAcceptIngredients() ? 'Apenas voluntários podem aceitar pedidos de insumos' : ''}"
                  >
                    ${!canUserAcceptIngredients() ? '🚫 Apenas Voluntários' : (isUserIdle() ? '🤝 Aceitar Pedido' : '⏳ Você já tem um compromisso ativo')}
                  </button>
                  ${!isUserIdle() ? '<p style="margin: 4px 0 0 0; font-size: 10px; color: #6b7280; font-style: italic;">Finalize sua entrega atual para aceitar novos pedidos</p>' : ''}
                ` : '<p style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280;">✅ Pedido totalmente reservado</p>'}
                
                ${!isCompletelyReserved ? `
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
                  <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📦 Disponível:</strong> ${batch.quantity_available || batch.quantity} ${productInfo.label.toLowerCase()}</p>
                  <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📍 Retirar em:</strong> ${batch.provider.address}</p>
                  ${batch.provider.phone ? `<p style="margin: 0 0 6px 0; font-size: 14px;"><strong>📞 Contato:</strong> ${batch.provider.phone}</p>` : ''}
                  ${batch.pickup_deadline ? `<p style="margin: 0 0 6px 0; font-size: 14px;"><strong>⏰ Retirar até:</strong> ${batch.pickup_deadline}</p>` : ''}
                  ${batch.description ? `<p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">"${batch.description}"</p>` : ''}
                </div>
                <div style="background: #fef2f2; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
                  <p style="margin: 0; font-size: 12px; color: #dc2626; text-align: center;">
                    ⚠️ Expira em: ${batch.expires_at ? new Date(batch.expires_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '4h'}
                  </p>
                </div>
                
                <button ${isUserIdle() && canUserReserveBatches() ? `onclick="window.reserveBatch(${batch.id})"` : ''} 
                        style="background: ${isUserIdle() && canUserReserveBatches() ? '#059669' : '#9ca3af'}; 
                               color: white; 
                               border: none; 
                               padding: 10px 16px; 
                               border-radius: 6px; 
                               cursor: ${isUserIdle() && canUserReserveBatches() ? 'pointer' : 'not-allowed'}; 
                               font-size: 13px; 
                               font-weight: 600; 
                               width: 100%; 
                               transition: background 0.2s; 
                               opacity: ${isUserIdle() && canUserReserveBatches() ? '1' : '0.6'};" 
                        ${isUserIdle() && canUserReserveBatches() ? 'onmouseover="this.style.background=\'#047857\'" onmouseout="this.style.background=\'#059669\'"' : ''}>
                  ${!canUserReserveBatches() ? '🚫 Apenas Fornecedores' : (isUserIdle() ? '🤝 Reservar para Entrega' : '⏳ Você já tem um compromisso ativo')}
                </button>
                ${!isUserIdle() ? '<p style="margin: 4px 0 0 0; font-size: 10px; color: #6b7280; font-style: italic;">Finalize sua entrega atual para criar uma nova</p>' : ''}
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
          () => { },
          'error',
          true // showOnlyOk
        );
        return;
      }

      // Verificar se usuário está ocioso
      if (!isUserIdle()) {
        console.log('❌ Usuário já tem operação ativa - ignorando ação');
        return; // Apenas ignora, não mostra modal
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

      // Verificar se usuário está ocioso
      if (!isUserIdle()) {
        console.log('❌ Usuário já tem operação ativa - ignorando ação');
        return; // Apenas ignora, não mostra modal
      }

      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        setSelectedBatch(batchId);
        setShowModalChooseLocation(true);
      }
    };

    window.openSimplifiedCommitment = (locationId) => {
      console.log('🔍 DEBUG - openSimplifiedCommitment chamado!', {
        locationId,
        user: user ? { id: user.id, name: user.name } : null,
        totalDeliveries: deliveries.length
      });

      if (!user) {
        console.log('❌ DEBUG - Usuário não logado');
        showConfirmation(
          'Login Necessário',
          'Você precisa estar logado como voluntário para se comprometer com entregas',
          () => setShowLoginModal(true),
          'warning'
        );
        return;
      }

      if (!user.roles.includes('volunteer')) {
        console.log('❌ DEBUG - Usuário não é voluntário. Roles:', user.roles);
        showConfirmation(
          'Acesso Restrito',
          'Apenas voluntários podem se comprometer com entregas',
          () => { },
          'error',
          true // showOnlyOk
        );
        return;
      }

      console.log('✅ DEBUG - Usuário é voluntário, verificando compromissos ativos...');

      // REMOVIDO: Verificação de idle - queremos mostrar o aviso de limite mesmo se tiver operação ativa
      // if (!isUserIdle()) {
      //   console.log('❌ DEBUG - Usuário não está idle');
      //   showConfirmation(
      //     '⚠️ Compromisso em Andamento',
      //     `Você já tem uma operação ativa.\n\nComplete ou cancele antes de aceitar outra.`,
      //     () => {},
      //     'warning'
      //   );
      //   return;
      // }

      console.log('✅ DEBUG - Verificando compromissos ativos...');

      // Verificar se já tem compromissos ativos
      const activeDeliveries = deliveries.filter(d =>
        d.volunteer_id === user.id &&
        d.status === 'pending_confirmation'
      );

      console.log('🔍 DEBUG - MapView openSimplifiedCommitment:', {
        userId: user.id,
        totalDeliveries: deliveries.length,
        activeDeliveries: activeDeliveries.length,
        allDeliveries: deliveries.map(d => ({
          id: d.id,
          volunteer_id: d.volunteer_id,
          status: d.status,
        }))
      });

      if (activeDeliveries.length > 0) {
        console.log('❌ Usuário tem compromissos ativos, ignorando nova solicitação');
        return; // Apenas ignora, não mostra modal
      }

      const location = locations.find(l => l.id === locationId);
      if (location) {
        setSelectedLocationForCommitment(location);
        setShowCommitmentModal(true);
      }
    };

    return () => {
      delete window.acceptIngredientRequest;
      delete window.reserveBatch;
      delete window.openSimplifiedCommitment;
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

  // Função para disparar atualização do estado do usuário
  const triggerUserStateUpdate = () => {
    // Disparar evento para o Header atualizar as cores
    window.dispatchEvent(new CustomEvent('userOperationUpdate', {
      detail: { forceUpdate: true }
    }));
  };

  const handleSimplifiedCommitment = async (commitments) => {
    const token = localStorage.getItem('token');
    console.log('📦 Commitments recebidos:', commitments);

    // Fazer commits sequencialmente para evitar conflitos
    const results = [];
    let pickupCode = '------';
    let hasError = false;

    for (let i = 0; i < commitments.length; i++) {
      const commitment = commitments[i];
      
      try {
        console.log(`🔄 Fazendo commit ${i + 1}/${commitments.length}: delivery_id=${commitment.delivery_id}, quantity=${commitment.quantity}`);
        
        try {
          const response = await fetch(`${API_URL}/api/deliveries/${commitment.delivery_id}/commit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: commitment.quantity })
          });

          console.log(`📡 Resposta do servidor: status=${response.status}`);
          
          if (!response.ok) {
            const error = await response.json();
            console.error(`❌ Erro no commit ${i + 1}:`, error);
            hasError = true;
            // Não fazer throw aqui - continuar mesmo com erro
            continue;
          }

          const result = await response.json();
          results.push(result);
          
          // Usar o código do primeiro resultado
          if (i === 0 && result.pickup_code) {
            pickupCode = result.pickup_code;
          }
          
          console.log(`✅ Commit ${i + 1} realizado com sucesso:`, result);
          
          // Pequeno delay entre commits para evitar conflitos
          if (i < commitments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (fetchError) {
          console.error(`❌ Erro de fetch no commit ${i + 1}:`, fetchError);
          hasError = true;
          continue;
        }
        
      } catch (error) {
        console.error(`❌ Falha no commit ${i + 1}:`, error);
        hasError = true;
        // Não fazer throw aqui - continuar mesmo com erro
      }
    }

    console.log(`📊 Resultado final: ${results.length} commits bem-sucedidos, hasError=${hasError}`);

    // Recarregar dados mesmo que tenha erro
    try {
      await loadData();
      await refreshState();
      
      // Atualizar estado do usuário imediatamente
      triggerUserStateUpdate();
    } catch (loadError) {
      console.error('❌ Erro ao recarregar dados:', loadError);
    }

    // Retornar resultado mesmo que tenha erro
    return {
      pickup_code: pickupCode,  // Mapear pickupCode (variável) para pickup_code (chave)
      results,
      hasError,
      error: hasError ? 'Alguns commits falharam, mas as entregas foram criadas' : null
    };
  };

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

  // Função para avançar para o passo de confirmação
  const handleFirstStepCommitment = () => {
    if (!chosenLocation) {
      showConfirmation(
        'Local Não Selecionado',
        'Por favor, escolha um local de entrega',
        () => { },
        'warning'
      );
      return;
    }

    // Verificação de segurança: garantir que usuário ainda está ocioso
    if (!isUserIdle()) {
      console.log('❌ Usuário já tem operação ativa - ignorando ação');
      return; // Apenas ignora, não mostra modal
    }

    // Mudar para o passo de confirmação
    setCommitmentStep('confirm');
  };

  // Função para segundo passo - cria a entrega após confirmação
  const handleSecondStepConfirmation = async () => {
    // Verificação de segurança: garantir que usuário ainda está ocioso
    if (!isUserIdle()) {
      console.log('❌ Usuário já tem operação ativa - ignorando ação');
      return; // Apenas ignora, não mostra modal
    }

    setIsConfirming(true);
    try {
      const response = await fetch(`${API_URL}/api/deliveries/`, {
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
        setCommitmentStep('select');
        
        // Atualizar dados e contexto
        await loadData();
        await refreshState();
        triggerUserStateUpdate();
      } else {
        const error = await response.json();
        showConfirmation(
          '❌ Erro ao Reservar',
          error.detail || 'Erro desconhecido',
          () => { },
          'error'
        );
      }
    } catch (error) {
      console.error('Erro ao reservar:', error);
      showConfirmation(
        '❌ Erro ao Reservar',
        'Tente novamente.',
        () => { },
        'error'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Header
        onLoginClick={openLoginModal}
        onRegisterClick={openRegisterModal}
        onOperationStatusChange={(hasOperation) => {
          // Disparar evento para o App.jsx
          window.dispatchEvent(new CustomEvent('operationStatusChange', {
            detail: { hasActiveOperation: hasOperation }
          }));
        }}
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

      {/* Botões de navegação — overlay no mapa, top-right */}
      <div style={{
        position: 'absolute',
        top: '72px',
        right: '12px',
        zIndex: 1000,
        display: 'flex',
        gap: '8px',
      }}>

        {user && user.roles.includes('admin') && (
          <button
            onClick={() => navigate(getDashboardRoute())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
        )}
      </div>

      {/* Painel Unificado: Legenda + Filtros — bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
      }}>
        {/* Toggle button (always visible) */}
        <button
          onClick={() => setLegendOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: legendOpen ? '#3b82f6' : 'white',
            color: legendOpen ? 'white' : '#374151',
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
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Mapa
          <span style={{ fontSize: '10px', color: legendOpen ? '#93c5fd' : '#9ca3af' }}>
            {legendOpen ? '▼' : '▲'}
          </span>
          {Object.values(activeFilters).some(v => !v) && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              marginLeft: '4px'
            }}>
              {Object.values(activeFilters).filter(v => !v).length}
            </span>
          )}
        </button>

        {/* Unified Panel */}
        {legendOpen && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
            width: '320px',
            overflow: 'hidden'
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setActiveTab('legend')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'legend' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'legend' ? 'white' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '0'
                }}
              >
                📍 Legenda
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'filters' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'filters' ? 'white' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '0'
                }}
              >
                🔍 Filtros
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: '16px' }}>
              {activeTab === 'legend' ? (
                /* Legend Content */
                <div>
                  {/* Abrigos */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Abrigos</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#10b981',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Abrigo</span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Casa com coração (acolhimento)</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Com pedido ativo</span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Precisando de ajuda</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restaurantes */}
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Restaurantes</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#10b981',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" /></svg>
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Restaurante</span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Prato/utensílios (alimentação)</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                        </div>
                        <div>
                          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>📦 Pedindo insumos</span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>Precisando de ingredientes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { color: '#10b981', label: 'Disponível', desc: 'Pronto para ajudar' },
                        { color: '#f97316', label: 'Solicitando', desc: 'Aguardando voluntário' },
                        { color: '#eab308', label: 'Ocioso', desc: 'Sem atividades' },
                      ].map(({ color, label, desc }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }} />
                          <div>
                            <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{label}</span>
                            <p style={{ margin: '0', fontSize: '10px', color: '#6b7280' }}>{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Filters Content */
                <div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mostrar no mapa
                  </p>

                  {[
                    { key: 'abrigos', emoji: '🏠', label: 'Abrigos', desc: 'Precisando de ajuda' },
                    { key: 'fornecedores', emoji: '🍽️', label: 'Fornecedores', desc: 'Com itens disponíveis' },
                    { key: 'insumos', emoji: '📦', label: 'Insumos', desc: 'Pedidos de ingredientes' },
                  ].map(({ key, emoji, label, desc }) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: pendingFilters[key] ? '#f0fdf4' : '#f9fafb',
                        marginBottom: '8px',
                        transition: 'all 0.15s',
                        border: pendingFilters[key] ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={pendingFilters[key]}
                        onChange={() => setPendingFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: '#16a34a',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '16px' }}>{emoji}</span>
                          <span style={{
                            fontSize: '14px',
                            color: '#374151',
                            fontWeight: pendingFilters[key] ? '600' : '500'
                          }}>
                            {label}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
                          {desc}
                        </p>
                      </div>
                    </label>
                  ))}

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => {
                        setPendingFilters({ abrigos: true, fornecedores: true, insumos: true });
                        setActiveFilters({ abrigos: true, fornecedores: true, insumos: true });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#6b7280',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                      Mostrar tudo
                    </button>
                    <button
                      onClick={() => {
                        setActiveFilters({ ...pendingFilters });
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
              padding: '16px',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              {/* Indicador de Passos */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                gap: '8px'
              }}>
                {/* Passo 1 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: commitmentStep === 'select' ? '#10b981' : '#e5e7eb',
                    color: commitmentStep === 'select' ? 'white' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {commitmentStep === 'confirm' ? '✓' : '1'}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: commitmentStep === 'confirm' ? '#10b981' : '#e5e7eb',
                    margin: '0 4px'
                  }} />
                </div>
                
                {/* Passo 2 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: commitmentStep === 'confirm' ? '#10b981' : '#e5e7eb',
                  color: commitmentStep === 'confirm' ? 'white' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  2
                </div>
              </div>
              
              {/* Títulos e Descrições */}
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {commitmentStep === 'select' ? '📍 Pedidos em Aberto' : '🤝 Confirmar Compromisso'}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                {commitmentStep === 'select' ? 'Abrigos precisando de doações' : 'Revise os detalhes antes de confirmar'}
              </p>
              
              {/* Descrição do Fluxo */}
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#0369a1',
                border: '1px solid #bae6fd'
              }}>
                {commitmentStep === 'select' ? (
                  <div>
                    <strong>🚚 Fluxo de Entrega:</strong> 
                    <div style={{ marginTop: '4px' }}>
                      1️⃣ Selecionar abrigo → 2️⃣ Confirmar compromisso → 3️⃣ Retirar no restaurante → 4️⃣ Entregar no abrigo
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong>⚠️ Compromisso Irreversível:</strong> 
                    <div style={{ marginTop: '4px' }}>
                      Ao confirmar, você cria uma entrega ativa. Só pode cancelar contatando o suporte.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '20px',
              flex: 1,
              overflow: 'auto',
              minHeight: 0
            }}>
              {commitmentStep === 'select' ? (
                <>
                  {/* Passo 1: Seleção de local e quantidade */}
                  {/* Info Compacta do Lote */}
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
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>Restaurante</p>
                        <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#0284c7' }}>
                          {batch.quantity_available}
                        </p>
                      </div>
                      {location && (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>Abrigo</p>
                          <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
                            {shelterNeed}
                          </p>
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>Você leva</p>
                        <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                          {maxToReserve}
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
                              width: '60px',
                              padding: '6px 8px',
                              border: '2px solid #3b82f6',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            / {maxToReserve}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const filteredLocations = getLocationsForDelivery();
                return filteredLocations.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0', fontSize: '13px' }}>
                    Nenhum pedido disponível
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                  🎯 **Perfeito!** Você pode levar todas as ${location.shelterNeed} ${location.productType === 'meal' ? 'marmitas' : location.productType === 'clothing' ? 'roupas' : 'itens'} que este abrigo precisa em uma única entrega.
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
                                  ⚠️ Você pode levar até {location.maxToReserve} de {location.shelterNeed} ${location.productType === 'meal' ? 'marmitas' : location.productType === 'clothing' ? 'roupas' : 'itens'}. O restante precisará de outro voluntário.
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
                </>
              ) : (
                <>
                  {/* Passo 2: Confirmação do compromisso */}
                  {selectedBatch && chosenLocation && (() => {
                    const batch = batches.find(b => b.id === selectedBatch);
                    const location = locationsWithStatus.find(l => l.id === chosenLocation);
                    const productInfo = getProductInfo(batch.product_type);
                    const pickupLocation = getProductLocation(batch.product_type);
                    
                    return (
                      <div style={{ padding: '16px' }}>
                        <div style={{
                          backgroundColor: '#f0f9ff',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                          border: '1px solid #bae6fd'
                        }}>
                          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
                            📦 Detalhes do Compromisso
                          </h3>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Produto</p>
                            <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', color: '#0284c7' }}>
                              {productInfo.name}
                            </p>
                          </div>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Local de Entrega</p>
                            <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', color: '#374151' }}>
                              {location.name}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                              📍 {location.address}
                            </p>
                          </div>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>Quantidade</p>
                            <p style={{ margin: '0', fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>
                              {quantityToReserve} unidades
                            </p>
                          </div>
                        </div>
                        
                        <div style={{
                          backgroundColor: '#fef3c7',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid #fde68a'
                        }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>
                            🚚 Próximos Passos
                          </h4>
                          <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
                            <li>Vá até <strong>{pickupLocation}</strong></li>
                            <li>Apresente o código de retirada</li>
                            <li>{getProductAction(batch.product_type).charAt(0).toUpperCase() + getProductAction(batch.product_type).slice(1)}</li>
                            <li>Entregue no abrigo</li>
                          </ol>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            <div style={{
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '10px',
              flexShrink: 0
            }}>
              {commitmentStep === 'select' ? (
                <>
                  <button
                    onClick={() => {
                      setShowModalChooseLocation(false);
                      setSelectedBatch(null);
                      setChosenLocation(null);
                      setQuantityToReserve(1);
                      setCommitmentStep('select'); // Reset para o passo inicial
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #ef4444',
                      backgroundColor: 'white',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    onClick={handleFirstStepCommitment}
                    disabled={!chosenLocation || isConfirming}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: (!chosenLocation || isConfirming) ? '#9ca3af' : '#10b981',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (!chosenLocation || isConfirming) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isConfirming ? '⏳ Processando...' : '🤝 Me Comprometo'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCommitmentStep('select')}
                    disabled={isConfirming}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #6b7280',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isConfirming ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!isConfirming) e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handleSecondStepConfirmation}
                    disabled={isConfirming}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isConfirming ? '#9ca3af' : '#dc2626',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isConfirming ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isConfirming ? '⏳ Confirmando...' : '⚠️ Criar Entrega (Irreversível)'}
                  </button>
                </>
              )}
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
            refreshState(); // Atualizar estado do usuário
            triggerUserStateUpdate(); // Atualizar cores da borda/header
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
            refreshState(); // Atualizar estado do usuário
            triggerUserStateUpdate(); // Atualizar cores da borda/header
          }}
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

      {/* Modal de Sucesso do Compromisso */}
      <CommitmentSuccessModal
        isOpen={showCommitmentSuccess}
        onClose={() => {
          setShowCommitmentSuccess(false);
          setCommittedDeliveryData(null);
        }}
        delivery={committedDeliveryData}
      />

      {/* Modal de Compromisso de Entrega */}
      {showCommitmentModal && selectedLocationForCommitment && (
        <DeliveryCommitmentModal
          location={selectedLocationForCommitment}
          deliveries={deliveries.filter(d => d.location_id === selectedLocationForCommitment?.id && d.status === 'available')}
          onClose={() => {
            setShowCommitmentModal(false);
            setSelectedLocationForCommitment(null);
          }}
          onCommit={handleSimplifiedCommitment}
        />
      )}

      {/* Widget de Estado do Usuário */}
      <UserStateWidget />
    </div>
  );
}

<style jsx>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}</style>
