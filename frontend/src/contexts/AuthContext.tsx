import { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { User } from '@/types';
import Cookies from 'js-cookie';


interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  setToken: (token: string) => void;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      Cookies.set('token', response.data.token, { 
        expires: 7,
        path: '/'
      });
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${response.data.token}` },
      });
      setUser(userResponse.data);
      return {success: true};
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errors || 'Login failed'
      };
    };
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/register', { username, email, password });
      Cookies.set('token', response.data.token, { 
        expires: 7,
        path: '/'
      });
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${response.data.token}` },
      });
      setUser(userResponse.data);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errors || 'Registration failed'
      };
    }
  };

  const setToken = (token: string) => {
    Cookies.set('token', token, {
        expires: 7,
        path: '/'
    });
    };

  const logout = () => {
    Cookies.remove('token', { path: '/' });
    api.delete('/api/auth/logout');
    setUser(null);
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response: any) => setUser(response.data))
      .catch(() => logout());
    }
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, login, register,  setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );

};