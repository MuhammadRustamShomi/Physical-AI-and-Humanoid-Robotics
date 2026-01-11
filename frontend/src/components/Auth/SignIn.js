/**
 * Sign In Component
 * Handles user authentication.
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthForms.module.css';

export default function SignIn({ onSuccess, onSwitchMode }) {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const result = await signIn(email, password);
    if (result.success) {
      onSuccess?.();
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {(localError || error) && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {localError || error}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="signin-email" className={styles.label}>
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="signin-password" className={styles.label}>
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading}
      >
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          'Sign In'
        )}
      </button>

      <div className={styles.switchMode}>
        <span>Don't have an account?</span>
        <button
          type="button"
          onClick={onSwitchMode}
          className={styles.switchButton}
        >
          Create one
        </button>
      </div>
    </form>
  );
}
