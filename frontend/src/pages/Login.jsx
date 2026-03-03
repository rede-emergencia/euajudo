import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package, TestTube } from 'lucide-react';
import { UserRole } from '../shared/enums';

const isBetaMode = import.meta.env.VITE_BETA_MODE === 'true';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha email e senha');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      
      // Aguardar um pouco para garantir que o estado seja atualizado em todos os componentes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirecionar baseado no perfil (usando roles do banco)
      if (userData.roles.includes(UserRole.ADMIN)) {
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
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
          <p className="text-sm text-gray-600 mb-6">Entre com suas credenciais</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
