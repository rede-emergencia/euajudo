import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    telefone: '',
    roles: [],
    endereco: '',
    tipo_estabelecimento: '',
    capacidade_producao: '',
    capacidade_entrega: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.roles.length === 0) {
      setError('Selecione pelo menos um perfil');
      setLoading(false);
      return;
    }

    try {
      const data = {
        ...formData,
        roles: formData.roles.join(','),
        capacidade_producao: formData.capacidade_producao ? parseInt(formData.capacidade_producao) : null,
        capacidade_entrega: formData.capacidade_entrega ? parseInt(formData.capacidade_entrega) : null,
      };

      await register(data);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const isProvider = formData.roles.includes('provider');
  const isVolunteer = formData.roles.includes('volunteer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">JFood</h1>
          <p className="text-gray-600 mt-2">Cadastre-se para ajudar</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Conta</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              Conta criada com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome Completo</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input"
                  required
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
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value.slice(0, 72) })}
                  className="input"
                  required
                  minLength={6}
                  maxLength={72}
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres, máximo 72 caracteres</p>
              </div>
            </div>

            <div>
              <label className="label">Como você quer ajudar?</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('provider')}
                    onChange={() => handleRoleChange('provider')}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Provider (produzo marmitas)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('volunteer')}
                    onChange={() => handleRoleChange('volunteer')}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Voluntário (ajudo com insumos e entregas)</span>
                </label>
              </div>
            </div>

            {isProvider && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="md:col-span-2">
                  <label className="label">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tipo de Estabelecimento</label>
                  <input
                    type="text"
                    value={formData.tipo_estabelecimento}
                    onChange={(e) => setFormData({ ...formData, tipo_estabelecimento: e.target.value })}
                    className="input"
                    placeholder="Ex: Restaurante, Cozinha comunitária"
                  />
                </div>
                <div>
                  <label className="label">Capacidade de Produção (marmitas/dia)</label>
                  <input
                    type="number"
                    value={formData.capacidade_producao}
                    onChange={(e) => setFormData({ ...formData, capacidade_producao: e.target.value })}
                    className="input"
                    min="1"
                  />
                </div>
              </div>
            )}

            {isEntregador && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="label">Capacidade de Entrega (marmitas por viagem)</label>
                <input
                  type="number"
                  value={formData.capacidade_entrega}
                  onChange={(e) => setFormData({ ...formData, capacidade_entrega: e.target.value })}
                  className="input"
                  min="1"
                  placeholder="Ex: 5 para moto, 50 para carro"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
