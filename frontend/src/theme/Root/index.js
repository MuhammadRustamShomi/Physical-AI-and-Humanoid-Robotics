import React, { useState, useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Lazy-loaded ChatBot wrapper to avoid SSR issues
 */
function ChatBotWrapper() {
  const [ChatBot, setChatBot] = useState(null);

  useEffect(() => {
    // Dynamic import on client side only
    import('../../components/ChatBot').then((module) => {
      setChatBot(() => module.default);
    });
  }, []);

  if (!ChatBot) return null;
  return <ChatBot />;
}

/**
 * Root wrapper component with ChatKit-based AI chatbot.
 */
function Root({ children }) {
  return (
    <>
      {children}
      <BrowserOnly fallback={null}>
        {() => <ChatBotWrapper />}
      </BrowserOnly>
    </>
  );
}

export default Root;
