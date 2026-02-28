import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deliveries } from '../lib/api';
import { 
  Button, 
  Card, 
  Badge, 
  Modal, 
  Input, 
  DashboardLayout, 
  EmptyState, 
  LoadingState 
} from '../components/ui';
import { Package, Truck, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('entregas');
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');
  const { alert, showAlert, closeAlert } = useAlert();

  // Função para disparar atualização do estado do usuário
  const triggerUserStateUpdate = () => {
    window.dispatchEvent(new CustomEvent('userOperationUpdate', {
      detail: { forceUpdate: true }
    }));
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'entregas') {
        // Carregar entregas que o voluntário está fazendo
        const response = await deliveries.list();
        const activeDeliveries = response.data?.filter(d => 
          d.volunteer_id === user.id && ['reserved', 'picked_up', 'in_transit'].includes(d.status)
        ) || [];
        setMyDeliveries(activeDeliveries);
      } else if (activeTab === 'doacoes') {
        // Carregar doações que o voluntário está fazendo (compras de insumos)
        try {
          const response = await fetch('/api/resource-reservations/my', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const donations = await response.json();
          setMyDonations(donations || []);
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

  const handleConfirmarEntrega = async (deliveryId) => {
    setSelectedDelivery(deliveryId);
    setCodigoConfirmacao('');
    setShowCodigoModal(true);
  };

  const confirmarEntrega = async () => {
    if (!codigoConfirmacao || codigoConfirmacao.length !== 6) {
      showAlert('Código Inválido', 'Digite o código de 6 dígitos', 'warning');
      return;
    }
    
    try {
      const response = await fetch(`/api/deliveries/${selectedDelivery}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ delivery_code: codigoConfirmacao })
      });

      if (response.ok) {
        showAlert('Sucesso', '✅ Entrega confirmada com sucesso!', 'success');
        setShowCodigoModal(false);
        setSelectedDelivery(null);
        setCodigoConfirmacao('');
        loadData();
        triggerUserStateUpdate();
      } else {
        const error = await response.json();
        showAlert('Erro', '❌ ' + (error.detail || 'Erro ao confirmar entrega'), 'error');
      }
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      showAlert('Erro', '❌ Erro ao confirmar entrega', 'error');
    }
  };

  const handleCancelarEntrega = async (deliveryId) => {
    if (!confirm('Tem certeza que deseja cancelar esta entrega? Isso irá desfazer o compromisso.')) return;
    
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        loadData();
        triggerUserStateUpdate();
      } else {
        const error = await response.json();
        showAlert('Erro', '❌ ' + (error.detail || 'Erro ao cancelar entrega'), 'error');
      }
    } catch (error) {
      console.error('Erro ao cancelar entrega:', error);
      showAlert('Erro', '❌ Erro ao cancelar entrega', 'error');
    }
  };

  const handleCancelarDoacao = async (donationId) => {
    if (!confirm('Tem certeza que deseja cancelar esta doação? Isso irá desfazer o compromisso.')) return;
    
    try {
      const response = await fetch(`/api/resource-reservations/${donationId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        loadData();
        triggerUserStateUpdate();
      } else {
        const error = await response.json();
        showAlert('Erro', '❌ ' + (error.detail || 'Erro ao cancelar doação'), 'error');
      }
    } catch (error) {
      console.error('Erro ao cancelar doação:', error);
      showAlert('Erro', '❌ Erro ao cancelar doação', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reserved': return 'warning';
      case 'picked_up': return 'primary';
      case 'in_transit': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'reserved': return 'Comprometido';
      case 'picked_up': return 'Retirado';
      case 'in_transit': return 'Em Trânsito';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const tabs = [
    { 
      id: 'entregas', 
      label: 'Minhas Entregas', 
      icon: <Truck size={16} />,
      badge: myDeliveries.length 
    },
    { 
      id: 'doacoes', 
      label: 'Minhas Doações', 
      icon: <Package size={16} />,
      badge: myDonations.length 
    },
  ];

  const stats = [
    {
      label: 'Entregas Ativas',
      value: myDeliveries.filter(d => ['reserved', 'picked_up', 'in_transit'].includes(d.status)).length,
      icon: <Truck size={24} />,
    },
    {
      label: 'Doações Ativas',
      value: myDonations.filter(d => ['reserved', 'acquired'].includes(d.status)).length,
      icon: <Package size={24} />,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (activeTab === 'entregas') {
      if (myDeliveries.length === 0) {
        return (
          <EmptyState
            icon={<Truck size={48} />}
            title="Nenhuma entrega ativa"
            description="Você não está fazendo nenhuma entrega no momento. Vá para o mapa para se voluntariar!"
            action={
              <Button onClick={() => window.location.href = '/'}>
                Ver Mapa de Entregas
              </Button>
            }
          />
        );
      }

      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: spacing.lg,
        }}>
          {myDeliveries.map(delivery => (
            <Card key={delivery.id} hoverable>
              <div style={{ marginBottom: spacing.md }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}>
                  <h3 style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.text.primary,
                    margin: 0,
                  }}>
                    Entrega #{delivery.id}
                  </h3>
                  <Badge variant={getStatusColor(delivery.status)}>
                    {getStatusLabel(delivery.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Produto:</strong> {delivery.quantity} marmitas
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Local:</strong> {delivery.location?.name || 'Não especificado'}
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Código:</strong> {delivery.delivery_code || '123456'}
                  </div>
                  {delivery.created_at && (
                    <div>
                      <strong>Início:</strong> {new Date(delivery.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {delivery.status === 'reserved' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirmarEntrega(delivery.id)}
                      icon={<CheckCircle size={16} />}
                    >
                      Retirar Produto
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancelarEntrega(delivery.id)}
                      icon={<X size={16} />}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {delivery.status === 'picked_up' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirmarEntrega(delivery.id)}
                      icon={<CheckCircle size={16} />}
                    >
                      Confirmar Entrega
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancelarEntrega(delivery.id)}
                      icon={<X size={16} />}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {delivery.status === 'in_transit' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleConfirmarEntrega(delivery.id)}
                    icon={<CheckCircle size={16} />}
                  >
                    Confirmar Entrega
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Tab de Doações (compras de insumos que voluntário está fazendo)
    if (activeTab === 'doacoes') {
      if (myDonations.length === 0) {
        return (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhuma doação ativa"
            description="Você não está fazendo nenhuma doação/compra no momento. Vá para o mapa para ajudar!"
            action={
              <Button onClick={() => window.location.href = '/'}>
                Ver Mapa de Doações
              </Button>
            }
          />
        );
      }

      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: spacing.lg,
        }}>
          {myDonations.map(donation => (
            <Card key={donation.id} hoverable>
              <div style={{ marginBottom: spacing.md }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}>
                  <h3 style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.text.primary,
                    margin: 0,
                  }}>
                    Doação #{donation.id}
                  </h3>
                  <Badge variant={getStatusColor(donation.status)}>
                    {getStatusLabel(donation.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Itens:</strong> {donation.items?.length || 0} itens
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Para:</strong> {donation.request?.location?.name || 'Não especificado'}
                  </div>
                  {donation.created_at && (
                    <div>
                      <strong>Início:</strong> {new Date(donation.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {donation.status === 'reserved' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle size={16} />}
                    >
                      Confirmar Compra
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancelarDoacao(donation.id)}
                      icon={<X size={16} />}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {donation.status === 'acquired' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle size={16} />}
                  >
                    Entregar Itens
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      <DashboardLayout
        title="Painel do Voluntário"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Modal de Código de Confirmação */}
      <Modal
        show={showCodigoModal}
        onClose={() => setShowCodigoModal(false)}
        title="Confirmar Entrega"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCodigoModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={confirmarEntrega}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div style={{ marginBottom: spacing.lg }}>
          <p style={{
            fontSize: fontSize.base,
            color: colors.text.secondary,
            marginBottom: spacing.md,
            lineHeight: 1.5,
          }}>
            Digite o código de confirmação de 6 dígitos:
          </p>
          
          <Input
            label="Código de Confirmação"
            type="text"
            value={codigoConfirmacao}
            onChange={(e) => setCodigoConfirmacao(e.target.value)}
            placeholder="123456"
            maxLength={6}
            style={{ textAlign: 'center', fontSize: fontSize.lg }}
          />
          
          <p style={{
            fontSize: fontSize.sm,
            color: colors.primary[600],
            marginTop: spacing.sm,
            textAlign: 'center',
          }}>
            💡 Dica: Use "123456" para testar
          </p>
        </div>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        show={alert.show}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </>
  );
}
