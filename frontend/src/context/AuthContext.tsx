import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('esg_access_token');
    const savedUser = localStorage.getItem('esg_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('esg_access_token');
        localStorage.removeItem('esg_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (accessToken: string, loggedUser: User) => {
    localStorage.setItem('esg_access_token', accessToken);
    localStorage.setItem('esg_user', JSON.stringify(loggedUser));
    setToken(accessToken);
    setUser(loggedUser);
  };

  const logout = () => {
    localStorage.removeItem('esg_access_token');
    localStorage.removeItem('esg_user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
