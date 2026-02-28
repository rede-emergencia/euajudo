import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pedidosInsumo, batches } from '../lib/api';
import { BatchStatus, OrderStatus, display, colorClass } from '../shared/enums';
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
import { Plus, Package, Clock, CheckCircle, X, AlertCircle, Users } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('publicacoes');
  const [myPublications, setMyPublications] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPublicationForm, setShowPublicationForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [publicationForm, setPublicationForm] = useState({
    quantity: '',
    description: '',
    pickupDeadline: ''
  });
  const [requestForm, setRequestForm] = useState({
    quantity_meals: '',
    items: [{ name: '', quantity: '', unit: 'kg' }]
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
      if (activeTab === 'publicacoes') {
        // Carregar publicações/doações que o fornecedor criou
        const response = await batches.list();
        const myBatches = response.data?.filter(b => b.provider_id === user.id) || [];
        setMyPublications(myBatches);
      } else if (activeTab === 'solicitacoes') {
        // Carregar solicitações de insumos que o fornecedor criou
        const response = await pedidosInsumo.list();
        const myInsumos = response.data?.filter(r => r.provider_id === user.id) || [];
        setMyRequests(myInsumos);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setRequestForm({ 
      ...requestForm, 
      items: [...requestForm.items, { name: '', quantity: '', unit: 'kg' }] 
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = requestForm.items.filter((_, i) => i !== index);
    setRequestForm({ ...requestForm, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...requestForm.items];
    newItems[index][field] = value;
    setRequestForm({ ...requestForm, items: newItems });
  };

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    
    if (!publicationForm.quantity || !publicationForm.pickupDeadline) {
      showAlert('Campos Obrigatórios', 'Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    try {
      const payload = {
        product_type: "meal",
        quantity: parseInt(publicationForm.quantity),
        description: publicationForm.description,
        donated_ingredients: true,
        pickup_deadline: publicationForm.pickupDeadline
      };
      
      await batches.create(payload);
      showAlert('Sucesso', '✅ Publicação criada com sucesso! Disponível para retirada por 4 horas.', 'success');
      setShowPublicationForm(false);
      setPublicationForm({ quantity: '', description: '', pickupDeadline: '' });
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao criar publicação:', error);
      showAlert('Erro', '❌ Erro ao criar publicação: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!requestForm.quantity_meals || !requestForm.items.some(item => item.name && item.quantity)) {
      showAlert('Campos Obrigatórios', 'Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    try {
      const payload = {
        quantity_meals: parseInt(requestForm.quantity_meals),
        items: requestForm.items.map(item => ({
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: item.unit
        }))
      };
      
      await pedidosInsumo.create(payload);
      showAlert('Sucesso', '✅ Solicitação de insumos criada com sucesso!', 'success');
      setShowRequestForm(false);
      setRequestForm({ quantity_meals: '', items: [{ name: '', quantity: '', unit: 'kg' }] });
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      showAlert('Erro', '❌ Erro ao criar solicitação: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleCancelPublication = async (publicationId) => {
    if (!confirm('Tem certeza que deseja cancelar esta publicação?')) return;
    
    try {
      await batches.cancel(publicationId);
      showAlert('Sucesso', '✅ Publicação cancelada com sucesso!', 'success');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      showAlert('Erro', '❌ Erro ao cancelar publicação: ' + (error.message), 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;
    
    try {
      await pedidosInsumo.cancel(requestId);
      showAlert('Sucesso', '✅ Solicitação cancelada com sucesso!', 'success');
      loadData();
      triggerUserStateUpdate();
    } catch (error) {
      showAlert('Erro', '❌ Erro ao cancelar solicitação: ' + (error.message), 'error');
    }
  };

  const tabs = [
    { 
      id: 'publicacoes', 
      label: 'Minhas Publicações', 
      icon: <Package size={16} />, 
      badge: myPublications.filter(p => p.status === 'available').length 
    },
    { 
      id: 'solicitacoes', 
      label: 'Minhas Solicitações', 
      icon: <Users size={16} />, 
      badge: myRequests.filter(r => r.status === 'pending').length 
    },
  ];

  const stats = [
    {
      label: 'Publicações Ativas',
      value: myPublications.filter(p => p.status === 'available').length,
      icon: <Package size={24} />,
    },
    {
      label: 'Solicitações Ativas',
      value: myRequests.filter(r => r.status === 'pending').length,
      icon: <Users size={24} />,
    },
    {
      label: 'Total Disponível',
      value: myPublications.reduce((sum, p) => sum + (p.available_quantity || 0), 0),
      icon: <Package size={24} />,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (activeTab === 'publicacoes') {
      if (myPublications.length === 0) {
        return (
          <EmptyState
            icon={<Package size={48} />}
            title="Nenhuma publicação ativa"
            description="Crie uma publicação para disponibilizar marmitas para doação."
            action={
              <Button onClick={() => setShowPublicationForm(true)} icon={<Plus size={16} />}>
                Nova Publicação
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
          {myPublications.map(publication => (
            <Card key={publication.id} hoverable>
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
                    Publicação #{publication.id}
                  </h3>
                  <Badge variant={colorClass('BatchStatus', publication.status)}>
                    {display('BatchStatus', publication.status)}
                  </Badge>
                </div>
                
                <div style={{
                  fontSize: fontSize.sm,
                  color: colors.text.secondary,
                  lineHeight: 1.5,
                }}>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Quantidade:</strong> {publication.quantity} marmitas
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Disponível:</strong> {publication.available_quantity || 0}
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Reservado:</strong> {publication.reserved_quantity || 0}
                  </div>
                  {publication.pickup_deadline && (
                    <div style={{ marginBottom: spacing.xs }}>
                      <strong>Prazo:</strong> {new Date(publication.pickup_deadline).toLocaleString()}
                    </div>
                  )}
                  {publication.description && (
                    <div>
                      <strong>Descrição:</strong> {publication.description}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {publication.status === 'available' && (
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleCancelPublication(publication.id)}
                    icon={<X size={16} />}
                  >
                    Cancelar Publicação
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Tab de Solicitações (pedidos de insumos)
    if (activeTab === 'solicitacoes') {
      if (myRequests.length === 0) {
        return (
          <EmptyState
            icon={<Users size={48} />}
            title="Nenhuma solicitação ativa"
            description="Crie uma solicitação para pedir insumos de outros fornecedores."
            action={
              <Button onClick={() => setShowRequestForm(true)} icon={<Plus size={16} />}>
                Nova Solicitação
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
                    Solicitação #{request.id}
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
                    <strong>Para:</strong> {request.quantity_meals} marmitas
                  </div>
                  <div style={{ marginBottom: spacing.xs }}>
                    <strong>Itens:</strong> {request.items?.length || 0} tipos
                  </div>
                  {request.created_at && (
                    <div>
                      <strong>Criada:</strong> {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexDirection: 'column',
              }}>
                {request.status === 'pending' && (
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleCancelRequest(request.id)}
                    icon={<X size={16} />}
                  >
                    Cancelar Solicitação
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
        title="Painel do Fornecedor"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        actions={
          activeTab === 'publicacoes' ? (
            <Button onClick={() => setShowPublicationForm(true)} icon={<Plus size={16} />}>
              Nova Publicação
            </Button>
          ) : (
            <Button onClick={() => setShowRequestForm(true)} icon={<Plus size={16} />}>
              Nova Solicitação
            </Button>
          )
        }
      >
        {renderContent()}
      </DashboardLayout>

      {/* Modal de Criar Publicação */}
      <Modal
        show={showPublicationForm}
        onClose={() => setShowPublicationForm(false)}
        title="Nova Publicação de Marmitas"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPublicationForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreatePublication}>
              Publicar
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreatePublication} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Marmitas"
            type="number"
            value={publicationForm.quantity}
            onChange={(e) => setPublicationForm({ ...publicationForm, quantity: e.target.value })}
            placeholder="Ex: 50"
            required
            min="1"
          />

          <Input
            label="Prazo para Retirada"
            type="datetime-local"
            value={publicationForm.pickupDeadline}
            onChange={(e) => setPublicationForm({ ...publicationForm, pickupDeadline: e.target.value })}
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
              value={publicationForm.description}
              onChange={(e) => setPublicationForm({ ...publicationForm, description: e.target.value })}
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

      {/* Modal de Criar Solicitação */}
      <Modal
        show={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="Nova Solicitação de Insumos"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRequestForm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateRequest}>
              Criar Solicitação
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Marmitas (que deseja produzir)"
            type="number"
            value={requestForm.quantity_meals}
            onChange={(e) => setRequestForm({ ...requestForm, quantity_meals: e.target.value })}
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

            {requestForm.items.map((item, index) => (
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
                {requestForm.items.length > 1 && (
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
