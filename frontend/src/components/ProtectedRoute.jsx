import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();

  console.log('🔍 ProtectedRoute render:', { loading, user: !!user, requireRole });

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading auth...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    // Converter requireRole para string se for enum
    let requiredRoleStr;
    if (typeof requireRole === 'string') {
      requiredRoleStr = requireRole;
    } else {
      // Para enums UserRole, usar o valor diretamente
      requiredRoleStr = requireRole;
    }
    
    console.log('🔍 ProtectedRoute:', {
      requireRole,
      requiredRoleStr,
      userRoles: user.roles,
      hasRequiredRole: user.roles.includes(requiredRoleStr)
    });
    
    // Verificar se o usuário tem a role requerida
    if (!user.roles.includes(requiredRoleStr)) {
      console.log('❌ ProtectedRoute: Redirecting to / - missing role');
      return <Navigate to="/" replace />;
    }
  }

  if (!user.approved && !user.roles.includes('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Aguardando Aprovação</h2>
          <p className="text-gray-600">
            Seu cadastro está em análise. Você receberá acesso assim que for aprovado por um administrador.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
