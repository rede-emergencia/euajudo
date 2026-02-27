import { useEffect, useState } from 'react';
import { users } from '../lib/api';
import { Check, Database, ChevronDown, ChevronUp, UserCheck, UserX, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const tabs = [
    { id: 'users', label: 'Usuários', endpoint: '/api/admin/users' },
    { id: 'locais-entrega', label: 'Locais de Entrega', endpoint: '/api/admin/locais-entrega' },
    { id: 'pedidos-insumo', label: 'Pedidos de Insumo', endpoint: '/api/admin/pedidos-insumo' },
    { id: 'itens-insumo', label: 'Itens de Insumo', endpoint: '/api/admin/itens-insumo' },
    { id: 'reservas-insumo', label: 'Reservas de Insumo', endpoint: '/api/admin/reservas-insumo' },
    { id: 'reservas-itens', label: 'Reservas de Itens', endpoint: '/api/admin/reservas-itens' },
    { id: 'lotes-marmita', label: 'Ofertas', endpoint: '/api/admin/lotes-marmita', showCount: true },
    { id: 'entregas-marmita', label: 'Entregas de Marmita', endpoint: '/api/admin/entregas-marmita' },
    { id: 'reservas-marmita', label: 'Reservas de Marmita', endpoint: '/api/admin/reservas-marmita' },
    { id: 'pedidos-marmita', label: 'Pedidos de Marmita', endpoint: '/api/admin/pedidos-marmita' },
  ];

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const loadData = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || data[tabId]) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}${tab.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const endpoint = currentStatus ? '/deactivate' : '/approve';
      
      await axios.post(`${API_URL}/api/admin/users/${userId}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar dados locais
      const updatedUsers = data.users.map(user => 
        user.id === userId ? { ...user, approved: !currentStatus } : user
      );
      setData(prev => ({ ...prev, users: updatedUsers }));
      
      alert(`Usuário ${!currentStatus ? 'aprovado' : 'desaprovado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar aprovação:', error);
      alert('Erro ao alterar aprovação do usuário.');
    }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = currentStatus ? '/deactivate' : '/activate';
      
      await axios.post(`${API_URL}/api/admin/users/${userId}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Atualizar dados locais
      const updatedUsers = data.users.map(user => 
        user.id === userId ? { ...user, active: !currentStatus } : user
      );
      setData(prev => ({ ...prev, users: updatedUsers }));
      
      alert(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário.');
    }
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

    return (
      <div key={index} className="border rounded-lg overflow-hidden">
        <div 
          className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
          onClick={() => toggleExpand(itemId)}
        >
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900">ID: {item.id}</span>
            {item.nome && <span className="text-gray-700">{item.nome}</span>}
            {item.email && <span className="text-gray-700">{item.email}</span>}
            {item.roles && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {item.roles}
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
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-white">
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
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {data[tab.id] && data[tab.id].length > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold ${
                  ['lotes-marmita', 'pedidos-insumo', 'pedidos-marmita', 'reservas-insumo', 'reservas-marmita'].includes(tab.id)
                    ? 'bg-red-500 text-white' 
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
          <p className="text-gray-600 text-center py-12">Nenhum registro encontrado</p>
        )}
      </div>
    </div>
  );
}
