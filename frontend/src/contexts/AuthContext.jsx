import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      authApi.getMe()
        .then(response => {
          // Converter roles de string para array se necessário
          const userData = {
            ...response.data,
            roles: typeof response.data.roles === 'string' 
              ? response.data.roles.split(',').map(r => r.trim())
              : response.data.roles
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login:', email);
      const response = await authApi.login(email, password);
      console.log('✅ Login response:', response);
      
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      const userResponse = await authApi.getMe();
      console.log('👤 User data:', userResponse.data);
      
      // Converter roles de string para array se necessário
      const userData = {
        ...userResponse.data,
        roles: typeof userResponse.data.roles === 'string' 
          ? userResponse.data.roles.split(',').map(r => r.trim())
          : userResponse.data.roles
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      // Limpar dados em caso de erro
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const register = async (data) => {
    const response = await authApi.register(data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async () => {
    try {
      const userResponse = await authApi.getMe();
      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    // roles agora é array, mas mantém compatibilidade com string
    if (Array.isArray(user.roles)) {
      return user.roles.includes(role);
    } else if (typeof user.roles === 'string') {
      return user.roles.split(',').map(r => r.trim()).includes(role);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
