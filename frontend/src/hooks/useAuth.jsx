import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('ieee_token'));
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('ieee_admin') || 'null'));

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('ieee_token', res.data.token);
    localStorage.setItem('ieee_admin', JSON.stringify({ username: res.data.username }));
    setToken(res.data.token);
    setAdmin({ username: res.data.username });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('ieee_token');
    localStorage.removeItem('ieee_admin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
