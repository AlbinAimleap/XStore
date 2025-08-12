import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { apiClient } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    encryptionKey: null,
    isLoading: true,
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      const newState = {
        user: response.user,
        token: response.token,
        encryptionKey: response.encryptionKey,
        isLoading: false,
      };
      
      setAuthState(newState);
      apiClient.setToken(response.token);
      localStorage.setItem('xstore_encryption_key', response.encryptionKey);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await apiClient.register(email, password);
      
      const newState = {
        user: response.user,
        token: response.token,
        encryptionKey: response.encryptionKey,
        isLoading: false,
      };
      
      setAuthState(newState);
      apiClient.setToken(response.token);
      localStorage.setItem('xstore_encryption_key', response.encryptionKey);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      encryptionKey: null,
      isLoading: false,
    });
    
    apiClient.setToken(null);
    localStorage.removeItem('xstore_encryption_key');
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('xstore_token');
      const encryptionKey = localStorage.getItem('xstore_encryption_key');
      
      if (token && encryptionKey) {
        try {
          const response = await apiClient.verifyToken(token);
          
          if (response.valid) {
            setAuthState({
              user: response.user,
              token,
              encryptionKey,
              isLoading: false,
            });
            apiClient.setToken(token);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};