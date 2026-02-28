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
import { Plus, Package, Clock, CheckCircle, X, AlertCircle, Home } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight } from '../styles/designSystem';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import Header from '../components/Header'; // Importar o Header do mapa

export default function ShelterDashboard() {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    quantity_meals: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [productTypes, setProductTypes] = useState([]);
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    loadRequests();
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

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await resourceRequests.list();
      const myRequests = response.data?.filter(r => r.shelter_id === user.id) || [];
      const active = myRequests.find(o => ['pending', 'partially_fulfilled'].includes(o.status));
      setActiveRequest(active || null);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!requestForm.quantity_meals || !requestForm.startTime || !requestForm.endTime) {
      showAlert('Campos Obrigatórios', 'Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    try {
      await resourceRequests.create({
        product_type: 'item', // Genérico em vez de 'meal'
        quantity: parseInt(requestForm.quantity_meals),
        start_time: requestForm.startTime,
        end_time: requestForm.endTime,
        description: requestForm.description,
      });

      showAlert('Sucesso', '✅ Solicitação de itens criada com sucesso!', 'success');
      setShowRequestForm(false);
      setRequestForm({ quantity_meals: '', startTime: '', endTime: '', description: '' });
      loadRequests();
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;

    try {
      await resourceRequests.cancel(requestId);
      showAlert('Sucesso', '✅ Solicitação cancelada com sucesso!', 'success');
      loadRequests();
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    }
  };

  const stats = [
    {
      label: 'Solicitação Ativa',
      value: activeRequest ? '1' : '0',
      icon: <Home size={24} />,
    },
    {
      label: 'Itens Solicitados',
      value: activeRequest?.quantity || '0',
      icon: <Package size={24} />,
    },
    {
      label: 'Status',
      value: activeRequest ? display('OrderStatus', activeRequest.status) : 'Nenhuma',
      icon: <Clock size={24} />,
    },
  ];

  return (
    <>
      <Header
        onOperationStatusChange={(hasOperation) => {
          // Disparar evento para atualizar cores da borda
          window.dispatchEvent(new CustomEvent('operationStatusChange', { 
            detail: { hasActiveOperation: hasOperation } 
          }));
        }}
      />
      
      <DashboardLayout
        title="Painel do Abrigo"
        stats={stats}
        actions={
          !activeRequest && (
            <Button
              variant="primary"
              onClick={() => setShowRequestForm(true)}
              icon={<Plus size={16} />}
            >
              Nova Solicitação
            </Button>
          )
        }
      >
        {loading ? (
          <LoadingState />
        ) : activeRequest ? (
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
                    Solicitação #{activeRequest.id}
                  </h3>
                  <Badge variant={colorClass('OrderStatus', activeRequest.status)}>
                    {display('OrderStatus', activeRequest.status)}
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
                    Quantidade de Itens
                  </div>
                  <div style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.text.primary,
                  }}>
                    {activeRequest.quantity} itens
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}>
                    Período de Recebimento
                  </div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.primary,
                  }}>
                    {new Date(activeRequest.start_time).toLocaleString()} - {new Date(activeRequest.end_time).toLocaleString()}
                  </div>
                </div>

                {activeRequest.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs,
                    }}>
                      Observações
                    </div>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.text.primary,
                    }}>
                      {activeRequest.description}
                    </div>
                  </div>
                )}

                {activeRequest.confirmation_code && (
                  <div>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs,
                    }}>
                      Código de Confirmação
                    </div>
                    <div style={{
                      fontSize: fontSize.lg,
                      fontWeight: fontWeight.bold,
                      color: colors.primary[600],
                    }}>
                      {activeRequest.confirmation_code}
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
                onClick={() => handleCancelRequest(activeRequest.id)}
                icon={<X size={16} />}
              >
                Cancelar Solicitação
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Home size={48} />}
            title="Nenhuma solicitação ativa"
            description="Crie uma nova solicitação para começar a receber itens de fornecedores."
            action={
              <Button
                onClick={() => setShowRequestForm(true)}
                icon={<Plus size={16} />}
              >
                Criar Solicitação
              </Button>
            }
          />
        )}
      </DashboardLayout>

      {/* Modal de Criar Solicitação */}
      <Modal
        show={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="Nova Solicitação de Itens"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowRequestForm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRequest}
            >
              Criar Solicitação
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            label="Quantidade de Itens"
            type="number"
            value={requestForm.quantity_meals}
            onChange={(e) => setRequestForm({ ...requestForm, quantity_meals: e.target.value })}
            placeholder="Ex: 50"
            required
            min="1"
          />

          <Input
            label="Início do Período de Recebimento"
            type="datetime-local"
            value={requestForm.startTime}
            onChange={(e) => setRequestForm({ ...requestForm, startTime: e.target.value })}
            required
          />

          <Input
            label="Fim do Período de Recebimento"
            type="datetime-local"
            value={requestForm.endTime}
            onChange={(e) => setRequestForm({ ...requestForm, endTime: e.target.value })}
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
              Observações (opcional)
            </label>
            <textarea
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              placeholder="Informações adicionais sobre a solicitação (ex: tipo de itens, necessidades específicas, etc)..."
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

          <div style={{
            background: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            borderRadius: '6px',
            padding: spacing.md,
          }}>
            <div style={{
              fontSize: fontSize.sm,
              color: colors.primary[700],
              marginBottom: spacing.xs,
              fontWeight: fontWeight.semibold,
            }}>
              💡 Como funciona:
            </div>
            <ul style={{
              fontSize: fontSize.sm,
              color: colors.primary[600],
              margin: 0,
              paddingLeft: spacing.lg,
            }}>
              <li>Após criar a solicitação, fornecedores poderão ver</li>
              <li>Eles farão doações de insumos para sua solicitação</li>
              <li>Voluntários pegarão os insumos e entregarão aqui</li>
              <li>Você receberá os itens conforme solicitado</li>
              <li>No futuro: poderão ser marmitas, roupas, produtos, etc</li>
            </ul>
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
