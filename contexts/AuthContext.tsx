import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, studioName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('inkflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser: User = {
      id: '1',
      email,
      name: email === 'demo@inkflow.com' ? 'Demo Artist' : 'Alexandre Martin',
      studioName: email === 'demo@inkflow.com' ? 'Studio Demo' : 'Ink & Art Studio',
      role: 'studio_owner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    };

    setUser(mockUser);
    localStorage.setItem('inkflow_user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, name: string, studioName: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      studioName,
      role: 'studio_owner'
    };

    setUser(newUser);
    localStorage.setItem('inkflow_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('inkflow_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
