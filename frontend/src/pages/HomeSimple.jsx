import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { locaisEntrega } from '@/lib/api';
import { Package, MapPin, Users } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

export default function HomeSimple() {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocais();
    initMap();
  }, []);

  const loadLocais = async () => {
    try {
      const response = await locaisEntrega.list(false, 'juiz-de-fora');
      setLocais(response.data.filter(l => l.ativo));
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  const initMap = async () => {
    if (typeof window === 'undefined') return;

    // Load Leaflet
    const L = await import('leaflet');
    
    // Fix icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Create map
    const map = L.map('map').setView([-21.7642, -43.3505], 12);
    
    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add zoom controls
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add markers
    const locations = locais.length > 0 ? locais : [
      { nome: "Abrigo Central", endereco: "Rua A, 123", latitude: -21.7642, longitude: -43.3505, responsavel: "João", telefone: "3236881234", necessidade_diaria: 80 },
      { nome: "Casa de Apoio", endereco: "Rua B, 456", latitude: -21.7542, longitude: -43.3405, responsavel: "Maria", telefone: "3236992345", necessidade_diaria: 60 }
    ];

    locations.forEach(local => {
      const lat = local.latitude || -21.7642 + (Math.random() - 0.5) * 0.1;
      const lng = local.longitude || -43.3505 + (Math.random() - 0.5) * 0.1;

      const marker = L.marker([lat, lng]).addTo(map);
      
      const popupContent = `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin: 0 0 8px 0;">${local.nome}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px;">${local.endereco}</p>
          ${local.responsavel ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Responsável:</strong> ${local.responsavel}</p>` : ''}
          ${local.telefone ? `<p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Telefone:</strong> ${local.telefone}</p>` : ''}
          ${local.necessidade_diaria ? `<p style="margin: 0; font-size: 12px; color: #2563eb;"><strong>Necessidade:</strong> ${local.necessidade_diaria} marmitas/dia</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
    });
  };

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
            <p style={{ color: '#6b7280' }}>Carregando locais...</p>
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
