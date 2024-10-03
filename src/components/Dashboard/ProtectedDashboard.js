"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sid, setSid] = useState(null);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sid');
    setIsAuthenticated(false);
    setSid(null);
    router.push('/login');
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('/api/auth/token/refresh/', {
        refresh: refreshToken,
      });
      localStorage.setItem('accessToken', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  const authAxios = axios.create();

  authAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshToken();
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return authAxios(originalRequest);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const verifyAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedSid = localStorage.getItem('sid');
      if (!accessToken || !storedSid) {
        setIsAuthenticated(false);
        setSid(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAxios.get('/api/user/dashboard/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setIsAuthenticated(true);
        setSid(storedSid);
      } catch (error) {
        console.error('Error verifying authentication:', error);
        setIsAuthenticated(false);
        setSid(null);
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login/', { email, password });
      const { access, refresh, sid } = response.data.token;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('sid', sid);
      setIsAuthenticated(true);
      setSid(sid);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, logout, login, sid }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
};

const ProtectedDashboard = ({ children }) => {
  return (
    <AuthProvider>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthProvider>
  );
};

export default ProtectedDashboard;