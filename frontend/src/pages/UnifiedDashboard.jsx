/**
 * Unified Dashboard Component
 * Generic dashboard that adapts to user role using widget configuration
 */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import Header from '../components/Header';
import WidgetContainer from '../components/widgets/WidgetContainer';
import ListWidget from '../components/widgets/ListWidget';
import RequestForm from '../components/RequestForm';
import BatchForm from '../components/BatchForm';

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const { config, loading, error, reload } = useDashboard();
  const [showForm, setShowForm] = useState(null);

  const handlePrimaryAction = (action) => {
    if (action.id === 'create_batch') {
      setShowForm('batch');
    } else if (action.id === 'create_request') {
      setShowForm('request');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(null);
    reload();
  };

  const handleFormCancel = () => {
    setShowForm(null);
  };

  const renderWidget = (widget) => {
    let content;

    switch (widget.type) {
      case 'list':
        content = (
          <ListWidget
            widget={widget}
            onActionComplete={reload}
          />
        );
        break;
      
      default:
        content = (
          <div className="text-gray-500 text-center py-4">
            Widget type "{widget.type}" not yet implemented
          </div>
        );
    }

    return (
      <WidgetContainer
        key={widget.id}
        widget={widget}
        onPrimaryAction={handlePrimaryAction}
        loading={false}
      >
        {content}
      </WidgetContainer>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dashboard...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">❌ Erro ao carregar dashboard</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={reload}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!config) {
    return (
      <>
        <Header />
        <div className="p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
          <div className="text-center py-20">
            <p className="text-gray-600">Dashboard não configurado para este usuário</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="p-6 max-w-7xl mx-auto" style={{ paddingTop: '100px' }}>
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{config.title}</h1>
          <p className="text-gray-600 mt-1">{config.description}</p>
          <p className="text-sm text-gray-500 mt-1">
            Olá, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {config.widgets.map(renderWidget)}
        </div>

        {/* Modals/Forms */}
        {showForm === 'request' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Novo Pedido</h2>
                <RequestForm
                  productType="MEAL"
                  userRole={config.role}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {showForm === 'batch' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Nova Oferta</h2>
                <BatchForm
                  productType="MEAL"
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
