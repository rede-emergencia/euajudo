import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Building, Calendar, Edit } from 'lucide-react';

export default function Perfil() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  const getRoleLabel = (roles) => {
    if (!roles || roles.length === 0) return 'Usuário';
    
    const roleMap = {
      'provider': 'Fornecedor',
      'volunteer': 'Voluntário',
      'volunteer_comprador': 'Voluntário Comprador',
      'shelter': 'Abrigo',
      'admin': 'Administrador'
    };
    
    return roles.map(role => roleMap[role] || role).join(' / ');
  };

  const getRoleColor = (roles) => {
    if (!roles || roles.length === 0) return '#6b7280';
    
    const colorMap = {
      'provider': '#10b981',
      'volunteer': '#3b82f6',
      'volunteer_comprador': '#3b82f6',
      'shelter': '#f59e0b',
      'admin': '#ef4444'
    };
    
    return colorMap[roles[0]] || '#6b7280';
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '32px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
          Meu Perfil
        </h1>
      </div>

      {/* Profile Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {user.name?.charAt(0).toUpperCase() || user.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              {user.name || user.nome || 'Usuário'}
            </h2>
            
            <div style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              background: `${getRoleColor(user.roles)}20`,
              color: getRoleColor(user.roles),
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {getRoleLabel(user.roles)}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="#6b7280" />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {user.email}
                </span>
              </div>
              
              {user.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {user.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            <Edit size={16} />
            Editar Perfil
          </button>
        </div>

        {/* Additional Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {user.created_at && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Membro desde
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                {new Date(user.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          {user.address && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MapPin size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Endereço
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                {user.address}
              </p>
            </div>
          )}

          {user.organization && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Building size={16} color="#6b7280" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                  Organização
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                {user.organization}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            Estatísticas da Conta
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                0
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Ações Realizadas
              </div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                0
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Contribuições
              </div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                0
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Dias Ativo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal Placeholder */}
      {showEditModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
              Editar Perfil
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
              Funcionalidade de edição em desenvolvimento. Em breve você poderá atualizar suas informações.
            </p>
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
