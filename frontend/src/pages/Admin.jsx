import { useEffect, useState } from 'react';
import { users } from '../lib/api';
import { 
  Check, Database, ChevronDown, ChevronUp, UserCheck, UserX, ToggleLeft, ToggleRight, 
  Plus, User, Home, MapPin, BarChart, Package, Users, Building, ArrowLeft,
  UserCog, UserPlus, Shield, ShieldCheck, ShieldAlert, ClipboardList, 
  MapPinned, ListChecks, LayoutDashboard, Settings, LogOut, X
} from 'lucide-react';
import axios from 'axios';
import { handlePhoneChange } from '../utils/phoneMask';
import LocationPicker from '../components/LocationPicker';
import { UserRole } from '../shared/enums';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1); // 1 = localização, 2 = dados do abrigo
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    latitude: null,
    longitude: null
  });
  const [creatingShelter, setCreatingShelter] = useState(false);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [editingShelterId, setEditingShelterId] = useState(null);
  const [editLocationForm, setEditLocationForm] = useState({
    latitude: null,
    longitude: null,
    address: ''
  });
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Novas abas organizadas profissionalmente
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      endpoint: '/api/admin/dashboard',
      type: 'overview',
      tooltip: 'Visão geral do sistema'
    },
    { 
      id: 'users', 
      label: 'Usuários', 
      icon: Users,
      endpoint: '/api/admin/users',
      type: 'list',
      tooltip: 'Gerenciar todos os usuários'
    },
    { 
      id: 'users-pending', 
      label: 'Pendentes', 
      icon: UserPlus,
      endpoint: '/api/admin/users/pending',
      type: 'pending',
      tooltip: 'Usuários aguardando aprovação'
    },
    { 
      id: 'shelters', 
      label: 'Abrigos', 
      icon: MapPinned,
      endpoint: '/api/admin/shelters',
      type: 'list',
      tooltip: 'Gerenciar abrigos ativos'
    },
    { 
      id: 'shelters-pending', 
      label: 'Abrigos Pendentes', 
      icon: ShieldAlert,
      endpoint: '/api/admin/shelters/pending',
      type: 'pending',
      tooltip: 'Abrigos aguardando aprovação'
    },
    { 
      id: 'categories', 
      label: 'Categorias', 
      icon: ClipboardList,
      endpoint: '/api/admin/categories',
      type: 'list',
      tooltip: 'Gerenciar categorias de itens'
    },
    { 
      id: 'batches', 
      label: 'Produção', 
      icon: Package,
      endpoint: '/api/admin/batches',
      type: 'list',
      tooltip: 'Lotes e produção'
    },
    { 
      id: 'deliveries', 
      label: 'Entregas', 
      icon: MapPin,
      endpoint: '/api/admin/deliveries',
      type: 'list',
      tooltip: 'Gerenciar entregas'
    }
  ];

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}${tab.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Força recarga dos dados (limpa cache e atualiza)
      setData(prev => ({ ...prev, [tabId]: response.data }));
    } catch (error) {
      console.error(`Erro ao carregar ${tab.label}:`, error);
      alert(error.response?.data?.detail || `Erro ao carregar ${tab.label}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUserApproval = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/disapprove' : '/approve';
      
      await axios.post(`${API_URL}/api/admin/users/${userId}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar dados locais para todas as abas relevantes
      const updateTabData = (tabKey) => {
        if (data[tabKey]) {
          const updatedData = data[tabKey].map(user => 
            user.id === userId ? { ...user, approved: !currentStatus } : user
          );
          setData(prev => ({ ...prev, [tabKey]: updatedData }));
        }
      };

      // Atualizar todas as abas que podem conter este usuário
      updateTabData('users');
      updateTabData('users-pending');
      
      alert(`Usuário ${!currentStatus ? 'aprovado' : 'desaprovado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar aprovação:', error);
      alert('Erro ao alterar aprovação do usuário.');
    }
  };

  const toggleShelterApproval = async (locationId, currentStatus) => {
    console.log(`🔍 toggleShelterApproval chamado - Location ID: ${locationId}, Status atual: ${currentStatus}`);
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/reject' : '/approve';
      const url = `${API_URL}/api/admin/shelters/${locationId}${endpoint}`;
      
      console.log(`📡 Chamando endpoint: ${url}`);
      
      const response = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Resposta:`, response.data);

      // Atualizar dados locais para abas de abrigos
      const updateShelterTabData = (tabKey) => {
        if (data[tabKey]) {
          const updatedData = data[tabKey].map(shelter => 
            shelter.id === locationId ? { ...shelter, approved: !currentStatus } : shelter
          );
          setData(prev => ({ ...prev, [tabKey]: updatedData }));
        }
      };

      updateShelterTabData('shelters');
      updateShelterTabData('shelters-pending');
      
      alert(`Abrigo ${!currentStatus ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao alterar aprovação do abrigo:', error);
      console.error('Detalhes:', error.response?.data);
      alert('Erro ao alterar aprovação do abrigo: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/deactivate' : '/activate';
      
      await axios.post(`${API_URL}/api/admin/users/${userId}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar dados locais para todas as abas relevantes
      const updateTabData = (tabKey) => {
        if (data[tabKey]) {
          const updatedData = data[tabKey].map(user => 
            user.id === userId ? { ...user, active: !currentStatus } : user
          );
          setData(prev => ({ ...prev, [tabKey]: updatedData }));
        }
      };

      // Atualizar todas as abas que podem conter este usuário
      updateTabData('users');
      updateTabData('volunteers');
      updateTabData('volunteers-pending');
      updateTabData('shelters');
      updateTabData('shelters-pending');
      
      alert(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário.');
    }
  };

  const toggleLocationApproval = async (locationId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/disapprove' : '/approve';
      
      await axios.post(`${API_URL}/api/admin/locations/${locationId}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar dados locais para todas as abas de locations
      const updateLocationTabData = (tabKey) => {
        if (data[tabKey]) {
          const updatedData = data[tabKey].map(location => 
            location.id === locationId ? { ...location, approved: !currentStatus } : location
          );
          setData(prev => ({ ...prev, [tabKey]: updatedData }));
        }
      };

      updateLocationTabData('locations');
      updateLocationTabData('locations-pending');
      
      alert(`Local ${!currentStatus ? 'aprovado' : 'desaprovado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar aprovação do local:', error);
      alert('Erro ao alterar aprovação do local.');
    }
  };

  const toggleLocationActive = async (locationId, currentStatus) => {
    console.log(`🔍 toggleLocationActive chamado - ID: ${locationId}, Status atual: ${currentStatus}`);
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/deactivate' : '/activate';
      const url = `${API_URL}/api/admin/locations/${locationId}${endpoint}`;
      
      console.log(`📡 Chamando endpoint: ${url}`);
      
      const response = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Resposta:`, response.data);

      // Atualizar dados locais para todas as abas de locations
      const updateLocationTabData = (tabKey) => {
        if (data[tabKey]) {
          const updatedData = data[tabKey].map(location => 
            location.id === locationId ? { ...location, active: !currentStatus } : location
          );
          setData(prev => ({ ...prev, [tabKey]: updatedData }));
        }
      };

      updateLocationTabData('shelters');
      updateLocationTabData('shelters-pending');
      
      alert(`Local ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao alterar status do local:', error);
      console.error('Detalhes:', error.response?.data);
      alert('Erro ao alterar status do local: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openEditLocationModal = (shelter) => {
    setEditingShelterId(shelter.id);
    setEditLocationForm({
      latitude: shelter.latitude || null,
      longitude: shelter.longitude || null,
      address: shelter.address || ''
    });
    setShowEditLocationModal(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    
    if (!editLocationForm.latitude || !editLocationForm.longitude) {
      alert('Selecione a localização do abrigo no mapa');
      return;
    }

    setUpdatingLocation(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/admin/shelters/${editingShelterId}/location`,
        null,
        {
          params: {
            latitude: editLocationForm.latitude,
            longitude: editLocationForm.longitude
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Localização atualizada com sucesso!');
      setShowEditLocationModal(false);
      
      // Recarregar dados das abas relevantes
      await Promise.all([
        loadData('shelters'),
        loadData('shelters-pending')
      ]);
      
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      alert(error.response?.data?.detail || 'Erro ao atualizar localização.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!createForm.latitude || !createForm.longitude) {
      alert('Selecione a localização do abrigo no mapa');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    setCreatingShelter(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone,
        address: createForm.address,
        password: createForm.password,
        roles: UserRole.SHELTER,
        latitude: createForm.latitude,
        longitude: createForm.longitude,
        // Campos para criar DeliveryLocation
        location_address: createForm.address,
        location_name: createForm.name,
        contact_person: createForm.name,
        location_phone: createForm.phone,
        city_id: 'juiz-de-fora'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Abrigo criado com sucesso! Aguarde aprovação.');
      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      setShowCreateModal(false);
      resetCreateForm();
      loadData('shelters-pending');
      loadData('shelters');
      
    } catch (error) {
      console.error('Erro ao criar abrigo:', error);
      alert(error.response?.data?.detail || 'Erro ao criar abrigo.');
    } finally {
      setCreatingShelter(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
      latitude: null,
      longitude: null
    });
    setCreateStep(1);
    setSelectedLocation(null);
  };

  const handleLocationSelected = (location) => {
    setSelectedLocation(location);
    setCreateForm({
      ...createForm,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address || ''
    });
    setCreateStep(2); // Avançar automaticamente para o passo 2
  };

  const handleBackToLocation = () => {
    setCreateStep(1);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderItem = (item, index) => {
    const itemId = `${activeTab}-${index}`;
    const isExpanded = expandedItems[itemId];
    const isUsersTab = activeTab === 'users';
    const isVolunteerTab = activeTab.includes('volunteers');
    const isShelterTab = activeTab.includes('shelters');
    const isLocationTab = activeTab.includes('locations');

    return (
      <div key={index} className="border rounded-lg overflow-hidden">
        <div 
          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
          onClick={() => toggleExpand(itemId)}
        >
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900">ID: {item.id}</span>
            {item.name && <span className="text-gray-700">{item.name}</span>}
            {item.nome && <span className="text-gray-700">{item.nome}</span>}
            {item.email && <span className="text-gray-700">{item.email}</span>}
            {item.phone && <span className="text-gray-700">{item.phone}</span>}
            {item.roles && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {item.roles}
              </span>
            )}
            {item.address && <span className="text-gray-600 text-sm">{item.address}</span>}
            {item.capacity && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Capacidade: {item.capacity}
              </span>
            )}
            {item.approved !== undefined && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.approved 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.approved ? 'Aprovado' : 'Pendente'}
              </span>
            )}
            {item.active !== undefined && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.active 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {item.active ? 'Ativo' : 'Inativo'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isUsersTab && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUserApproval(item.id, item.approved);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.approved 
                      ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                  title={item.approved ? 'Desaprovar usuário' : 'Aprovar usuário'}
                >
                  {item.approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUserActive(item.id, item.active);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={item.active ? 'Desativar usuário' : 'Ativar usuário'}
                >
                  {item.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                </button>
              </>
            )}
            {(isVolunteerTab || isShelterTab) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isShelterTab) {
                      toggleShelterApproval(item.id, item.approved);
                    } else {
                      toggleUserApproval(item.id, item.approved);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.approved 
                      ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                  title={item.approved ? 'Desaprovar' : 'Aprovar'}
                >
                  {item.approved ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUserActive(item.id, item.active);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={item.active ? 'Desativar' : 'Ativar'}
                >
                  {item.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                </button>
                {isShelterTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditLocationModal(item);
                    }}
                    className="p-2 rounded-lg transition-colors bg-blue-100 hover:bg-blue-200 text-blue-700"
                    title="Editar Localização no Mapa"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            {isLocationTab && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLocationApproval(item.id, item.approved);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.approved 
                      ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                  title={item.approved ? 'Desaprovar Local' : 'Aprovar Local'}
                >
                  {item.approved ? <Home className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLocationActive(item.id, item.active);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={item.active ? 'Desativar Local' : 'Ativar Local'}
                >
                  {item.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                </button>
              </>
            )}
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-white">
            {/* Email destacado para abrigos */}
            {isShelterTab && item.user?.email && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">📧 Email:</span>
                  <span className="text-sm text-blue-900 font-semibold">{item.user.email}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 uppercase">{key}</span>
                  <span className="text-sm text-gray-900 mt-1 break-words">{renderValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Painel Administrativo
        </h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie todos os dados do sistema</p>
        
        {/* Botão de criar abrigo */}
        {(activeTab === 'shelters' || activeTab === 'shelters-pending') && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Criar Novo Abrigo
            </button>
            {createSuccess && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                <Check className="h-4 w-4" />
                Abrigo criado com sucesso!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.tooltip}
              className={`
                whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {data[tab.id] && data[tab.id].length > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${
                  ['lotes-marmita', 'pedidos-insumo', 'pedidos-marmita', 'reservas-insumo', 'reservas-marmita'].includes(tab.id)
                    ? 'bg-red-500 text-white' 
                    : ['volunteers-pending', 'shelters-pending', 'locations-pending'].includes(tab.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {data[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : data[activeTab] && data[activeTab].length > 0 ? (
          <div className="space-y-3">
            {data[activeTab].map((item, index) => renderItem(item, index))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum item encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal de Editar Localização */}
      {showEditLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto my-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Editar Localização do Abrigo</h2>
              <button
                onClick={() => setShowEditLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <LocationPicker
                latitude={editLocationForm.latitude}
                longitude={editLocationForm.longitude}
                address={editLocationForm.address}
                onLocationChange={(lat, lng) => {
                  setEditLocationForm({ ...editLocationForm, latitude: lat, longitude: lng });
                }}
                onAddressChange={(addr) => {
                  setEditLocationForm({ ...editLocationForm, address: addr });
                }}
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditLocationModal(false)}
                  disabled={updatingLocation}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingLocation}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingLocation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Localização'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criar Abrigo - Fluxo em 2 Passos */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto my-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {createStep === 2 && (
                  <button
                    type="button"
                    onClick={handleBackToLocation}
                    className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {createStep === 1 ? '📍 Passo 1: Selecionar Localização' : '📝 Passo 2: Dados do Abrigo'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cancelar criação"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${createStep === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${createStep === 1 ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {createStep === 1 ? '1' : '✓'}
                  </div>
                  <span className="font-medium">Localização</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${createStep === 1 ? 'bg-gray-200' : 'bg-green-600'}`}></div>
                <div className={`flex items-center gap-2 ${createStep === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${createStep === 2 ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    2
                  </div>
                  <span className="font-medium">Dados</span>
                </div>
              </div>
            </div>

            {/* Step 1: Seleção de Localização */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    📍 Selecionar Localização do Abrigo
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Clique no mapa ou busque um endereço para selecionar a localização
                  </p>
                </div>

                <LocationPicker
                  latitude={createForm.latitude}
                  longitude={createForm.longitude}
                  address={createForm.address}
                  onLocationChange={(lat, lng) => {
                    setCreateForm({ ...createForm, latitude: lat, longitude: lng });
                  }}
                  onAddressChange={(addr) => {
                    setCreateForm({ ...createForm, address: addr });
                  }}
                  onLocationSelect={(location) => {
                    handleLocationSelected(location);
                  }}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Clique no mapa para marcar a localização exata ou use a busca para encontrar um endereço. Após selecionar, você avançará automaticamente para o próximo passo.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Formulário de Dados */}
            {createStep === 2 && (
              <form onSubmit={handleCreateShelter} className="space-y-4">
                {/* Resumo da Localização */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Localização selecionada:</span>
                  </div>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>📍 {selectedLocation.address || 'Endereço não informado'}</p>
                    <p>🌐 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</p>
                  </div>
                </div>

                {/* Campos do formulário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Abrigo *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Casa da Esperança"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="abrigo@exemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => handlePhoneChange(e, (value) => setCreateForm({ ...createForm, phone: value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(32) 98888-7777"
                    maxLength="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Senha de acesso"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirme a senha"
                    required
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    disabled={creatingShelter}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingShelter}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creatingShelter ? 'Criando...' : 'Criar Abrigo'}
                  </button>
                </div>
              </form>
            )}

            {/* Mensagem de sucesso */}
            {createSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Abrigo criado com sucesso!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  O abrigo aparecerá na lista de aprovação após ser criado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
