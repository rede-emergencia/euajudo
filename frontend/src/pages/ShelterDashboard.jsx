import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Package, Clock, CheckCircle, X, AlertCircle, Home, Trash2, PlusCircle } from 'lucide-react';
import { categories as categoriesApi } from '../lib/api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ShelterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeRequests, setActiveRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [requestItems, setRequestItems] = useState([
    { category_id: '', quantity: '', metadata: {} }
  ]);

  useEffect(() => {
    loadRequests();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.list(true);
      setCategories(response.data.filter(cat => cat.active));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/deliveries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtrar apenas pedidos deste abrigo
      const shelterRequests = response.data.filter(req => 
        req.location_id === 1 && // ID fixo para DeliveryLocation do Abrigo Centro
        ['available', 'in_progress'].includes(req.status)
      );
      setActiveRequests(shelterRequests);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setRequestItems([...requestItems, { category_id: '', quantity: '', metadata: {} }]);
  };

  const removeItem = (index) => {
    if (requestItems.length > 1) {
      const newItems = requestItems.filter((_, i) => i !== index);
      setRequestItems(newItems);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...requestItems];
    newItems[index][field] = value;
    
    // Se mudou categoria, limpar metadados e carregar atributos da categoria
    if (field === 'category_id') {
      const category = categories.find(cat => cat.id === parseInt(value));
      if (category && category.attributes) {
        const defaultMetadata = {};
        category.attributes.forEach(attr => {
          defaultMetadata[attr.name] = attr.default_value || '';
        });
        newItems[index].metadata = defaultMetadata;
      } else {
        newItems[index].metadata = {};
      }
    }
    
    setRequestItems(newItems);
  };

  const updateItemMetadata = (itemIndex, metadataName, value) => {
    const newItems = [...requestItems];
    newItems[itemIndex].metadata[metadataName] = value;
    setRequestItems(newItems);
  };

  const validateItems = () => {
    for (const item of requestItems) {
      if (!item.category_id || !item.quantity || parseInt(item.quantity) <= 0) {
        return false;
      }
      
      // Verificar metadados obrigatórios
      const category = categories.find(cat => cat.id === parseInt(item.category_id));
      if (category && category.attributes) {
        for (const attr of category.attributes) {
          if (attr.required && !item.metadata[attr.name]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!validateItems()) {
      alert('Preencha todos os campos obrigatórios corretamente');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('🔍 DEBUG: User object:', user);
      console.log('🔍 DEBUG: user.location:', user.location);
      console.log('🔍 DEBUG: User keys:', Object.keys(user));
      console.log('🔍 DEBUG: User completo:', JSON.stringify(user, null, 2));
      
      // Criar múltiplos pedidos (um para cada item)
      const requests = requestItems.map(item => ({
        category_id: parseInt(item.category_id),
        quantity: parseInt(item.quantity),
        metadata_cache: item.metadata
      }));
      
      console.log('🔍 DEBUG: Requests payload:', requests);

      // Enviar todos os pedidos
      await Promise.all(requests.map(request => 
        axios.post(`${API_URL}/api/deliveries/direct`, request, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      setShowCreateModal(false);
      setRequestItems([{ category_id: '', quantity: '', metadata: {} }]);
      loadRequests();
      
    } catch (error) {
      console.error('Erro ao criar pedidos:', error);
      alert(error.response?.data?.detail || 'Erro ao criar pedidos');
    }
  };

  const getCategoryAttributes = (categoryId) => {
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category?.attributes || [];
  };

  const formatMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return '';
    
    return Object.entries(metadata)
      .filter(([_, value]) => value && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const stats = [
    {
      label: 'Pedidos Ativos',
      value: activeRequests.length,
      icon: <Home size={20} />,
      color: 'text-blue-600'
    },
    {
      label: 'Total de Itens',
      value: activeRequests.reduce((sum, req) => sum + req.quantity, 0),
      icon: <Package size={20} />,
      color: 'text-green-600'
    },
    {
      label: 'Em Progresso',
      value: activeRequests.filter(req => req.status === 'in_progress').length,
      icon: <Clock size={20} />,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Painel do Abrigo</h1>
        <p className="text-gray-600">Gerencie suas solicitações de suprimentos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      {createSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Pedidos criados com sucesso!
        </div>
      )}

      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          Novo Pedido
        </button>
      </div>

      {/* Active Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Ativos</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando...</p>
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Package size={48} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Nenhum pedido ativo</p>
            <p className="text-sm text-gray-500 mt-1">Crie um novo pedido para começar</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeRequests.map((request) => (
              <div key={request.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {request.category?.display_name || 'Categoria'}
                      </span>
                      <span className="text-2xl">{request.category?.icon}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {request.status === 'available' ? 'Disponível' : 'Em Progresso'}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      <strong>Quantidade:</strong> {request.quantity}
                    </p>
                    {request.metadata_cache && Object.keys(request.metadata_cache).length > 0 && (
                      <p className="text-gray-600 text-sm mt-1">
                        <strong>Detalhes:</strong> {formatMetadata(request.metadata_cache)}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      Criado em: {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Novo Pedido</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="p-4">
              {/* Items */}
              <div className="space-y-4 mb-6">
                {requestItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoria *
                        </label>
                        <select
                          value={item.category_id}
                          onChange={(e) => updateItem(index, 'category_id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Selecione...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.display_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade *
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Quantidade"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    {item.category_id && getCategoryAttributes(item.category_id).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Detalhes do Item</h4>
                        {getCategoryAttributes(item.category_id).map(attr => (
                          <div key={attr.name}>
                            <label className="block text-xs text-gray-600 mb-1">
                              {attr.display_name} {attr.required && '*'}
                            </label>
                            {attr.attribute_type === 'select' ? (
                              <select
                                value={item.metadata[attr.name] || ''}
                                onChange={(e) => updateItemMetadata(index, attr.name, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required={attr.required}
                              >
                                <option value="">Selecione...</option>
                                {attr.options?.map(opt => (
                                  <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.metadata[attr.name] || ''}
                                onChange={(e) => updateItemMetadata(index, attr.name, e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={attr.placeholder || ''}
                                required={attr.required}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Item
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Pedido(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
