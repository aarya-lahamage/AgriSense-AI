import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('agrisense_token'));
  const [loading, setLoading] = useState(() => !!localStorage.getItem('agrisense_token'));

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setUser(data);
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('agrisense_token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('agrisense_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('agrisense_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}