import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = {
  username: 'admin@etcfoodbox.co',
  passwordHash: '7d07f69481eb0bd26102dd462c68e805d6f59abe1a02337fd8b81e5d6a7afd51', // SHA-256 of Etc#1234
};

const STORAGE_KEY = 'etc-hr-admin-token';

async function hashText(input: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token === ADMIN_CREDENTIALS.passwordHash) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const userMatch = username.trim().toLowerCase() === ADMIN_CREDENTIALS.username;
    if (!userMatch) return false;

    const passwordHash = await hashText(password);
    if (passwordHash !== ADMIN_CREDENTIALS.passwordHash) {
      return false;
    }

    localStorage.setItem(STORAGE_KEY, ADMIN_CREDENTIALS.passwordHash);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
