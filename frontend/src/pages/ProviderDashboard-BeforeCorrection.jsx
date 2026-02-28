import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pedidosInsumo, batches } from '../lib/api';
import { BatchStatus, display, colorClass } from '../shared/enums';
import { 
  Button, 
  Card, 
  Badge, 
  Modal, 
  Input, 
  DashboardLayout, 
  EmptyState, 
  LoadingState,
  TabButton
} from '../components/ui';
import { Plus, Package, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [myRequests, setMyRequests] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCreateBatchForm, setShowCreateBatchForm] = useState(false);
  const [formData, setFormData] = useState({
    quantity_meals: '',
    items: [{ name: '', quantity: '', unit: 'kg' }]
  });
  const [batchForm, setBatchForm] = useState({
    quantity: '',
    description: '',
    pickupDeadline: ''
  });
  const { alert, showAlert, closeAlert } = useAlert();

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
      if (activeTab === 'pedidos') {
        const requests = await pedidosInsumo.list();
        setMyRequests(requests.data || []);
      } else if (activeTab === 'ofertas') {
        const batchesResp = await batches.list();
        setMyBatches(batchesResp.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({ 
      ...formData, 
      items: [...formData.items, { name: '', quantity: '', unit: 'kg' }] 
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quantity_meals: parseInt(formData.quantity_meals),
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: item.unit
        }))
      };
      await pedidosInsumo.create(payload);
      showAlert('Sucesso', '✅ Pedido de insumos criado com sucesso!', 'success');
      setShowForm(false);
      setFormData({ quantity_meals: '', items: [{ name: '', quantity: '', unit: 'kg' }] });
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      showAlert('Erro', '❌ Erro ao criar pedido: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_type: "meal",
        quantity: parseInt(batchForm.quantity),
        description: batchForm.description,
        donated_ingredients: true,
        pickup_deadline: batchForm.pickupDeadline
      };
      await batches.create(payload);
      showAlert('Sucesso', '✅ Marmitas publicadas com sucesso! Disponíveis para retirada por 4 horas.', 'success');
      setShowCreateBatchForm(false);
      setBatchForm({ quantity: '', description: '', pickupDeadline: '' });
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao publicar marmitas:', error);
      showAlert('Erro', '❌ Erro ao publicar: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    try {
      await pedidosInsumo.cancel(requestId);
      showAlert('Sucesso', '✅ Pedido cancelado com sucesso!', 'success');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      showAlert('Erro', '❌ Erro ao cancelar: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const tabs = [
    { id: 'pedidos', label: 'Pedidos de Insumos', icon: <Package size={16} />, badge: myRequests.length },
    { id: 'ofertas', label: 'Ofertas de Marmitas', icon: <Package size={16} />, badge: myBatches.length },
  ];

  const stats = [
    {
      label: 'Pedidos Ativos',
      value: myRequests.filter(r => r.status === 'pending').length,
      icon: <Package size={24} />,
    },
    {
      label: 'Ofertas Ativas',
      value: myBatches.filter(b => b.status === 'available').length,
      icon: <Package size={24} />,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (activeTab === 'pedidos') {
      if (myRequests.length === 0) {
        return (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhum pedido de insumos"
            description="Crie um pedido para solicitar ingredientes."
            action={
              <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
                Criar Pedido
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
          {myRequests.map(request => (
            <Card key={request.id} hoverable>
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
                    Pedido #{request.id}
                  </h3>
                  <Badge variant={colorClass('OrderStatus', request.status)}>
                    {display('OrderStatus', request.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Marmitas:</strong> {request.quantity_meals}
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Itens:</strong> {request.items?.length || 0}
                  </div>
                  <div>
                    <strong>Data:</strong> {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <Button
                  variant="error"
                  size="sm"
                  fullWidth
                  onClick={() => handleCancelRequest(request.id)}
                  icon={<X size={16} />}
                >
                  Cancelar Pedido
                </Button>
              )}
            </Card>
          ))}
        </div>
      );
    }

    if (activeTab === 'ofertas') {
      if (myBatches.length === 0) {
        return (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhuma oferta de marmitas"
            description="Publique marmitas para disponibilizar para retirada."
            action={
              <Button onClick={() => setShowCreateBatchForm(true)} icon={<Plus size={16} />}>
                Publicar Marmitas
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
          {myBatches.map(batch => (
            <Card key={batch.id} hoverable>
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
                    Lote #{batch.id}
                  </h3>
                  <Badge variant={colorClass('BatchStatus', batch.status)}>
                    {display('BatchStatus', batch.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Quantidade:</strong> {batch.quantity} marmitas
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Disponível:</strong> {batch.quantity - (batch.reserved_quantity || 0)}
                  </div>
                  {batch.description && (
                    <div>
                      <strong>Descrição:</strong> {batch.description}
                    </div>
                  )}
                </div>
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
        title="Painel do Fornecedor"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        actions={
          activeTab === 'pedidos' ? (
            <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
              Novo Pedido
            </Button>
          ) : (
            <Button onClick={() => setShowCreateBatchForm(true)} icon={<Plus size={16} />}>
              Publicar Marmitas
            </Button>
          )
        }
      >
        {renderContent()}
      </DashboardLayout>

      {/* Modal de Criar Pedido de Insumos */}
      <Modal
        show={showForm}
        onClose={() => setShowForm(false)}
        title="Novo Pedido de Insumos"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateRequest}>
              Criar Pedido
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Marmitas"
            type="number"
            value={formData.quantity_meals}
            onChange={(e) => setFormData({ ...formData, quantity_meals: e.target.value })}
            placeholder="Ex: 100"
            required
            min="1"
          />

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <label style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.medium,
                color: colors.text.primary,
              }}>
                Itens Necessários
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                icon={<Plus size={14} />}
              >
                Adicionar Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}>
                <Input
                  placeholder="Nome do item"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  required
                />
                <Input
                  type="number"
                  placeholder="Quantidade"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  required
                  min="0"
                  step="0.1"
                />
                <select
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                  style={{
                    padding: spacing.sm,
                    border: `1px solid ${colors.border.medium}`,
                    borderRadius: '6px',
                    fontSize: fontSize.base,
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="un">un</option>
                </select>
                {formData.items.length > 1 && (
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    icon={<X size={14} />}
                  />
                )}
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {/* Modal de Publicar Marmitas */}
      <Modal
        show={showCreateBatchForm}
        onClose={() => setShowCreateBatchForm(false)}
        title="Publicar Marmitas"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateBatchForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateBatch}>
              Publicar
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Marmitas"
            type="number"
            value={batchForm.quantity}
            onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
            placeholder="Ex: 50"
            required
            min="1"
          />

          <Input
            label="Prazo para Retirada"
            type="datetime-local"
            value={batchForm.pickupDeadline}
            onChange={(e) => setBatchForm({ ...batchForm, pickupDeadline: e.target.value })}
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
              value={batchForm.description}
              onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
              placeholder="Informações sobre as marmitas..."
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
