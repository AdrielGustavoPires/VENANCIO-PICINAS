import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { syncWithServer, triggerServerSync } from '../database/storage';

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  company?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    company?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (name: string, email: string) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'venancio_piscinas_auth_user_v1';
const ACCOUNTS_STORAGE_KEY = 'venancio_piscinas_accounts_list_v1';
const REMEMBER_KEY = 'venancio_piscinas_remember_email_v1';

const getStoredAccounts = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy demo admin account so only real registered accounts exist
        const validAccounts = parsed.filter(
          (a: StoredAccount) =>
            a &&
            a.email &&
            !(a.id === 'user-venancio' && a.password === 'admin123')
        );
        if (validAccounts.length !== parsed.length) {
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(validAccounts));
        }
        return validAccounts;
      }
    }
  } catch (e) {
    console.error('Error reading accounts', e);
  }
  return [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await syncWithServer();
        const registeredAccounts = getStoredAccounts();

        // Check if the user previously logged in on this browser with a valid registered account
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const isRegistered =
              parsed &&
              parsed.id &&
              parsed.email &&
              parsed.id !== 'user-venancio' &&
              registeredAccounts.some(
                a => a.email.trim().toLowerCase() === String(parsed.email).trim().toLowerCase()
              );

            if (isRegistered) {
              setUser(parsed);
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error reading auth state', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    password: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await syncWithServer();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setIsLoading(false);
      return { success: false, error: 'Por favor, preencha o e-mail e a senha.' };
    }

    const accounts = getStoredAccounts();
    const found = accounts.find(a => a.email.trim().toLowerCase() === cleanEmail);

    if (!found) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Cadastro não encontrado. Somente cadastros efetuados podem acessar o sistema. Clique em "Criar Nova Conta".',
      };
    }

    if (!found.password || found.password !== password) {
      setIsLoading(false);
      return { success: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    const authenticatedUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      company: found.company,
      phone: found.phone,
      avatar_url:
        found.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(found.name)}&backgroundColor=0284c7`,
      created_at: found.created_at,
    };

    setUser(authenticatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));

    if (remember) {
      localStorage.setItem(REMEMBER_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    setIsLoading(false);
    return { success: true };
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    company?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await syncWithServer();

    const cleanEmail = data.email.trim().toLowerCase();

    if (!data.name.trim()) {
      setIsLoading(false);
      return { success: false, error: 'Informe o seu nome completo.' };
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Informe um endereço de e-mail válido.' };
    }

    if (!data.password || data.password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    const accounts = getStoredAccounts();
    const alreadyExists = accounts.some(a => a.email.trim().toLowerCase() === cleanEmail);

    if (alreadyExists) {
      setIsLoading(false);
      return { success: false, error: 'Este e-mail já está cadastrado. Faça login com sua senha.' };
    }

    const newAccount: StoredAccount = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      role: data.role || 'Administrador / Responsável Técnico',
      company: data.company?.trim() || 'Venâncio Piscinas - Limpeza e Manutenção',
      phone: data.phone?.trim(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=0284c7`,
      created_at: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newAccount];
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
    triggerServerSync();

    const newUser: User = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      company: newAccount.company,
      phone: newAccount.phone,
      avatar_url: newAccount.avatar_url,
      created_at: newAccount.created_at,
    };

    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(REMEMBER_KEY, newAccount.email);

    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateUserProfile = (name: string, email: string) => {
    if (!user) return;
    const updated = { ...user, name, email };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(r => setTimeout(r, 500));
    if (!email || !email.includes('@')) {
      return { success: false, message: 'E-mail inválido.' };
    }
    return {
      success: true,
      message: `Enviamos as instruções de recuperação de senha para ${email}. Verifique sua caixa de entrada.`,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
