import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import styles from './styles.module.css';

function SelectionHandler() {
  const { setSelectedText, setIsOpen } = useChat();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState('');

  const handleMouseUp = useCallback((e) => {
    // Ignore if clicking inside chat widget
    if (e.target.closest(`.${styles.chatPanel}`) || e.target.closest(`.${styles.toggleButton}`)) {
      return;
    }

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // Minimum 10 characters for selection
    if (text && text.length >= 10) {
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setCurrentSelection(text);
      setTooltip({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setTooltip({ visible: false, x: 0, y: 0 });
      setCurrentSelection('');
    }
  }, []);

  const handleClick = useCallback((e) => {
    // Hide tooltip if clicking elsewhere (not on the tooltip)
    if (!e.target.closest(`.${styles.selectionTooltip}`)) {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 10) {
        setTooltip({ visible: false, x: 0, y: 0 });
        setCurrentSelection('');
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    // Hide tooltip on scroll
    setTooltip({ visible: false, x: 0, y: 0 });
    setCurrentSelection('');
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [handleMouseUp, handleClick, handleScroll]);

  const handleAskAboutThis = () => {
    if (currentSelection) {
      // Truncate very long selections
      const text = currentSelection.length > 500
        ? currentSelection.substring(0, 500) + '...'
        : currentSelection;

      setSelectedText(text);
      setIsOpen(true);
      setTooltip({ visible: false, x: 0, y: 0 });
      setCurrentSelection('');

      // Clear the browser selection
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!tooltip.visible) {
    return null;
  }

  return (
    <div
      className={styles.selectionTooltip}
      style={{
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
      }}
    >
      <button
        className={styles.askButton}
        onClick={handleAskAboutThis}
        aria-label="Ask about selected text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Ask about this
      </button>
    </div>
  );
}

export default SelectionHandler;
