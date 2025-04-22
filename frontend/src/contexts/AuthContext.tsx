import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../utils/api';
import { User } from '@/types';
import Cookies from 'js-cookie';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username must be at most 20 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  email: z.string()
    .email({ message: "Invalid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
      { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" })
});

const updateSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username must be at most 20 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  email: z.string()
    .email({ message: "Invalid email address" }),
})

const loginSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username must be at most 20 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
      { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" })
});


const resetPasswordSchema = z.object({
  password : z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 
      { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" }),
    })


type RegisterData = z.infer<typeof registerSchema>;
type UpdateData = z.infer<typeof updateSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  newEmail: string;
  newUsername: string;
  error: string | null;
  isAuthenticated: () => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (username: string, password: string) => Promise<any>;
  setToken: (token: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  getById: (id: number) => Promise<any>;
  update: (username: string, email: string, password: string, old_password: string, profilePicture: string) => Promise<any>;
  register: (username: string, email: string, first_name: string, last_name: string, password: string) => Promise<any>;
  handleResetPassword: (token: string, password: string, confirmPassword: string, email: string) => Promise<any>;
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
      const validationResult = loginSchema.safeParse({ username, password });
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        return { 
          success: false, 
          error: errors
        };
      }
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

  const handleResetPassword = async (token: string, password: string, confirmPassword: string, email: string) => {
    try {
      const validationResult = resetPasswordSchema.safeParse({ password });
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        return { 
          success: false, 
          error: errors
        };
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (!token) {
        throw new Error("Invalid or expired reset token")
      }
  
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, email}),
      })
  
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to reset password')
      }
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.errors || 'Reset password failed'
      };
    }
  }

  const register = async (username: string, email: string, first_name: string, last_name: string, password: string) => {
    try {
      const validationResult = registerSchema.safeParse({ username, email, password });
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        return { 
          success: false, 
          error: errors
        };
      }

      const response = await api.post('/api/auth/register', { username, email, first_name, last_name, password });
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

      const validationResult = updateSchema.safeParse({ username, email });
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        return { 
          success: false, 
          error: errors
        };
      }
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


  const isAuthenticated = async (): Promise<boolean> => {
    const token = Cookies.get('token');
    if (!token) return false;
    try {
      const response = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 200) {
        return true;
      }
      return false;
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

  const logout = async () => {
    const token = Cookies.get('token');
    try {
      //await api.delete('/api/auth/logout', { headers: { Authorization: `Bearer ${token}` } });
      Cookies.remove('token', { path: '/' });
      Cookies.remove('language', { path: '/' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response: any) => setUser(response.data))
      .catch(() => console.error('Failed to fetch user data'));
    }
  }, [])
  
  
  return (
    <AuthContext.Provider value={{ user, login, newEmail, error, isAuthenticated, getById, handleResetPassword, setError, setEmail, newUsername, setUsername, loading, setLoading, register,  setToken, update, logout, changeLanguage }}>
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
