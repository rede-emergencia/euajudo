import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react';

export default function Login() {
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Usuários pré-configurados
  const usuarios = [
    { email: 'f1@j.com', nome: 'F1 - Fornecedor', role: 'fornecedor', descricao: 'Restaurante no Centro' },
    { email: 'a1@j.com', nome: 'A1 - Abrigo', role: 'recebedor', descricao: 'Zona Norte de JF' },
    { email: 'a2@j.com', nome: 'A2 - Abrigo', role: 'recebedor', descricao: 'Zona Sul de JF' },
    { email: 'v1@j.com', nome: 'V1 - Voluntário', role: 'voluntario', descricao: 'Entregador/Comprador' },
    { email: 'v2@j.com', nome: 'V2 - Voluntário', role: 'voluntario', descricao: 'Entregador' },
    { email: 'adm@j.com', nome: 'ADM - Admin', role: 'admin', descricao: 'Administrador' }
  ];

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
      
      // Redirecionar baseado no perfil
      if (userData.roles.includes('admin')) {
        navigate('/dashboard/admin');
      } else if (userData.roles.includes('produtor')) {
        navigate('/dashboard/fornecedor');
      } else if (userData.roles.includes('voluntario')) {
        navigate('/dashboard/voluntario');
      } else if (userData.roles.includes('recebedor')) {
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
          <h1 className="text-3xl font-bold text-gray-900">JFood</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão de Marmitas</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Rápido</h2>
          <p className="text-sm text-gray-600 mb-6">Selecione um usuário para testar o sistema</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

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
