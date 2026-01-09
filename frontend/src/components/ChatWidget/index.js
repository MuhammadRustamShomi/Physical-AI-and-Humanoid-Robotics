import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useChatApi } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import SelectionHandler from './SelectionHandler';
import styles from './styles.module.css';

function ChatWidget() {
  const { isOpen, setIsOpen, chatHistory, isLoading, selectedText, setSelectedText } = useChat();
  const { sendMessage } = useChatApi();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Pre-fill input if there's selected text
  useEffect(() => {
    if (selectedText && isOpen) {
      setInput(`Explain this: "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`);
    }
  }, [selectedText, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (selectedText && !isOpen) {
      // Opening with selected text
    } else if (!isOpen) {
      setSelectedText(null);
    }
  };

  return (
    <>
      <SelectionHandler />

      {/* Chat toggle button */}
      <button
        className={styles.toggleButton}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        title={isOpen ? 'Close chat' : 'Ask a question about the textbook'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className={styles.chatPanel} role="dialog" aria-label="Chat assistant">
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.headerTitle}>Textbook Assistant</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {chatHistory.length === 0 ? (
              <div className={styles.welcome}>
                <p>Hello! I can answer questions about the Physical AI textbook.</p>
                <p>Try highlighting text on the page and clicking "Ask about this", or just type your question below.</p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <ChatMessage key={message.id || index} message={message} />
              ))
            )}
            {isLoading && (
              <div className={styles.loading}>
                <span className={styles.loadingDot}></span>
                <span className={styles.loadingDot}></span>
                <span className={styles.loadingDot}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected text indicator */}
          {selectedText && (
            <div className={styles.selectedTextIndicator}>
              <span>Asking about: "{selectedText.substring(0, 50)}..."</span>
              <button onClick={() => setSelectedText(null)} aria-label="Clear selection">
                ×
              </button>
            </div>
          )}

          {/* Input form */}
          <form className={styles.inputForm} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isLoading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
