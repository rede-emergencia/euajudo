import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { users } from '@/lib/api';
import { Package, TestTube } from 'lucide-react';
import { UserRole } from '../shared/enums';

const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';

export default function Login() {
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Buscar usuários do banco de dados
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await users.getAll();
        const usuariosData = response.data
          .filter(user => user.roles.includes('admin'))
          .map(user => ({
            email: user.email,
            nome: user.name,
            role: getRoleDisplay(user.roles),
            descricao: getUserDescription(user),
            roles: user.roles
          }));
        setUsuarios(usuariosData);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        // Apenas admin como fallback
        setUsuarios([
          { email: 'admin@vouajudar.org', nome: 'Admin', role: 'admin', descricao: 'Administrador do Sistema' }
        ]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Helper functions
  const getRoleDisplay = (roles) => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('provider')) return 'fornecedor';
    if (roles.includes('volunteer')) return 'voluntario';
    return 'recebedor';
  };

  const getUserDescription = (user) => {
    if (user.address) {
      // Extrair apenas o nome da rua/bairro do endereço completo
      const addressParts = user.address.split(',');
      const streetPart = addressParts[0] || 'Local não informado';
      return streetPart.length > 30 ? streetPart.substring(0, 30) + '...' : streetPart;
    }
    if (user.roles.includes('admin')) return 'Administrador do Sistema';
    if (user.roles.includes('provider')) return 'Fornecedor de Produtos';
    if (user.roles.includes('volunteer')) return 'Voluntário Entregador';
    return 'Usuário do Sistema';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Por favor, selecione um usuário');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const userData = await login(selectedUser, '123');
      
      // Redirecionar baseado no perfil (usando roles do banco)
      if (userData.roles.includes('admin')) {
        navigate('/dashboard/admin');
      } else if (userData.roles.includes(UserRole.PROVIDER)) {
        navigate('/dashboard/fornecedor');
      } else if (userData.roles.includes(UserRole.VOLUNTEER)) {
        navigate('/dashboard/voluntario');
      } else if (userData.roles.includes(UserRole.SHELTER)) {
        navigate('/dashboard/abrigo');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-primary-600" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900">Vou Ajudar</h1>
            {isBetaMode && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                <TestTube className="h-4 w-4" />
                BETA
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-2">Sistema de Gestão de Marmitas</p>
          {isBetaMode && (
            <p className="text-xs text-orange-600 mt-1">Modo de testes com usuários pré-cadastrados</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Rápido</h2>
          <p className="text-sm text-gray-600 mb-6">Selecione um usuário para testar o sistema</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Carregando usuários...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Selecione o usuário:</label>
                
                {usuarios.map((usuario) => (
                  <label key={usuario.email} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="usuario"
                      value={usuario.email}
                      checked={selectedUser === usuario.email}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{usuario.nome}</div>
                      <div className="text-sm text-gray-500">{usuario.descricao}</div>
                      <div className="text-xs text-gray-400">{usuario.email}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {usuario.role}
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Senha: 123 (já preenchida)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedUser}
                className="btn btn-primary w-full"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
