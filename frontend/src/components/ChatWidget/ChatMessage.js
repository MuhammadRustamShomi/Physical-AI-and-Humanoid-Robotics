import React from 'react';
import styles from './styles.module.css';

function ChatMessage({ message }) {
  const { role, content, sources, isError, selected_text } = message;
  const isUser = role === 'user';

  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage} ${isError ? styles.errorMessage : ''}`}>
      {/* Message content */}
      <div className={styles.messageContent}>
        {selected_text && (
          <div className={styles.contextQuote}>
            <span className={styles.quoteLabel}>About:</span> "{selected_text.substring(0, 100)}{selected_text.length > 100 ? '...' : ''}"
          </div>
        )}
        <div className={styles.messageText}>
          {content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {formatLine(line)}
              {i < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Source citations */}
      {sources && sources.length > 0 && (
        <div className={styles.sources}>
          <span className={styles.sourcesLabel}>Sources:</span>
          <ul className={styles.sourcesList}>
            {sources.map((source, index) => (
              <li key={index} className={styles.sourceItem}>
                <span className={styles.sourceSection}>{source.section}</span>
                {source.relevance_score && (
                  <span className={styles.sourceScore}>
                    {Math.round(source.relevance_score * 100)}% match
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown-like formatting for message text.
 */
function formatLine(line) {
  // Code blocks (inline)
  let formatted = line.replace(
    /`([^`]+)`/g,
    '<code class="' + styles.inlineCode + '">$1</code>'
  );

  // Bold
  formatted = formatted.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  // Italic
  formatted = formatted.replace(
    /\*([^*]+)\*/g,
    '<em>$1</em>'
  );

  // Return as HTML
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default ChatMessage;
