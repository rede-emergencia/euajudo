import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Plus, RefreshCw } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ShelterInventoryTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Carregar dashboard
      const dashboardResponse = await axios.get(`${API_URL}/api/shelter/inventory/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Carregar categorias
      const categoriesResponse = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboard(dashboardResponse.data);
      setCategories(categoriesResponse.data);
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}>
          <RefreshCw size={32} className="animate-spin" color="#3b82f6" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div style={{
          maxWidth: '800px',
          margin: '100px auto',
          padding: '40px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>
            ❌ Erro ao Carregar Dashboard
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: '16px', color: '#6b7280' }}>
            {error}
          </p>
          <button
            onClick={loadData}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '80px 24px 24px',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '32px', fontWeight: '800', color: '#111' }}>
          📊 Dashboard de Teste
        </h1>
        
        {/* Métricas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Itens Ativos</p>
            <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>
              {dashboard?.metrics?.total_items || 0}
            </p>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Categorias</p>
            <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: '#10b981' }}>
              {categories.length}
            </p>
          </div>
        </div>

        {/* Lista de Itens */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700' }}>
            Itens do Inventário
          </h2>
          
          {dashboard?.items?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dashboard.items.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                        {item.category_name}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                        Necessário: {item.needed_quantity} | Estoque: {item.current_stock}
                      </p>
                    </div>
                    <Package size={24} color="#3b82f6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#9ca3af'
            }}>
              <Package size={48} style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum item no inventário</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '700' }}>Debug Info:</h3>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
            User: {user?.name} ({user?.email})
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
            Roles: {user?.roles?.join(', ')}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
            Dashboard Items: {dashboard?.items?.length || 0}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>
            Categories: {categories.length}
          </p>
        </div>
      </div>
    </>
  );
}
