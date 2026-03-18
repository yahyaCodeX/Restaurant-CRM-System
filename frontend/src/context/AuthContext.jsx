import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then(({ data }) => setUser(data.data.user))
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
    return user;
  };

  const signup = async (formData) => {
    const { data } = await authApi.signup(formData);
    return data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.clear();
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
