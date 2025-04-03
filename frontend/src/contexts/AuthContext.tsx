import { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { User } from '@/types';
import Cookies from 'js-cookie';


interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  setToken: (token: string) => void;
  update: (username: string, email: string, password: string, old_password: string, profilePicture: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.status !== 200) {
        return { 
          success: false, 
          error: response.data?.errors || 'Login failed'
        };
      }
      Cookies.set('token', response.data.token, { 
        expires: 7,
        path: '/'
      });
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${response.data.token}` },
      });
      if (userResponse.status !== 200) {
        return { 
          success: false, 
          error: userResponse.data?.errors || 'Login failed'
        };
      }
      setUser(userResponse.data.user);
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
      setUser(userResponse.data.user);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errors || 'Registration failed'
      };
    }
  };


  const update = async (username: string, email: string, password: string, old_password: string, profilePicture: string) => {
    try {
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });
      if (!username) username = userResponse.data.user.username;
      if (!email) email = userResponse.data.user.email;
      if (!password) password = userResponse.data.user.password;
      const response = await api.patch(`/api/users/${userResponse.data.user.id}`, { username, email, password, old_password, profilePicture }, { headers: { Authorization: `Bearer ${Cookies.get('token')}` } });
      const updateResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });
      setUser(updateResponse.data.user);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.messages?.[0]?.message || 
          error.response?.data?.errors || 
          error.response?.data?.name ||  
          error.response?.data?.messages || 
          'Update failed'
      };
    }
  }

  const setToken = (token: string) => {
    Cookies.set('token', token, {
        expires: 7,
        path: '/'
    });
    };

  const logout = () => {
    //const token = Cookies.get('token');
    //api.delete('/api/auth/logout', { headers: { Authorization: `Bearer ${token}` } });
    Cookies.remove('token', { path: '/' });
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
    <AuthContext.Provider value={{ user, login, register,  setToken, update, logout }}>
      {children}
    </AuthContext.Provider>
  );

};