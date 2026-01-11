/**
 * Authentication Context for managing user state across the app.
 * Integrates with FastAPI backend JWT authentication.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// API base URL - defaults to localhost for development
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // In production, use relative path or configure in docusaurus.config.js
    return window.location.hostname === 'localhost'
      ? 'http://localhost:8000/api/v1'
      : '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE = getApiBase();

const AuthContext = createContext(null);

/**
 * Auth Provider component that wraps the application.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = useCallback(async (email, password, name, profile) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          profile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Sign in failed');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Signout error:', err);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (name, profile) => {
    setError(null);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Profile update failed');
      }

      setUser(data);
      return { success: true, user: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const getAuthToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
