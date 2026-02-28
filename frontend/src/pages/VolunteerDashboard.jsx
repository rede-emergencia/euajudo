import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { deliveries } from '../lib/api';
import {
  ArrowLeft, Truck, Package, CheckCircle, X,
  ChevronRight, MapPin, Clock
} from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import Header from '../components/Header';

/* ─── Status ─────────────────────────────────────────────────────────── */
const STATUS = {
  pending_confirmation: { label: 'Aguardando Retirada', color: '#d97706', bg: '#fef9c3' },
  reserved: { label: 'Comprometido', color: '#2563eb', bg: '#eff6ff' },
  picked_up: { label: 'Retirado', color: '#7c3aed', bg: '#f5f3ff' },
  in_transit: { label: 'Em Trânsito', color: '#0891b2', bg: '#ecfeff' },
  delivered: { label: 'Entregue', color: '#16a34a', bg: '#f0fdf4' },
  cancelled: { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2' },
  acquired: { label: 'Adquirido', color: '#7c3aed', bg: '#f5f3ff' },
};

function Badge({ status }) {
  const s = STATUS[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      fontSize: '11px', fontWeight: '700',
      color: s.color, background: s.bg,
      padding: '3px 10px', borderRadius: '999px',
      letterSpacing: '0.2px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

/* ─── Delivery Card ──────────────────────────────────────────────────── */
function DeliveryCard({ delivery, onCancel, onConfirm }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
            Entrega #{delivery.id}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {delivery.created_at ? new Date(delivery.created_at).toLocaleDateString('pt-BR') : ''}
          </p>
        </div>
        <Badge status={delivery.status} />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        fontSize: '13px', color: '#4b5563',
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Item</span>
          <strong>{delivery.quantity} {delivery.product_type || 'itens'}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Local</span>
          <strong>{delivery.location?.name || '—'}</strong>
        </div>
      </div>

      {delivery.pickup_code && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '12px', padding: '12px', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
            📋 Código de Retirada — mostre ao fornecedor
          </p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: '#15803d', fontFamily: 'monospace' }}>
            {delivery.pickup_code}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {(delivery.status === 'reserved' || delivery.status === 'pending_confirmation') && (
          <button onClick={() => onCancel(delivery.id)} style={btnStyle('#fff', '#fecaca', '#dc2626')}>
            <X size={14} /> Cancelar
          </button>
        )}
        {(delivery.status === 'picked_up' || delivery.status === 'in_transit') && (
          <button onClick={() => onConfirm(delivery.id)} style={btnStyle('#16a34a', 'none', '#fff', true)}>
            <CheckCircle size={14} /> Confirmar Entrega
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Donation Card ──────────────────────────────────────────────────── */
function DonationCard({ donation, onCancel }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: '16px', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>Doação #{donation.id}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {donation.created_at ? new Date(donation.created_at).toLocaleDateString('pt-BR') : ''}
          </p>
        </div>
        <Badge status={donation.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#4b5563' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Itens</span>
          <strong>{donation.items?.length || 0}</strong>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Para</span>
          <strong>{donation.request?.location?.name || '—'}</strong>
        </div>
      </div>
      {donation.status === 'reserved' && (
        <button onClick={() => onCancel(donation.id)} style={btnStyle('#fff', '#fecaca', '#dc2626')}>
          <X size={14} /> Cancelar
        </button>
      )}
    </div>
  );
}

function btnStyle(bg, border, color, filled = false) {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 14px',
    border: filled ? 'none' : `1px solid ${border}`,
    borderRadius: '12px',
    background: bg, color,
    fontSize: '13px', fontWeight: '700',
    cursor: 'pointer',
  };
}

/* ─── Empty ──────────────────────────────────────────────────────────── */
function Empty({ icon: Icon, title, sub, onAction }) {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: '#f3f4f6', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Icon size={28} color="#9ca3af" />
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>{title}</p>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>{sub}</p>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        }}
      >
        <MapPin size={15} /> Ver Mapa <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('entregas');
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');
  const { alert, showAlert, closeAlert } = useAlert();

  const triggerUserStateUpdate = () =>
    window.dispatchEvent(new CustomEvent('refreshUserState', { detail: { forceUpdate: true } }));

  useEffect(() => { loadData(); }, [tab]);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('refreshUserState', handler);
    return () => window.removeEventListener('refreshUserState', handler);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'entregas') {
        // Carregar entregas que o voluntário está fazendo
        const response = await deliveries.list();
        const activeDeliveries = response.data?.filter(d => 
          d.volunteer_id === user.id && ['pending_confirmation', 'reserved', 'picked_up', 'in_transit'].includes(d.status) && d.status !== 'cancelled'
        ) || [];
        setMyDeliveries(activeDeliveries);
      } else if (activeTab === 'doacoes') {
        // Carregar doações que o voluntário está fazendo (compras de insumos)
        try {
          const response = await fetch('/api/resource-reservations/my', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const donations = await response.json();
          setMyDonations((donations || []).filter(d => d.status !== 'cancelled'));
        } catch (error) {
          console.error('Erro ao carregar doações:', error);
          setMyDonations([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEntrega = async (id) => {
    const d = myDeliveries.find(x => x.id === id);
    if (d?.batch_id && d?.status !== 'reserved') {
      showAlert('Não Permitido', 'Já retirou o item — complete a entrega.', 'warning'); return;
    }
    if (!window.confirm(`Cancelar entrega #${id}?`)) return;
    const res = await fetch(`/api/deliveries/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) { loadData(); triggerUserStateUpdate(); showAlert('Sucesso', '✅ Entrega cancelada!', 'success'); }
    else showAlert('Erro', '❌ Não foi possível cancelar.', 'error');
  };

  const handleCancelarDoacao = async (id) => {
    if (!window.confirm(`Cancelar doação #${id}?`)) return;
    const res = await fetch(`/api/resource-reservations/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) { loadData(); triggerUserStateUpdate(); showAlert('Sucesso', '✅ Doação cancelada!', 'success'); }
    else showAlert('Erro', '❌ Não foi possível cancelar.', 'error');
  };

  const handleConfirmarEntrega = (id) => {
    setSelectedDelivery(id);
    setCodigoConfirmacao('');
    setShowCodigoModal(true);
  };

  const confirmarAcao = async () => {
    if (codigoConfirmacao.length !== 6) { showAlert('Inválido', 'Digite 6 dígitos', 'warning'); return; }
    const res = await fetch(`/api/deliveries/${selectedDelivery}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_code: codigoConfirmacao })
    });
    if (res.ok) {
      showAlert('Sucesso', '✅ Entrega confirmada!', 'success');
      setShowCodigoModal(false); loadData(); triggerUserStateUpdate();
    } else showAlert('Erro', '❌ Código inválido.', 'error');
  };

  const activeCount = tab === 'entregas' ? myDeliveries.length : myDonations.length;

  return (
    <>
      <Header onOperationStatusChange={() =>
        window.dispatchEvent(new CustomEvent('refreshUserState', { detail: { forceUpdate: true } }))
      } />

      {/* Page — full scroll */}
      <div style={{
        paddingTop: '72px',   /* header height */
        minHeight: '100dvh',
        background: '#f9fafb',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 100px' }}>

          {/* Back */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', padding: '0 0 16px',
              fontSize: '14px', fontWeight: '600', color: '#6b7280', cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} /> Voltar ao Mapa
          </button>

          {/* Title + stats pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#111' }}>
              Painel do Voluntário
            </h1>
            {!loading && activeCount > 0 && (
              <span style={{
                background: '#111', color: '#fff',
                borderRadius: '999px', padding: '4px 12px',
                fontSize: '12px', fontWeight: '700',
              }}>
                {activeCount} ativo{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '8px',
            background: '#f3f4f6', borderRadius: '14px', padding: '4px',
            marginBottom: '20px',
          }}>
            {[
              { id: 'entregas', label: 'Entregas', icon: Truck, count: myDeliveries.length },
              { id: 'doacoes', label: 'Doações', icon: Package, count: myDonations.length },
            ].map(({ id, label, icon: Icon, count }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px',
                    borderRadius: '11px',
                    border: 'none',
                    background: active ? '#fff' : 'transparent',
                    color: active ? '#111' : '#6b7280',
                    fontSize: '13px', fontWeight: active ? '700' : '500',
                    cursor: 'pointer',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} />
                  {label}
                  {count > 0 && (
                    <span style={{
                      background: active ? '#111' : '#e5e7eb',
                      color: active ? '#fff' : '#374151',
                      borderRadius: '999px', padding: '1px 7px',
                      fontSize: '11px', fontWeight: '700',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              Carregando...
            </div>
          ) : tab === 'entregas' ? (
            myDeliveries.length === 0
              ? <Empty icon={Truck} title="Nenhuma entrega ativa" sub="Encontre entregas disponíveis no mapa" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myDeliveries.map(d => (
                  <DeliveryCard key={d.id} delivery={d} onCancel={handleCancelarEntrega} onConfirm={handleConfirmarEntrega} />
                ))}
              </div>
          ) : (
            myDonations.length === 0
              ? <Empty icon={Package} title="Nenhuma doação ativa" sub="Busque pedidos de insumos no mapa" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myDonations.map(d => (
                  <DonationCard key={d.id} donation={d} onCancel={handleCancelarDoacao} />
                ))}
              </div>
          )}
        </div>
      </div>

      {/* Modal Código */}
      {showCodigoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', maxWidth: '480px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Confirmar Entrega</h3>
              <button onClick={() => setShowCodigoModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
              Digite o código de 6 dígitos fornecido pelo abrigo:
            </p>
            <input
              type="text"
              value={codigoConfirmacao}
              onChange={e => setCodigoConfirmacao(e.target.value)}
              maxLength={6}
              placeholder="000000"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                border: '2px solid #e5e7eb', fontSize: '24px', fontWeight: '800',
                textAlign: 'center', letterSpacing: '6px', fontFamily: 'monospace',
                boxSizing: 'border-box', marginBottom: '14px', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCodigoModal(false)} style={btnStyle('#f3f4f6', 'none', '#374151')}>
                Cancelar
              </button>
              <button onClick={confirmarAcao} style={btnStyle('#16a34a', 'none', '#fff', true)}>
                <CheckCircle size={16} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal show={alert.show} onClose={closeAlert} title={alert.title} message={alert.message} type={alert.type} />
    </>
  );
}
