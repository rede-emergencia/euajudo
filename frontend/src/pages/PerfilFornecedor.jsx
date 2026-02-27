import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { users } from '../lib/api';
import { MapPin, Save, X, Phone, Store, Clock } from 'lucide-react';

export default function PerfilFornecedor() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    latitude: -21.7642,  // Centro de Juiz de Fora
    longitude: -43.3505, // Centro de Juiz de Fora
    tipo_estabelecimento: '',
    capacidade_producao: '',
    horario_funcionamento: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        endereco: user.endereco || 'Rua Halfeld, 123, Centro - Juiz de Fora, MG',
        latitude: user.latitude || -21.7642,
        longitude: user.longitude || -43.3505,
        tipo_estabelecimento: user.tipo_estabelecimento || 'restaurante',
        capacidade_producao: user.capacidade_producao || 100,
        horario_funcionamento: user.horario_funcionamento || '08:00 - 18:00'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await users.updateProfile(formData);
      await updateUser();
      setSuccess('✅ Perfil atualizado com sucesso!');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        endereco: user.endereco || 'Rua Halfeld, 123, Centro - Juiz de Fora, MG',
        latitude: user.latitude || -21.7642,
        longitude: user.longitude || -43.3505,
        tipo_estabelecimento: user.tipo_estabelecimento || 'restaurante',
        capacidade_producao: user.capacidade_producao || 100,
        horario_funcionamento: user.horario_funcionamento || '08:00 - 18:00'
      });
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            Meu Perfil
          </h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Editar Perfil
            </button>
          )}
        </div>

        {success && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Informações Básicas */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                Informações Básicas
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                />
              </div>
            </div>

            {/* Localização */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                <MapPin style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} />
                Localização
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : '#f9fafb',
                      cursor: editing ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    disabled={!editing}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: editing ? 'white' : '#f9fafb',
                      cursor: editing ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Operação */}
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                <Store style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} />
                Operação
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Tipo de Estabelecimento
                </label>
                <select
                  value={formData.tipo_estabelecimento}
                  onChange={(e) => setFormData({ ...formData, tipo_estabelecimento: e.target.value })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                >
                  <option value="restaurante">Restaurante</option>
                  <option value="cozinha_comunitaria">Cozinha Comunitária</option>
                  <option value="hotel">Hotel</option>
                  <option value="escola">Escola</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Capacidade de Produção (marmitas/dia)
                </label>
                <input
                  type="number"
                  value={formData.capacidade_producao}
                  onChange={(e) => setFormData({ ...formData, capacidade_producao: parseInt(e.target.value) })}
                  disabled={!editing}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Horário de Funcionamento
                </label>
                <input
                  type="text"
                  value={formData.horario_funcionamento}
                  onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })}
                  disabled={!editing}
                  placeholder="Ex: 08:00 - 18:00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: editing ? 'white' : '#f9fafb',
                    cursor: editing ? 'text' : 'not-allowed'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          {editing && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
                Cancelar
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Informações de Localização */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          <MapPin style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline' }} />
          Sua Localização no Mapa
        </h3>
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0c4a6e' }}>
            <strong>Endereço:</strong> {formData.endereco}
          </p>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0c4a6e' }}>
            <strong>Coordenadas:</strong> {formData.latitude}, {formData.longitude}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            💡 Quando você criar um pedido de insumos, seu estabelecimento aparecerá no mapa com um ícone azul 🛒 nesta localização.
          </p>
        </div>
      </div>
    </div>
  );
}
