import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext(null);

const STORAGE_KEY = 'physical-ai-chat-session';

export function ChatProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }
        if (data.chatHistory) {
          setChatHistory(data.chatHistory);
        }
      }
    } catch (e) {
      console.warn('Failed to load chat session:', e);
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (sessionId) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            sessionId,
            chatHistory: chatHistory.slice(-20), // Keep last 20 messages
          })
        );
      } catch (e) {
        console.warn('Failed to save chat session:', e);
      }
    }
  }, [sessionId, chatHistory]);

  const addMessage = (message) => {
    setChatHistory((prev) => [...prev, message]);
  };

  const clearChat = () => {
    setChatHistory([]);
    setSessionId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    sessionId,
    setSessionId,
    chatHistory,
    setChatHistory,
    currentChapter,
    setCurrentChapter,
    isOpen,
    setIsOpen,
    isLoading,
    setIsLoading,
    selectedText,
    setSelectedText,
    addMessage,
    clearChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
