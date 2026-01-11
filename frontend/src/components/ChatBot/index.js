/**
 * ChatBot Component using ChatKit UI
 *
 * A production-ready chatbot interface that connects to the backend
 * OpenAI-powered API for intelligent conversations about the textbook.
 *
 * Features:
 * - ChatKit UI for professional chat interface
 * - Streaming responses for real-time feedback
 * - Chat history maintained in state
 * - Responsive design with toggle button
 */

import React, { useState, useCallback } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ConversationHeader,
  Avatar,
} from '@chatscope/chat-ui-kit-react';
import styles from './styles.module.css';

// API configuration - backend URL
const API_BASE_URL = 'http://localhost:8000';

/**
 * Main ChatBot component
 * Handles chat state, message sending, and streaming responses
 */
function ChatBot() {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hello! I'm your AI assistant for the Physical AI & Humanoid Robotics textbook. Ask me anything about the course content!",
      sender: 'assistant',
      direction: 'incoming',
      position: 'single',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  /**
   * Handles sending a message to the backend
   * Supports streaming responses for real-time feedback
   */
  const handleSend = useCallback(async (text) => {
    if (!text.trim()) return;

    // Add user message to chat
    const userMessage = {
      message: text,
      sender: 'user',
      direction: 'outgoing',
      position: 'single',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare chat history for context (last 10 messages)
      const chatHistory = messages.slice(-10).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
      }));

      // Call streaming endpoint
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add placeholder for assistant message
      setMessages((prev) => [
        ...prev,
        {
          message: '',
          sender: 'assistant',
          direction: 'incoming',
          position: 'single',
        },
      ]);

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE data
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;

                // Update the last message with new content
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    message: assistantMessage,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Non-JSON data, might be raw text
              if (data && data !== '[DONE]') {
                assistantMessage += data;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    message: assistantMessage,
                  };
                  return updated;
                });
              }
            }
          }
        }
      }

      // If no streaming content was received, fall back to non-streaming
      if (!assistantMessage) {
        const fallbackResponse = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: text,
            session_id: null,
          }),
        });

        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              message: data.response || 'Sorry, I could not generate a response.',
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);

      // Add error message
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1].sender === 'assistant' && !updated[updated.length - 1].message) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            message: 'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
          };
        } else {
          updated.push({
            message: 'Sorry, I encountered an error. Please make sure the backend server is running and try again.',
            sender: 'assistant',
            direction: 'incoming',
            position: 'single',
          });
        }
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  /**
   * Clears the chat history
   */
  const handleClearChat = () => {
    setMessages([
      {
        message: "Chat cleared! How can I help you with the Physical AI textbook?",
        sender: 'assistant',
        direction: 'incoming',
        position: 'single',
      },
    ]);
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat assistant'}
        title="Chat with AI Assistant"
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
        <div className={styles.chatContainer}>
          <MainContainer>
            <ChatContainer>
              {/* Header with clear button */}
              <ConversationHeader>
                <Avatar
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234a9eff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
                  name="AI Assistant"
                />
                <ConversationHeader.Content userName="AI Textbook Assistant" />
                <ConversationHeader.Actions>
                  <button
                    className={styles.clearButton}
                    onClick={handleClearChat}
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                </ConversationHeader.Actions>
              </ConversationHeader>

              {/* Message list */}
              <MessageList
                typingIndicator={
                  isTyping ? <TypingIndicator content="AI is thinking..." /> : null
                }
              >
                {messages.map((msg, index) => (
                  <Message
                    key={index}
                    model={{
                      message: msg.message,
                      sender: msg.sender,
                      direction: msg.direction,
                      position: msg.position,
                    }}
                  />
                ))}
              </MessageList>

              {/* Message input */}
              <MessageInput
                placeholder="Ask about the textbook..."
                onSend={handleSend}
                attachButton={false}
                disabled={isTyping}
              />
            </ChatContainer>
          </MainContainer>
        </div>
      )}
    </>
  );
}

export default ChatBot;
