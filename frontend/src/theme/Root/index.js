import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import ChatWidget from '../../components/ChatWidget';

/**
 * Root wrapper component to provide global context and components.
 * This is a Docusaurus swizzle pattern for adding providers.
 */
function Root({ children }) {
  return (
    <ChatProvider>
      {children}
      <ChatWidget />
    </ChatProvider>
  );
}

export default Root;
