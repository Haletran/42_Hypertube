import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../utils/api';
import { User } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  newEmail: string;
  newUsername: string;
  error: string;
  isAuthenticated: () => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (username: string, password: string) => Promise<any>;
  setToken: (token: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  getById: (id: number) => Promise<any>;
  update: (username: string, email: string, password: string, old_password: string, profilePicture: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  changeLanguage: (language: string) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [newEmail, setEmail] = useState('');
  const [newUsername, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
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
      Cookies.set('language', userResponse.data.user.language, {
        expires: 7,
        path: '/'
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

  const changeLanguage = async (language: string) => {
    try {
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });
      const response = await api.patch(`/api/users/${userResponse.data.user.id}/language`, { language }, { headers: { Authorization: `Bearer ${Cookies.get('token')}` } });
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


  const isAuthenticated = async () => {
    const token = Cookies.get('token');
    if (!token) return false;
    try {
      const response = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  const getById = async (id: number) => {
    try {
      const response = await api.get(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });
      if (response.status !== 200) {
        return { 
          success: false, 
          error: response.data?.errors || 'User not found'
        };
      }
      return response.data;
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errors || 'User not found'
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
    Cookies.remove('language', { path: '/' });
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
    <AuthContext.Provider value={{ user, login, newEmail, error, isAuthenticated, getById, setError, setEmail, newUsername, setUsername, loading, setLoading, register,  setToken, update, logout, changeLanguage }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
