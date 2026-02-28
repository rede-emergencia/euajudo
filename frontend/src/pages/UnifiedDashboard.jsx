import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
  batches, deliveries, resourceRequests, resourceReservations
} from '../lib/api';
import { UserRole } from '../shared/enums';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROLE_LABEL = { 
  [UserRole.PROVIDER]: 'Fornecedor', 
  [UserRole.VOLUNTEER]: 'Voluntário', 
  [UserRole.SHELTER]: 'Abrigo', 
  [UserRole.ADMIN]: 'Admin' 
};

function getRolePrimary(roles = []) {
  for (const r of [UserRole.ADMIN, UserRole.PROVIDER, UserRole.VOLUNTEER, UserRole.SHELTER]) {
    if (roles.includes(r)) return r;
  }
  return UserRole.VOLUNTEER;
}

function getUserRole(user) {
  if (!user) return null;
  const roles = Array.isArray(user.roles)
    ? user.roles
    : (user.roles || '').split(',').map(r => r.trim());
  return getRolePrimary(roles);
}

const STATUS_COLORS = {
  available: { bg: '#dcfce7', color: '#16a34a', label: 'Disponível' },
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pendente' },
  pending_confirmation: { bg: '#fef3c7', color: '#d97706', label: 'Aguardando' },
  reserved: { bg: '#dbeafe', color: '#2563eb', label: 'Reservado' },
  in_transit: { bg: '#dbeafe', color: '#2563eb', label: 'Em trânsito' },
  picked_up: { bg: '#dbeafe', color: '#2563eb', label: 'Retirado' },
  delivered: { bg: '#dcfce7', color: '#16a34a', label: 'Entregue' },
  completed: { bg: '#dcfce7', color: '#16a34a', label: 'Concluído' },
  cancelled: { bg: '#f3f4f6', color: '#9ca3af', label: 'Cancelado' },
  requesting: { bg: '#fef3c7', color: '#d97706', label: 'Solicitando' },
  partially_fulfilled: { bg: '#dbeafe', color: '#2563eb', label: 'Parcial' },
  REQUESTING: { bg: '#fef3c7', color: '#d97706', label: 'Solicitando' },
  PARTIALLY_FULFILLED: { bg: '#dbeafe', color: '#2563eb', label: 'Parcial' },
  COMPLETED: { bg: '#dcfce7', color: '#16a34a', label: 'Concluído' },
  CANCELLED: { bg: '#f3f4f6', color: '#9ca3af', label: 'Cancelado' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '99px',
      fontSize: '12px',
      fontWeight: '600',
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#2563eb', icon }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '14px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: '1 1 140px',
      minWidth: 0,
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: color + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#111', lineHeight: 1 }}>{value}</p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: '#111' }}>
      {children}
    </h2>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: 'center', padding: '32px 16px',
      color: '#9ca3af', fontSize: '14px',
      background: 'white', borderRadius: '14px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
      {message}
    </div>
  );
}

function ItemCard({ title, subtitle, status, meta, action }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '14px 16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </p>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </p>
          )}
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      {meta && (
        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{meta}</p>
      )}
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  );
}

// ─── Role Sections ────────────────────────────────────────────────────────────

function ProviderSection({ navigate }) {
  const [myBatches, setMyBatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [pendingPickups, setPendingPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, r, d] = await Promise.all([
        batches.getMy().catch(() => ({ data: [] })),
        resourceRequests.getMy().catch(() => ({ data: [] })),
        deliveries.list().catch(() => ({ data: [] })),
      ]);
      setMyBatches(b.data || []);
      setMyRequests(r.data || []);
      setPendingPickups((d.data || []).filter(d =>
        d.status === 'pending_confirmation' || d.status === 'reserved'
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener('refreshUserState', load);
    return () => window.removeEventListener('refreshUserState', load);
  }, [load]);

  const active = myBatches.filter(b => b.status === 'available' || b.status === 'pending');
  const activeReqs = myRequests.filter(r => r.status === 'REQUESTING' || r.status === 'requesting');

  if (loading) return <LoadingSection />;

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Publicações ativas" value={active.length} color="#16a34a" icon="📦" />
        <StatCard label="Solicitações abertas" value={activeReqs.length} color="#d97706" icon="📋" />
        <StatCard label="Retiradas pendentes" value={pendingPickups.length} color="#2563eb" icon="🚛" />
      </div>

      {/* Publicações */}
      <div style={{ marginBottom: '24px' }}>
        <SectionTitle>Minhas Publicações</SectionTitle>
        {myBatches.length === 0
          ? <EmptyState message="Nenhuma publicação ainda" />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myBatches.slice(0, 5).map(b => (
                <ItemCard
                  key={b.id}
                  title={b.description || b.product_type || 'Publicação'}
                  subtitle={`${b.quantity} unidades`}
                  status={b.status}
                  meta={b.pickup_deadline ? `Prazo: ${new Date(b.pickup_deadline).toLocaleDateString('pt-BR')}` : null}
                />
              ))}
            </div>
        }
      </div>

      {/* Retiradas pendentes */}
      {pendingPickups.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionTitle>Retiradas Pendentes</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingPickups.map(d => (
              <ItemCard
                key={d.id}
                title={`Entrega #${d.id}`}
                subtitle={d.volunteer_name || 'Voluntário'}
                status={d.status}
                meta={d.pickup_code ? `Código de retirada: ${d.pickup_code}` : null}
              />
            ))}
          </div>
        </div>
      )}

      <QuickActions role="provider" navigate={navigate} />
    </>
  );
}

