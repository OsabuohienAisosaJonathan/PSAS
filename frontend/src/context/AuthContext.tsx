import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, setAuthToken, apiFetchWithAuth } from '../services/api.js';

interface AdminUser {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  loginSuccess: (token: string, user: AdminUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  loginSuccess: () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const data = await apiFetchWithAuth('/auth/me');
          setUser(data.user);
        } catch {
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('psas-auth-logout', handleLogout);
    return () => window.removeEventListener('psas-auth-logout', handleLogout);
  }, []);

  const loginSuccess = (newToken: string, newUser: AdminUser) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        loginSuccess,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
