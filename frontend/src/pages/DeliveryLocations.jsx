import { useEffect, useState } from 'react';
import { locaisEntrega } from '@/lib/api';
import { Plus, X, MapPin, Edit } from 'lucide-react';

export default function LocaisEntrega() {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    responsavel: '',
    telefone: '',
    capacidade: '',
    necessidade_diaria: '',
    horario_funcionamento: '',
  });

  useEffect(() => {
    loadLocais();
  }, []);

  const loadLocais = async () => {
    try {
      const response = await locaisEntrega.list(false);
      setLocais(response.data);
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        capacidade: formData.capacidade ? parseInt(formData.capacidade) : null,
        necessidade_diaria: formData.necessidade_diaria ? parseInt(formData.necessidade_diaria) : null,
      };
      await locaisEntrega.create(data);
      setShowModal(false);
      setFormData({
        nome: '',
        endereco: '',
        responsavel: '',
        telefone: '',
        capacidade: '',
        necessidade_diaria: '',
        horario_funcionamento: '',
      });
      loadLocais();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao criar local');
    }
  };

  const handleToggleAtivo = async (local) => {
    try {
      if (local.ativo) {
        await locaisEntrega.desativar(local.id);
      } else {
        await locaisEntrega.ativar(local.id);
      }
      loadLocais();
    } catch (error) {
      alert(error.response?.data?.detail || 'Erro ao atualizar local');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locais de Entrega</h1>
          <p className="text-gray-600 mt-2">Gerencie os locais de acolhimento</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Novo Local
        </button>
      </div>

      {locais.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum local cadastrado</h3>
          <p className="text-gray-600 mb-4">Cadastre o primeiro local de entrega</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Cadastrar Local
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {locais.map((local) => (
            <div key={local.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{local.nome}</h3>
                  <p className="text-sm text-gray-600 mt-1">{local.endereco}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {local.ativo ? (
                    <span className="badge badge-success">Ativo</span>
                  ) : (
                    <span className="badge badge-danger">Inativo</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {local.responsavel && (
                  <p className="text-gray-600">
                    <span className="font-medium">Responsável:</span> {local.responsavel}
                  </p>
                )}
                {local.telefone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Telefone:</span> {local.telefone}
                  </p>
                )}
                {local.capacidade && (
                  <p className="text-gray-600">
                    <span className="font-medium">Capacidade:</span> {local.capacidade} pessoas
                  </p>
                )}
                {local.necessidade_diaria && (
                  <p className="text-gray-600">
                    <span className="font-medium">Necessidade diária:</span> {local.necessidade_diaria} marmitas
                  </p>
                )}
                {local.horario_funcionamento && (
                  <p className="text-gray-600">
                    <span className="font-medium">Horário:</span> {local.horario_funcionamento}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => handleToggleAtivo(local)}
                  className={`btn w-full ${local.ativo ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {local.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Novo Local de Entrega</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Nome do Local</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Endereço Completo</label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Responsável</label>
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Telefone/WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Capacidade (pessoas)</label>
                    <input
                      type="number"
                      value={formData.capacidade}
                      onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                      className="input"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="label">Necessidade Diária (marmitas)</label>
                    <input
                      type="number"
                      value={formData.necessidade_diaria}
                      onChange={(e) => setFormData({ ...formData, necessidade_diaria: e.target.value })}
                      className="input"
                      min="1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="label">Horário de Funcionamento</label>
                    <input
                      type="text"
                      value={formData.horario_funcionamento}
                      onChange={(e) => setFormData({ ...formData, horario_funcionamento: e.target.value })}
                      className="input"
                      placeholder="Ex: 8h às 18h"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Cadastrar Local
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