function VolunteerSection({ navigate }) {
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([
        deliveries.list().catch(() => ({ data: [] })),
        resourceReservations.list().catch(() => ({ data: [] })),
      ]);
      setMyDeliveries(d.data || []);
      setMyDonations(r.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener('refreshUserState', load);
    return () => window.removeEventListener('refreshUserState', load);
  }, [load]);

  const activeDeliveries = myDeliveries.filter(d =>
    ['pending_confirmation', 'reserved', 'picked_up', 'in_transit'].includes(d.status)
  );
  const activeDonations = myDonations.filter(r =>
    r.status !== 'cancelled' && r.status !== 'delivered' && r.status !== 'completed'
  );

  if (loading) return <LoadingSection />;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Entregas ativas" value={activeDeliveries.length} color="#2563eb" icon="🚚" />
        <StatCard label="Doações ativas" value={activeDonations.length} color="#16a34a" icon="🎁" />
        <StatCard label="Total de entregas" value={myDeliveries.length} color="#6366f1" icon="📊" />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <SectionTitle>Minhas Entregas</SectionTitle>
        {myDeliveries.length === 0
          ? <EmptyState message="Nenhuma entrega ainda. Veja o mapa para disponíveis!" />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myDeliveries.slice(0, 5).map(d => (
                <ItemCard
                  key={d.id}
                  title={`Entrega #${d.id}`}
                  subtitle={d.location_name || d.destination || 'Destino não informado'}
                  status={d.status}
                  meta={d.pickup_code ? `Código retirada: ${d.pickup_code}` : null}
                />
              ))}
            </div>
        }
      </div>

      {myDonations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionTitle>Minhas Doações</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myDonations.slice(0, 3).map(r => (
              <ItemCard
                key={r.id}
                title={`Doação #${r.id}`}
                subtitle={`${r.items?.length || 0} itens`}
                status={r.status}
              />
            ))}
          </div>
        </div>
      )}

      <QuickActions role="volunteer" navigate={navigate} />
    </>
  );
}

function ShelterSection({ navigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await resourceRequests.list().catch(() => ({ data: [] }));
      setRequests(r.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener('refreshUserState', load);
    return () => window.removeEventListener('refreshUserState', load);
  }, [load]);

  const active = requests.filter(r =>
    r.status === 'REQUESTING' || r.status === 'requesting' ||
    r.status === 'PARTIALLY_FULFILLED' || r.status === 'partially_fulfilled'
  );

  if (loading) return <LoadingSection />;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Pedidos ativos" value={active.length} color="#d97706" icon="📋" />
        <StatCard label="Total de pedidos" value={requests.length} color="#6366f1" icon="📊" />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <SectionTitle>Meus Pedidos de Insumos</SectionTitle>
        {requests.length === 0
          ? <EmptyState message="Nenhum pedido aberto. Use o dashboard de abrigo para criar!" />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.slice(0, 5).map(r => (
                <ItemCard
                  key={r.id}
                  title={`Pedido #${r.id}`}
                  subtitle={`${r.quantity_meals || 0} marmitas`}
                  status={r.status}
                  meta={r.receiving_time ? `Horário: ${r.receiving_time}` : null}
                />
              ))}
            </div>
        }
      </div>

      <QuickActions role={UserRole.SHELTER} navigate={navigate} />
    </>
  );
}

function QuickActions({ role, navigate }) {
  const actions = {
    provider: [
      { label: 'Publicar oferta', emoji: '📦', route: '/dashboard/fornecedor' },
      { label: 'Ver mapa', emoji: '🗺️', route: '/map' },
    ],
    volunteer: [
      { label: 'Ver entregas disponíveis', emoji: '🗺️', route: '/map' },
      { label: 'Minhas entregas', emoji: '🚚', route: '/dashboard/voluntario' },
    ],
    shelter: [
      { label: 'Fazer pedido', emoji: '📋', route: '/dashboard/abrigo' },
      { label: 'Ver mapa', emoji: '🗺️', route: '/map' },
    ],
  };

  const list = actions[role] || [];
  if (list.length === 0) return null;

  return (
    <div>
      <SectionTitle>Ações rápidas</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {list.map(a => (
          <button
            key={a.route}
            onClick={() => navigate(a.route)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #e5e7eb', background: 'white',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            <span>{a.emoji}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '72px', borderRadius: '12px',
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = getUserRole(user);
  const roleName = ROLE_LABEL[role] || 'Usuário';
  const firstName = (user?.name || user?.nome || '').split(' ')[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Header />

      {/* Scrollable content area */}
      <div style={{
        paddingTop: '76px', // espaço para o header fixo
        paddingBottom: '40px',
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 16px',
        }}>

          {/* Welcome bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#111' }}>
                {firstName ? `Olá, ${firstName} 👋` : 'Dashboard'}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {user?.email}
              </p>
            </div>
            <span style={{
              padding: '4px 14px', borderRadius: '99px',
              background: '#dbeafe', color: '#1d4ed8',
              fontSize: '13px', fontWeight: '700',
            }}>
              {roleName}
            </span>
          </div>

          {/* Role content */}
          {!user ? (
            <EmptyState message="Faça login para ver seu dashboard." />
          ) : role === 'provider' ? (
            <ProviderSection navigate={navigate} />
          ) : role === UserRole.VOLUNTEER ? (
            <VolunteerSection navigate={navigate} />
          ) : role === UserRole.SHELTER ? (
            <ShelterSection navigate={navigate} />
          ) : (
            <EmptyState message="Seu perfil não tem um dashboard específico." />
          )}

        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

    </div>
  );
}
