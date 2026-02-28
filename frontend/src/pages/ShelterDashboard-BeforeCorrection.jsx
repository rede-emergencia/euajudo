import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resourceRequests } from '../lib/api';
import { OrderStatus, display, colorClass } from '../shared/enums';
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
import { Plus, Package, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function ShelterDashboard() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [productTypes, setProductTypes] = useState([]);
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    loadOrders();
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/product-config/');
      if (response.ok) {
        const data = await response.json();
        setProductTypes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de produto:', error);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await resourceRequests.list();
      const myOrders = response.data?.filter(r => r.shelter_id === user.id) || [];
      const active = myOrders.find(o => ['pending', 'partially_fulfilled'].includes(o.status));
      setActiveOrder(active || null);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.quantity || !orderForm.startTime || !orderForm.endTime) {
      showAlert('Campos Obrigatórios', 'Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    try {
      await resourceRequests.create({
        product_type: 'meal',
        quantity: parseInt(orderForm.quantity),
        start_time: orderForm.startTime,
        end_time: orderForm.endTime,
        description: orderForm.description,
      });

      showAlert('Sucesso', 'Pedido criado com sucesso!', 'success');
      setShowOrderForm(false);
      setOrderForm({ quantity: '', startTime: '', endTime: '', description: '' });
      loadOrders();
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;

    try {
      await resourceRequests.cancel(orderId);
      showAlert('Sucesso', 'Pedido cancelado com sucesso!', 'success');
      loadOrders();
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    }
  };

  const stats = [
    {
      label: 'Pedido Ativo',
      value: activeOrder ? '1' : '0',
      icon: <Package size={24} />,
    },
    {
      label: 'Quantidade Solicitada',
      value: activeOrder?.quantity || '0',
      icon: <Package size={24} />,
    },
    {
      label: 'Status',
      value: activeOrder ? display('OrderStatus', activeOrder.status) : 'Nenhum',
      icon: <Clock size={24} />,
    },
  ];

  return (
    <>
      <DashboardLayout
        title="Painel do Abrigo"
        stats={stats}
        actions={
          !activeOrder && (
            <Button
              variant="primary"
              onClick={() => setShowOrderForm(true)}
              icon={<Plus size={16} />}
            >
              Novo Pedido
            </Button>
          )
        }
      >
        {loadingOrders ? (
          <LoadingState />
        ) : activeOrder ? (
          <Card>
            <div style={{ marginBottom: spacing.lg }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: spacing.md,
              }}>
                <div>
                  <h3 style={{
                    fontSize: fontSize.xl,
                    fontWeight: fontWeight.bold,
                    color: colors.text.primary,
                    margin: 0,
                    marginBottom: spacing.xs,
                  }}>
                    Pedido #{activeOrder.id}
                  </h3>
                  <Badge variant={colorClass('OrderStatus', activeOrder.status)}>
                    {display('OrderStatus', activeOrder.status)}
                  </Badge>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.md,
                marginTop: spacing.lg,
              }}>
                <div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}>
                    Quantidade
                  </div>
                  <div style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.text.primary,
                  }}>
                    {activeOrder.quantity} marmitas
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}>
                    Período
                  </div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.primary,
                  }}>
                    {new Date(activeOrder.start_time).toLocaleString()} - {new Date(activeOrder.end_time).toLocaleString()}
                  </div>
                </div>

                {activeOrder.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs,
                    }}>
                      Descrição
                    </div>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.text.primary,
                    }}>
                      {activeOrder.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: spacing.sm,
              justifyContent: 'flex-end',
            }}>
              <Button
                variant="error"
                size="sm"
                onClick={() => handleCancelOrder(activeOrder.id)}
                icon={<X size={16} />}
              >
                Cancelar Pedido
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhum pedido ativo"
            description="Crie um novo pedido para começar a receber marmitas."
            action={
              <Button
                onClick={() => setShowOrderForm(true)}
                icon={<Plus size={16} />}
              >
                Criar Pedido
              </Button>
            }
          />
        )}
      </DashboardLayout>

      {/* Modal de Criar Pedido */}
      <Modal
        show={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        title="Novo Pedido de Marmitas"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowOrderForm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrder}
            >
              Criar Pedido
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Marmitas"
            type="number"
            value={orderForm.quantity}
            onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
            placeholder="Ex: 50"
            required
            min="1"
          />

          <Input
            label="Início do Período"
            type="datetime-local"
            value={orderForm.startTime}
            onChange={(e) => setOrderForm({ ...orderForm, startTime: e.target.value })}
            required
          />

          <Input
            label="Fim do Período"
            type="datetime-local"
            value={orderForm.endTime}
            onChange={(e) => setOrderForm({ ...orderForm, endTime: e.target.value })}
            required
          />

          <div>
            <label style={{
              display: 'block',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing.xs,
            }}>
              Descrição (opcional)
            </label>
            <textarea
              value={orderForm.description}
              onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
              placeholder="Informações adicionais sobre o pedido..."
              rows={3}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.border.medium}`,
                borderRadius: '6px',
                fontSize: fontSize.base,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
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
