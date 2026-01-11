/**
 * Root wrapper component with AuthProvider and ChatBot.
 */
import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Lazy-loaded AuthProvider wrapper
 */
function AuthProviderWrapper({ children }) {
  const [AuthProvider, setAuthProvider] = useState(null);

  useEffect(() => {
    import('../../contexts/AuthContext').then((module) => {
      setAuthProvider(() => module.AuthProvider);
    });
  }, []);

  if (!AuthProvider) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Lazy-loaded ChatBot wrapper to avoid SSR issues
 */
function ChatBotWrapper() {
  const [ChatBot, setChatBot] = useState(null);

  useEffect(() => {
    import('../../components/ChatBot').then((module) => {
      setChatBot(() => module.default);
    });
  }, []);

  if (!ChatBot) return null;
  return <ChatBot />;
}

/**
 * Root wrapper component with all providers.
 */
function Root({ children }) {
  return (
    <>
      <BrowserOnly fallback={<>{children}</>}>
        {() => (
          <AuthProviderWrapper>
            {children}
          </AuthProviderWrapper>
        )}
      </BrowserOnly>
      <BrowserOnly fallback={null}>
        {() => <ChatBotWrapper />}
      </BrowserOnly>
    </>
  );
}

export default Root;
