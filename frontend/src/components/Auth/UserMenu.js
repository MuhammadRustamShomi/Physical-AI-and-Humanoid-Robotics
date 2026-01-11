/**
 * User Menu Component
 * Displays user info and dropdown menu in navbar.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './UserMenu.module.css';

export default function UserMenu({ onSignInClick }) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button className={styles.signInButton} onClick={onSignInClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span>Sign In</span>
      </button>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSkillBadge = () => {
    const level = user?.profile?.software_background || 'beginner';
    const badges = {
      beginner: { label: 'Beginner', color: '#10b981' },
      intermediate: { label: 'Intermediate', color: '#3b82f6' },
      advanced: { label: 'Advanced', color: '#8b5cf6' },
    };
    return badges[level] || badges.beginner;
  };

  const badge = getSkillBadge();

  return (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.avatar}>
          {getInitials(user.name)}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.avatarLarge}>
              {getInitials(user.name)}
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
              <span
                className={styles.badge}
                style={{ '--badge-color': badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.section}>
            <span className={styles.sectionTitle}>Your Profile</span>
            <div className={styles.profileInfo}>
              {user.profile?.programming_languages?.length > 0 && (
                <div className={styles.profileRow}>
                  <span className={styles.profileLabel}>Languages:</span>
                  <span className={styles.profileValue}>
                    {user.profile.programming_languages.slice(0, 3).join(', ')}
                    {user.profile.programming_languages.length > 3 && '...'}
                  </span>
                </div>
              )}
              {user.profile?.hardware_gpu && (
                <div className={styles.profileRow}>
                  <span className={styles.profileLabel}>GPU:</span>
                  <span className={styles.profileValue}>{user.profile.hardware_gpu}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <button className={styles.menuItem} onClick={handleSignOut}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
