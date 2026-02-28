import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { locaisEntrega, locaisProducao } from '@/lib/api';
import { Package, MapPin, Users, Utensils, X, Clock, Phone, User } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function HomeWithModals() {
  const [locaisEntregaList, setLocaisEntregaList] = useState([]);
  const [locaisProducaoList, setLocaisProducaoList] = useState([]);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [selectedType, setSelectedType] = useState(''); // 'entrega' ou 'producao'
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && !mapLoaded && locaisEntregaList.length > 0) {
      initMap();
    }
  }, [loading, locaisEntregaList, locaisProducaoList]);

  const loadData = async () => {
    try {
      const [entregaResponse, producaoResponse] = await Promise.all([
        locaisEntrega.list(false, 'juiz-de-fora'),
        locaisProducao.list('juiz-de-fora')
      ]);
      
      setLocaisEntregaList(entregaResponse.data.filter(l => l.ativo));
      setLocaisProducaoList(producaoResponse.data.filter(l => l.ativo));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const initMap = async () => {
    if (typeof window === 'undefined') return;

    const L = await import('leaflet');
    
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map('map').setView([-21.7642, -43.3505], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Ícones personalizados
    const entregaIcon = L.divIcon({
      html: `<div style="background: #10b981; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const producaoIcon = L.divIcon({
      html: `<div style="background: #f59e0b; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
          <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 4.68-1.1 1.15-1.57.87-3.76-.56-5.01L12 10.59l-2.83 2.83 5.66 5.66c.63.63 1.46.94 2.29.94.83 0 1.66-.31 2.29-.94l2.83-2.83-5.66-5.66z"/>
        </svg>
      </div>`,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Adicionar marcadores de entrega
    locaisEntregaList.forEach(local => {
      const lat = local.latitude || -21.7642 + (Math.random() - 0.5) * 0.1;
      const lng = local.longitude || -43.3505 + (Math.random() - 0.5) * 0.1;

      const marker = L.marker([lat, lng], { icon: entregaIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedLocal({ ...local, type: 'entrega' });
        setSelectedType('entrega');
      });
    });

    // Adicionar marcadores de produção
    locaisProducaoList.forEach(local => {
      const lat = local.latitude || -21.7642 + (Math.random() - 0.5) * 0.1;
      const lng = local.longitude || -43.3505 + (Math.random() - 0.5) * 0.1;

      const marker = L.marker([lat, lng], { icon: producaoIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedLocal({ ...local, type: 'producao' });
        setSelectedType('producao');
      });
    });

    setMapLoaded(true);
  };

  const closeModal = () => {
    setSelectedLocal(null);
    setSelectedType('');
  };

  const getLocalDetails = async () => {
    if (!selectedLocal) return;

    try {
      if (selectedType === 'producao') {
        const pedidosResponse = await locaisProducao.getPedidos(selectedLocal.id);
        setSelectedLocal({ ...selectedLocal, pedidos: pedidosResponse.data });
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  useEffect(() => {
    if (selectedLocal && selectedType === 'producao' && !selectedLocal.pedidos) {
      getLocalDetails();
    }
  }, [selectedLocal]);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '16px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package style={{ width: '32px', height: '32px', color: '#2563eb' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>EuAjudo</h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Marmitas Solidárias - Juiz de Fora</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/pedidos-insumos" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              <Package style={{ width: '20px', height: '20px', color: '#ea580c' }} />
              Pedidos de Insumos
            </Link>
            <Link to="/login" style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              Participar
            </Link>
          </div>
        </div>
      </div>

      {/* Map */}
      <div id="map" style={{ width: '100%', height: '100%' }}></div>

      {/* Modal */}
      {selectedLocal && (
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
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {selectedType === 'entrega' ? (
                  <MapPin style={{ width: '24px', height: '24px', color: '#10b981' }} />
                ) : (
                  <Utensils style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                )}
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  {selectedLocal.nome}
                </h2>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                  <strong>Endereço:</strong> {selectedLocal.endereco}
                </p>
                {selectedLocal.responsavel && (
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                    <strong>Responsável:</strong> {selectedLocal.responsavel}
                  </p>
                )}
                {selectedLocal.telefone && (
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                    <Phone style={{ width: '14px', height: '14px', marginRight: '4px', display: 'inline' }} />
                    {selectedLocal.telefone}
                  </p>
                )}
                {selectedLocal.horario_funcionamento && (
                  <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                    <Clock style={{ width: '14px', height: '14px', marginRight: '4px', display: 'inline' }} />
                    {selectedLocal.horario_funcionamento}
                  </p>
                )}
              </div>

              {selectedType === 'entrega' && selectedLocal.necessidade_diaria && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <p style={{ margin: 0, color: '#1e40af', fontSize: '14px', fontWeight: 'medium' }}>
                    Necessidade: {selectedLocal.necessidade_diaria} marmitas/dia
                  </p>
                </div>
              )}

              {selectedType === 'producao' && (
                <>
                  {selectedLocal.capacidade_producao && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: 0, color: '#92400e', fontSize: '14px', fontWeight: 'medium' }}>
                        Capacidade: {selectedLocal.capacidade_producao} marmitas
                      </p>
                    </div>
                  )}

                  {selectedLocal.pedidos && selectedLocal.pedidos.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        Pedidos Disponíveis
                      </h3>
                      {selectedLocal.pedidos.map(pedido => (
                        <div key={pedido.id} style={{
                          backgroundColor: '#f9fafb',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'medium' }}>
                            {pedido.quantidade} marmitas disponíveis
                          </p>
                          {pedido.descricao && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                              {pedido.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Link
                  to="/register"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'medium'
                  }}
                >
                  Quero Ajudar
                </Link>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    fontWeight: 'medium',
                    cursor: 'pointer'
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#6b7280' }}>Carregando mapa...</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
