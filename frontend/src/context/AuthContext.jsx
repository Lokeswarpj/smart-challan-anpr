import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(() => authService.getCurrentOfficer());
  const [token, setToken] = useState(() => localStorage.getItem('roadguard_token'));
  const [loading, setLoading] = useState(false);

  const login = async (badgeNumber, password) => {
    setLoading(true);
    try {
      const data = await authService.login(badgeNumber, password);
      setToken(data.access_token);
      setOfficer(data.officer);
      localStorage.setItem('roadguard_token', data.access_token);
      localStorage.setItem('roadguard_officer', JSON.stringify(data.officer));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setOfficer(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        officer,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: officer?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

