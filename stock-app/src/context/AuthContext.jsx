import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMe, refreshToken } from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then(res => {
          setUser(res.data);
          // Silently extend session — active users never get abruptly logged out
          return refreshToken()
            .then(r => localStorage.setItem('token', r.data.token))
            .catch(() => {}); // Non-critical — existing token keeps working
        })
        .catch(() => {
          // getMe() failed: 401 interceptor handles redirect; this cleans up on network errors
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tradingGoals');
    queryClient.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
