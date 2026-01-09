import { useState, useCallback } from 'react';
import { useChat as useChatContext } from '../contexts/ChatContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export function useChatApi() {
  const {
    sessionId,
    setSessionId,
    currentChapter,
    selectedText,
    setSelectedText,
    setIsLoading,
    addMessage,
  } = useChatContext();

  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (content) => {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        chapter_id: currentChapter,
        selected_text: selectedText,
      };
      addMessage(userMessage);

      // Clear selected text after using it
      if (selectedText) {
        setSelectedText(null);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            chapter_id: currentChapter,
            content,
            selected_text: selectedText,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        // Update session ID if new
        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id);
        }

        // Add assistant message
        const assistantMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
          sources: data.sources || [],
        };
        addMessage(assistantMessage);

        return data;
      } catch (err) {
        setError(err.message);

        // Add error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
          isError: true,
        };
        addMessage(errorMessage);

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, currentChapter, selectedText, setSessionId, setIsLoading, addMessage, setSelectedText]
  );

  const getSession = useCallback(
    async (targetSessionId) => {
      const sid = targetSessionId || sessionId;
      if (!sid) {
        return null;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/chat/session/${sid}`);

        if (!response.ok) {
          if (response.status === 404) {
            // Session expired, clear local state
            setSessionId(null);
            return null;
          }
          throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [sessionId, setSessionId]
  );

  const retryLastMessage = useCallback(async () => {
    // This would retry the last failed message
    // Implementation depends on how you want to handle retries
    setError(null);
  }, []);

  return {
    sendMessage,
    getSession,
    retryLastMessage,
    error,
  };
}

export default useChatApi;
