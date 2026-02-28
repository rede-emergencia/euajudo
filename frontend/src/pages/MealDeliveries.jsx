import { useEffect, useState } from 'react';
import { entregasMarmita } from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import { Truck, Check } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

export default function EntregasMarmita() {
  const [entregasDisponiveis, setEntregasDisponiveis] = useState([]);
  const [minhasEntregas, setMinhasEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { alert, showAlert, closeAlert } = useAlert();

  // Função para disparar atualização do estado do usuário
  const triggerUserStateUpdate = () => {
    window.dispatchEvent(new CustomEvent('userOperationUpdate', {
      detail: { forceUpdate: true }
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [disponiveisResp, minhasResp] = await Promise.all([
        entregasMarmita.getDisponiveis(),
        entregasMarmita.getMinhas(),
      ]);
      setEntregasDisponiveis(disponiveisResp.data);
      setMinhasEntregas(minhasResp.data);
    } catch (error) {
      console.error('Erro ao carregar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAceitar = async (id) => {
    const horario = prompt('Digite a data/hora estimada de entrega (formato: YYYY-MM-DDTHH:MM):');
    if (!horario) return;

    try {
      await entregasMarmita.aceitar(id, horario);
      loadData();
      triggerUserStateUpdate(); // Atualizar cores imediatamente
    } catch (error) {
      showAlert('Erro ao Aceitar Entrega', error.response?.data?.detail || 'Erro ao aceitar entrega', 'error');
    }
  };

  const handleIniciarRota = async (id) => {
    if (!confirm('Iniciar rota para esta entrega?')) return;
    try {
      await entregasMarmita.iniciarRota(id);
      loadData();
      triggerUserStateUpdate(); // Atualizar cores imediatamente
    } catch (error) {
      showAlert('Erro ao Iniciar Rota', error.response?.data?.detail || 'Erro ao iniciar rota', 'error');
    }
  };

  const handleConfirmar = async (id) => {
    if (!confirm('Confirmar que a entrega foi realizada?')) return;
    try {
      await entregasMarmita.confirmar(id);
      loadData();
      triggerUserStateUpdate(); // Atualizar cores imediatamente
    } catch (error) {
      showAlert('Erro ao Confirmar Entrega', error.response?.data?.detail || 'Erro ao confirmar entrega', 'error');
    }
  };

  const handleCancelar = async (id) => {
    if (!confirm('Tem certeza que deseja cancelar esta entrega?')) return;
    try {
      await entregasMarmita.cancel(id);
      loadData();
      triggerUserStateUpdate(); // Atualizar cores imediatamente
    } catch (error) {
      showAlert('Erro ao Cancelar Entrega', error.response?.data?.detail || 'Erro ao cancelar entrega', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Entregas de Marmitas</h1>
        <p className="text-gray-600 mt-2">Ajude entregando marmitas para locais de acolhimento</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Entregas Disponíveis</h2>
          {entregasDisponiveis.length === 0 ? (
            <div className="card text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma entrega disponível no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entregasDisponiveis.map((entrega) => (
                <div key={entrega.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Entrega #{entrega.id}</h3>
                      <p className="text-sm text-gray-600">
                        Quantidade: {entrega.quantidade} marmitas
                      </p>
                      <p className="text-sm text-gray-600">
                        Lote: #{entrega.lote_id}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(entrega.status)}`}>
                      {getStatusLabel(entrega.status)}
                    </span>
                  </div>

                  {entrega.local && (
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="font-medium text-gray-900">{entrega.local.nome}</p>
                      <p className="text-sm text-gray-600">{entrega.local.endereco}</p>
                      {entrega.local.telefone && (
                        <p className="text-sm text-gray-600">Tel: {entrega.local.telefone}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => handleAceitar(entrega.id)}
                    className="btn btn-primary w-full"
                  >
                    Aceitar Entrega
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Minhas Entregas</h2>
          {minhasEntregas.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">Você ainda não tem entregas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {minhasEntregas.map((entrega) => (
                <div key={entrega.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">Entrega #{entrega.id}</h3>
                      <p className="text-sm text-gray-600">
                        Quantidade: {entrega.quantidade} marmitas
                      </p>
                      {entrega.horario_estimado && (
                        <p className="text-sm text-gray-600">
                          Estimada: {formatDate(entrega.horario_estimado)}
                        </p>
                      )}
                      {entrega.aceita_at && (
                        <p className="text-sm text-gray-600">
                          Aceita em: {formatDate(entrega.aceita_at)}
                        </p>
                      )}
                    </div>
                    <span className={`badge ${getStatusBadgeClass(entrega.status)}`}>
                      {getStatusLabel(entrega.status)}
                    </span>
                  </div>

                  {entrega.local && (
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="font-medium text-gray-900">{entrega.local.nome}</p>
                      <p className="text-sm text-gray-600">{entrega.local.endereco}</p>
                      {entrega.local.responsavel && (
                        <p className="text-sm text-gray-600">
                          Responsável: {entrega.local.responsavel}
                        </p>
                      )}
                      {entrega.local.telefone && (
                        <p className="text-sm text-gray-600">Tel: {entrega.local.telefone}</p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {entrega.status === 'aceita' && (
                      <>
                        <button
                          onClick={() => handleIniciarRota(entrega.id)}
                          className="btn btn-primary flex-1"
                        >
                          Iniciar Rota
                        </button>
                        <button
                          onClick={() => handleCancelar(entrega.id)}
                          className="btn btn-secondary"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {entrega.status === 'em_rota' && (
                      <button
                        onClick={() => handleConfirmar(entrega.id)}
                        className="btn btn-primary w-full"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    {/* Alert Modal */}
    <AlertModal
      show={alert.show}
      onClose={closeAlert}
      title={alert.title}
      message={alert.message}
      type={alert.type}
    />
  </div>
);
}
