/**
 * Chapter Toolbar Component
 * Provides Personalize and Translate buttons for logged-in users.
 */
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../Auth';
import styles from './ChapterToolbar.module.css';

// API base URL - defaults to localhost for development
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:8000/api/v1'
      : '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE = getApiBase();

export default function ChapterToolbar({ chapterPath, chapterTitle }) {
  const { isAuthenticated, getAuthToken } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [contentMode, setContentMode] = useState('original'); // 'original' | 'personalized' | 'urdu'
  const [isLoading, setIsLoading] = useState(false);
  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [urduContent, setUrduContent] = useState(null);
  const [error, setError] = useState(null);

  // Get the original content from the page
  const getOriginalContent = useCallback(() => {
    const article = document.querySelector('article.markdown');
    if (article) {
      return article.innerHTML;
    }
    return null;
  }, []);

  // Apply content to the page
  const applyContent = useCallback((html) => {
    const article = document.querySelector('article.markdown');
    if (article && html) {
      article.innerHTML = html;
      // Re-apply syntax highlighting
      if (window.Prism) {
        window.Prism.highlightAll();
      }
    }
  }, []);

  // Handle personalization
  const handlePersonalize = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (contentMode === 'personalized' && personalizedContent) {
      // Toggle back to original
      const original = getOriginalContent();
      if (original) {
        setContentMode('original');
        // Content will be restored on next render cycle
        window.location.reload(); // Simple approach for now
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const originalContent = getOriginalContent();
      if (!originalContent) {
        throw new Error('Could not get chapter content');
      }

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/content/personalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_path: chapterPath,
          content: originalContent,
          title: chapterTitle,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Personalization failed');
      }

      const data = await response.json();
      setPersonalizedContent(data.personalized_content);
      setContentMode('personalized');
      applyContent(data.personalized_content);
    } catch (err) {
      setError(err.message);
      console.error('Personalization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, contentMode, personalizedContent, chapterPath, chapterTitle, getAuthToken, getOriginalContent, applyContent]);

  // Handle translation
  const handleTranslate = useCallback(async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (contentMode === 'urdu' && urduContent) {
      // Toggle back to original
      setContentMode('original');
      window.location.reload();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const originalContent = getOriginalContent();
      if (!originalContent) {
        throw new Error('Could not get chapter content');
      }

      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/content/translate/urdu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: originalContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Translation failed');
      }

      const data = await response.json();
      setUrduContent(data.translated_content);
      setContentMode('urdu');

      // Apply RTL direction for Urdu
      const article = document.querySelector('article.markdown');
      if (article) {
        article.dir = 'rtl';
        article.classList.add('urdu-content');
        article.innerHTML = data.translated_content;
      }
    } catch (err) {
      setError(err.message);
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, contentMode, urduContent, getAuthToken, getOriginalContent]);

  // Reset to original
  const handleReset = useCallback(() => {
    setContentMode('original');
    window.location.reload();
  }, []);

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          {/* Status indicator */}
          {contentMode !== 'original' && (
            <div className={styles.status}>
              <span className={styles.statusDot} />
              {contentMode === 'personalized' ? 'Personalized' : 'Urdu'}
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              className={`${styles.button} ${contentMode === 'personalized' ? styles.active : ''}`}
              onClick={handlePersonalize}
              disabled={isLoading}
              title={isAuthenticated ? 'Personalize this chapter based on your profile' : 'Sign in to personalize'}
            >
              {isLoading && contentMode !== 'urdu' ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              )}
              <span>{contentMode === 'personalized' ? 'Original' : 'Personalize'}</span>
            </button>

            <button
              className={`${styles.button} ${styles.urduButton} ${contentMode === 'urdu' ? styles.active : ''}`}
              onClick={handleTranslate}
              disabled={isLoading}
              title={isAuthenticated ? 'Translate to Urdu' : 'Sign in to translate'}
            >
              {isLoading && contentMode !== 'personalized' ? (
                <span className={styles.spinner} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 8 6 6" />
                  <path d="m4 14 6-6 2-3" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="m22 22-5-10-5 10" />
                  <path d="M14 18h6" />
                </svg>
              )}
              <span>{contentMode === 'urdu' ? 'English' : 'اردو'}</span>
            </button>

            {contentMode !== 'original' && (
              <button
                className={styles.resetButton}
                onClick={handleReset}
                title="Reset to original"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
            <button onClick={() => setError(null)} className={styles.errorClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Not authenticated hint */}
        {!isAuthenticated && (
          <div className={styles.hint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Sign in to personalize chapters or translate to Urdu
          </div>
        )}
      </div>

      {/* Auth modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
}
