import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resourceRequests } from '../lib/api';
import {
  ArrowLeft, Home, Clock, Plus, X, ChevronDown, ChevronUp,
  Shirt, Pill, UtensilsCrossed, Sparkles, Droplets, Package,
} from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import Header from '../components/Header';

/* ─── Presets ────────────────────────────────────────────────────────── */
const PRESETS = [
  { id: 'roupas',       label: 'Roupas',           Icon: Shirt,           unit: 'peças'    },
  { id: 'medicamentos', label: 'Medicamentos',      Icon: Pill,            unit: 'unidades' },
  { id: 'marmita',      label: 'Marmita',           Icon: UtensilsCrossed, unit: 'porções'  },
  { id: 'limpeza',      label: 'Prod. de Limpeza',  Icon: Sparkles,        unit: 'unidades' },
  { id: 'higiene',      label: 'Higiene Pessoal',   Icon: Droplets,        unit: 'unidades' },
];

/* ─── Status ─────────────────────────────────────────────────────────── */
const STATUS = {
  requesting:         { label: 'Aguardando',            color: '#d97706', bg: '#fef9c3' },
  partially_reserved: { label: 'Parcialmente Atendida', color: '#2563eb', bg: '#eff6ff' },
  completed:          { label: 'Concluída',             color: '#16a34a', bg: '#f0fdf4' },
  cancelled:          { label: 'Cancelada',             color: '#dc2626', bg: '#fef2f2' },
  expired:            { label: 'Expirada',              color: '#6b7280', bg: '#f3f4f6' },
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

/* ─── Request Card ───────────────────────────────────────────────────── */
function RequestCard({ request, onCancel }) {
  const canCancel = request.status === 'requesting';

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: '16px', padding: '16px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
            Solicitação #{request.id}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {request.created_at ? new Date(request.created_at).toLocaleDateString('pt-BR') : ''}
          </p>
        </div>
        <Badge status={request.status} />
      </div>

      {request.items?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {request.items.map((item) => {
            const preset = PRESETS.find(p => item.name?.startsWith(p.label));
            const ItemIcon = preset?.Icon || Package;
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#f9fafb', borderRadius: '10px', padding: '8px 12px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ItemIcon size={16} color="#374151" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#111' }}>
                    {item.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    {item.quantity} {item.unit}
                    {item.quantity_reserved > 0 && (
                      <span style={{ color: '#2563eb' }}>
                        {' '}· {item.quantity_reserved} reservado{item.quantity_reserved !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>
          {request.quantity_meals} itens solicitados
        </div>
      )}

      {request.confirmation_code && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '12px', padding: '12px', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#1d4ed8', fontWeight: '600' }}>
            Código de Confirmação — passe ao voluntário na entrega
          </p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: '#1e40af', fontFamily: 'monospace' }}>
            {request.confirmation_code}
          </p>
        </div>
      )}

      {canCancel && (
        <button onClick={() => onCancel(request.id)} style={btnStyle('#fff', '#fecaca', '#dc2626')}>
          <X size={14} /> Cancelar Solicitação
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
function Empty({ onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%',
        background: '#f3f4f6', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <Home size={28} color="#9ca3af" />
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
        Nenhuma solicitação ativa
      </p>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
        Crie uma solicitação para receber itens de fornecedores
      </p>
      <button
        onClick={onAction}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 20px',
          backgroundColor: '#2563eb', color: 'white',
          border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        }}
      >
        <Plus size={15} /> Nova Solicitação
      </button>
    </div>
  );
}

/* ─── Item Row (dentro do form) ──────────────────────────────────────── */
function ItemRow({ item, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const preset = PRESETS.find(p => p.id === item.type);
  const { Icon } = preset || { Icon: Package };

  return (
    <div style={{
      background: '#f9fafb', border: '1.5px solid #e5e7eb',
      borderRadius: '14px', padding: '14px',
      display: 'flex', flexDirection: 'column', gap: collapsed ? '0' : '10px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={16} color="#374151" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{preset?.label}</span>
          {collapsed && item.quantity && (
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
              — {item.quantity} {preset?.unit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Minimizar */}
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expandir' : 'Minimizar'}
            style={{
              background: '#e5e7eb', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {collapsed
              ? <ChevronDown size={13} color="#374151" />
              : <ChevronUp size={13} color="#374151" />
            }
          </button>
          {/* Remover */}
          <button
            onClick={onRemove}
            title="Remover"
            style={{
              background: '#fee2e2', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} color="#dc2626" />
          </button>
        </div>
      </div>

      {/* Campos — colapsáveis */}
      {!collapsed && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
              Quantidade * <span style={{ fontWeight: '400' }}>({preset?.unit})</span>
            </label>
            <input
              type="number"
              value={item.quantity}
              onChange={e => onChange({ ...item, quantity: e.target.value })}
              placeholder="Ex: 10"
              min="1"
              style={{ ...inputStyle, background: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '5px' }}>
              Especificações
            </label>
            <textarea
              value={item.specs}
              onChange={e => onChange({ ...item, specs: e.target.value })}
              placeholder={specPlaceholder(item.type)}
              rows={2}
              style={{ ...inputStyle, background: '#fff', fontFamily: 'inherit', resize: 'none' }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function specPlaceholder(type) {
  const map = {
    roupas:       'Ex: tamanhos P/M/G, masculino/feminino, agasalhos...',
    medicamentos: 'Ex: analgésicos, antialérgicos, curativo...',
    marmita:      'Ex: sem glúten, vegetariana, porção adulto...',
    limpeza:      'Ex: detergente, desinfetante, vassoura...',
    higiene:      'Ex: sabonete, pasta de dente, absorvente...',
  };
  return map[type] || 'Descreva o que precisa...';
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none',
};

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function ShelterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('ativas');
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const { alert, showAlert, closeAlert } = useAlert();

  const triggerUserStateUpdate = () =>
    window.dispatchEvent(new CustomEvent('refreshUserState', { detail: { forceUpdate: true } }));

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('refreshUserState', handler);
    return () => window.removeEventListener('refreshUserState', handler);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await resourceRequests.getMy();
      setAllRequests(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeRequests  = allRequests.filter(r => ['requesting', 'partially_reserved'].includes(r.status));
  const historyRequests = allRequests.filter(r => ['completed', 'cancelled', 'expired'].includes(r.status));
  const hasActive = activeRequests.length > 0;

  const addItem = (preset) => {
    setItems(prev => [...prev, { uid: Date.now(), type: preset.id, quantity: '', specs: '' }]);
    setShowPresets(false);
  };
  const removeItem = (uid) => setItems(prev => prev.filter(i => i.uid !== uid));
  const updateItem = (uid, updated) => setItems(prev => prev.map(i => i.uid === uid ? updated : i));

  const openForm = () => {
    setItems([]);
    setShowPresets(false);
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (items.length === 0) {
      showAlert('Sem itens', 'Adicione pelo menos um produto à solicitação.', 'warning');
      return;
    }
    const missing = items.find(i => !i.quantity || parseInt(i.quantity) < 1);
    if (missing) {
      showAlert('Quantidade inválida', 'Preencha a quantidade de todos os produtos.', 'warning');
      return;
    }
    try {
      await resourceRequests.create({
        quantity_meals: items.reduce((acc, i) => acc + parseInt(i.quantity || 0), 0),
        items: items.map(i => {
          const p = PRESETS.find(p => p.id === i.type);
          return {
            name: i.specs ? `${p.label} — ${i.specs}` : p.label,
            quantity: parseFloat(i.quantity),
            unit: p.unit,
          };
        }),
      });
      showAlert('Sucesso', '✅ Solicitação criada com sucesso!', 'success');
      setShowForm(false);
      setItems([]);
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      showAlert('Erro', error.message || 'Erro ao criar solicitação', 'error');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(`Cancelar solicitação #${id}?`)) return;
    try {
      await resourceRequests.cancel(id);
      showAlert('Sucesso', '✅ Solicitação cancelada!', 'success');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      showAlert('Erro', error.message || 'Erro ao cancelar', 'error');
    }
  };

  const displayed = tab === 'ativas' ? activeRequests : historyRequests;

  return (
    <>
      <Header onOperationStatusChange={() =>
        window.dispatchEvent(new CustomEvent('refreshUserState', { detail: { forceUpdate: true } }))
      } />

      <div style={{
        paddingTop: '72px',
        minHeight: '100dvh',
        background: '#f9fafb',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 100px' }}>

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#111' }}>
              Painel do Abrigo
            </h1>
            {!hasActive && (
              <button
                onClick={openForm}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#2563eb', color: '#fff',
                  border: 'none', borderRadius: '12px',
                  padding: '8px 14px', fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Nova
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '8px',
            background: '#f3f4f6', borderRadius: '14px', padding: '4px',
            marginBottom: '20px',
          }}>
            {[
              { id: 'ativas',    label: 'Solicitações', icon: Home,  count: activeRequests.length },
              { id: 'historico', label: 'Histórico',    icon: Clock, count: historyRequests.length },
            ].map(({ id, label, icon: Icon, count }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px', borderRadius: '11px', border: 'none',
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              Carregando...
            </div>
          ) : displayed.length === 0 ? (
            tab === 'ativas'
              ? <Empty onAction={openForm} />
              : (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af', fontSize: '14px' }}>
                  Nenhuma solicitação no histórico
                </div>
              )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayed.map(r => (
                <RequestCard key={r.id} request={r} onCancel={handleCancel} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal centrado — nova solicitação ──────────────────────────── */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: '20px',
            width: '100%', maxWidth: '480px',
            maxHeight: '85dvh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            {/* Header fixo */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px 0',
              flexShrink: 0,
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Nova Solicitação</h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: '#f3f4f6', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Corpo scrollável */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

              {/* Itens adicionados */}
              {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {items.map(item => (
                    <ItemRow
                      key={item.uid}
                      item={item}
                      onChange={updated => updateItem(item.uid, updated)}
                      onRemove={() => removeItem(item.uid)}
                    />
                  ))}
                </div>
              )}

              {/* Adicionar produto */}
              <div>
                <button
                  onClick={() => setShowPresets(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '12px', borderRadius: '12px',
                    border: '2px dashed #d1d5db',
                    background: 'transparent', color: '#6b7280',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  {items.length === 0 ? 'Adicionar produto' : 'Adicionar outro produto'}
                  <ChevronDown
                    size={14}
                    style={{
                      marginLeft: 'auto',
                      transform: showPresets ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                </button>

                {showPresets && (
                  <div style={{
                    marginTop: '10px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                  }}>
                    {PRESETS.map(({ id, label, Icon, unit }) => {
                      const alreadyAdded = items.some(i => i.type === id);
                      return (
                        <button
                          key={id}
                          onClick={() => !alreadyAdded && addItem({ id, label, Icon, unit })}
                          disabled={alreadyAdded}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '12px 14px', borderRadius: '12px',
                            border: alreadyAdded ? '1.5px solid #e5e7eb' : '1.5px solid #bfdbfe',
                            background: alreadyAdded ? '#f9fafb' : '#eff6ff',
                            color: alreadyAdded ? '#9ca3af' : '#1d4ed8',
                            fontSize: '13px', fontWeight: '700',
                            cursor: alreadyAdded ? 'default' : 'pointer',
                            textAlign: 'left',
                            opacity: alreadyAdded ? 0.6 : 1,
                          }}
                        >
                          <Icon size={16} color={alreadyAdded ? '#9ca3af' : '#1d4ed8'} />
                          <span style={{ lineHeight: 1.3 }}>{label}</span>
                          {alreadyAdded && (
                            <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <div style={{
              display: 'flex', gap: '10px',
              padding: '16px 24px 20px',
              borderTop: '1px solid #f3f4f6',
              flexShrink: 0,
            }}>
              <button onClick={() => setShowForm(false)} style={btnStyle('#f3f4f6', 'none', '#374151')}>
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={items.length === 0}
                style={{
                  ...btnStyle('#2563eb', 'none', '#fff', true),
                  opacity: items.length === 0 ? 0.5 : 1,
                  cursor: items.length === 0 ? 'default' : 'pointer',
                }}
              >
                <Plus size={16} /> Criar Solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal show={alert.show} onClose={closeAlert} title={alert.title} message={alert.message} type={alert.type} />
    </>
  );
}
