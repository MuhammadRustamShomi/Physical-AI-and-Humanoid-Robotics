/**
 * Authentication Modal Component
 * Provides SignIn/SignUp dialogs with smooth transitions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleSuccess = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const switchMode = useCallback(() => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  }, [mode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${isVisible ? styles.visible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'signin'
              ? 'Sign in to access personalized content'
              : 'Join to personalize your learning experience'}
          </p>
        </div>

        <div className={styles.content}>
          {mode === 'signin' ? (
            <SignIn onSuccess={handleSuccess} onSwitchMode={switchMode} />
          ) : (
            <SignUp onSuccess={handleSuccess} onSwitchMode={switchMode} />
          )}
        </div>
      </div>
    </div>
  );
}
