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

/**
 * Safely parse JSON from a response.
 * Handles empty responses and invalid JSON gracefully.
 */
const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text || text.trim() === '') {
    // Empty response - return a structured error
    return {
      detail: response.ok
        ? 'Empty response from server'
        : `Server error: ${response.status} ${response.statusText}`
    };
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    // Invalid JSON - return the text as error detail
    return { detail: text || `Server error: ${response.status}` };
  }
};

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
        const userData = await safeJsonParse(response);
        if (userData && userData.id) {
          setUser(userData);
        } else {
          // Invalid user data
          localStorage.removeItem('auth_token');
          setUser(null);
        }
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

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      if (!data.access_token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // Provide more helpful error messages for common issues
      let errorMessage = err.message;
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please ensure the backend is running.';
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
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

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.detail || 'Sign in failed');
      }

      if (!data.access_token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user
      localStorage.setItem('auth_token', data.access_token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // Provide more helpful error messages for common issues
      let errorMessage = err.message;
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please ensure the backend is running.';
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
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

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.detail || 'Profile update failed');
      }

      if (!data.id) {
        throw new Error('Invalid response from server');
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
