import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pedidosInsumo, reservasInsumo, reservasMarmita, locaisProducao } from '../lib/api';
import { display, colorClass } from '../shared/enums';
import { getProductInfo, getProductText, getProviderText, getProductAction, getProductLocation } from '../lib/productUtils';
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
import { ShoppingCart, Check, X, Clock, Package, AlertCircle } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('entregas');
  const [myReservations, setMyReservations] = useState([]);
  const [minhasReservas, setMinhasReservas] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);
  const [minhasEntregas, setMinhasEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [reservaSelecionada, setReservaSelecionada] = useState(null);
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
      if (activeTab === 'doacoes') {
        try {
          const reservas = await reservasInsumo.list();
          setMinhasReservas(reservas.data || []);
        } catch (error) {
          console.error('Erro ao carregar reservas:', error);
          setMinhasReservas([]);
        }
      } else if (activeTab === 'entregas') {
        try {
          const entregas = await fetch('/api/deliveries/my-deliveries', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const entregasData = await entregas.json();
          setMinhasEntregas(entregasData || []);
        } catch (error) {
          console.error('Erro ao carregar entregas:', error);
          setMinhasEntregas([]);
        }
      } else if (activeTab === 'marmitas') {
        try {
          const orders = await fetch('/api/meal-orders/my-orders', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const ordersData = await orders.json();
          setMealOrders(ordersData || []);
        } catch (error) {
          console.error('Erro ao carregar pedidos de marmita:', error);
          setMealOrders([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    if (!confirm('Deseja realmente cancelar esta reserva?')) {
      return;
    }
    
    try {
      await reservasInsumo.cancel(reservaId);
      showAlert('Sucesso', '✅ Reserva cancelada com sucesso!', 'success');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      showAlert('Erro', '❌ Erro ao cancelar: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleMarcarEntrega = async (reservaId) => {
    setReservaSelecionada(reservaId);
    setCodigoConfirmacao('');
    setShowCodigoModal(true);
  };

  const confirmarEntrega = async () => {
    if (!codigoConfirmacao || codigoConfirmacao.length !== 6) {
      showAlert('Código Inválido', '❌ Por favor, digite o código de 6 dígitos', 'warning');
      return;
    }
    
    try {
      await reservasInsumo.marcarEntrega(reservaSelecionada, codigoConfirmacao);
      showAlert('Sucesso', '✅ Entrega confirmada com sucesso! Obrigado por sua contribuição!', 'success');
      setShowCodigoModal(false);
      setReservaSelecionada(null);
      setCodigoConfirmacao('');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao marcar entrega:', error);
      showAlert('Erro', '❌ Erro ao marcar entrega: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const getStatusColor = (status) => colorClass('OrderStatus', status) || colorClass('BatchStatus', status);
  const getStatusLabel = (status) => display('OrderStatus', status) || display('BatchStatus', status);

  const tabs = [
    { id: 'entregas', label: 'Minhas Entregas', icon: <Package size={16} /> },
    { id: 'doacoes', label: 'Doações', icon: <ShoppingCart size={16} /> },
    { id: 'marmitas', label: 'Marmitas', icon: <Package size={16} /> },
  ];

  const stats = [
    {
      label: 'Entregas Ativas',
      value: minhasEntregas.filter(e => e.status === 'reserved').length,
      icon: <Package size={24} />,
    },
    {
      label: 'Reservas de Doações',
      value: minhasReservas.filter(r => r.status === 'reserved').length,
      icon: <ShoppingCart size={24} />,
    },
    {
      label: 'Pedidos de Marmita',
      value: mealOrders.filter(o => o.status === 'reserved').length,
      icon: <Package size={24} />,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (activeTab === 'entregas') {
      if (minhasEntregas.length === 0) {
        return (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhuma entrega encontrada"
            description="Você não tem entregas ativas no momento."
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
          {minhasEntregas.map(entrega => (
            <Card key={entrega.id} hoverable>
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
                    Entrega #{entrega.id}
                  </h3>
                  <Badge variant={getStatusColor(entrega.status)}>
                    {getStatusLabel(entrega.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Produto:</strong> {getProductText(entrega.product_type, entrega.quantity)}
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Local:</strong> {getProductLocation(entrega.product_type)}
                  </div>
                  <div>
                    <strong>Código:</strong> {entrega.delivery_code}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {entrega.status === 'reserved' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleMarcarEntrega(entrega.id)}
                    >
                      <Check size={16} />
                      Confirmar Entrega
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancelarReserva(entrega.id)}
                    >
                      <X size={16} />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === 'doacoes') {
      if (minhasReservas.length === 0) {
        return (
          <EmptyState
            icon={<ShoppingCart size={48} />}
            title="Nenhuma reserva encontrada"
            description="Você não tem reservas de doações ativas."
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
          {minhasReservas.map(reserva => (
            <Card key={reserva.id} hoverable>
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
                    Reserva #{reserva.id}
                  </h3>
                  <Badge variant={getStatusColor(reserva.status)}>
                    {getStatusLabel(reserva.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Itens:</strong> {reserva.itens?.length || 0}
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Fornecedor:</strong> {getProviderText(reserva.provider_type)}
                  </div>
                  <div>
                    <strong>Data:</strong> {new Date(reserva.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {reserva.status === 'reserved' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleMarcarEntrega(reserva.id)}
                    >
                      <Check size={16} />
                      Confirmar Retirada
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleCancelarReserva(reserva.id)}
                    >
                      <X size={16} />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Marmitas tab
    return (
      <EmptyState
        icon={<Package size={48} />}
        title="Em desenvolvimento"
        description="Funcionalidade de marmitas em desenvolvimento."
      />
    );
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
            Digite o código de confirmação de 6 dígitos fornecido pelo doador:
          </p>
          
          <Input
            label="Código de Confirmação"
            type="text"
            value={codigoConfirmacao}
            onChange={(e) => setCodigoConfirmacao(e.target.value)}
            placeholder="000000"
            maxLength={6}
            style={{ textAlign: 'center', fontSize: fontSize.lg }}
          />
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
