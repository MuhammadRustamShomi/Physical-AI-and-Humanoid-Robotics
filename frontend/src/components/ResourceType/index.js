import React from 'react';

/**
 * ResourceType component displays cloud/on-prem badge from frontmatter.
 * Used to satisfy FR-012 (Cloud vs On-Prem Neutrality).
 *
 * Usage in MDX:
 * <ResourceType type="cloud" />
 * <ResourceType type="on-prem" />
 * <ResourceType type="both" />
 */
function ResourceType({ type }) {
  if (!type || type === 'none') {
    return null;
  }

  const labels = {
    cloud: 'Cloud',
    'on-prem': 'On-Prem',
    both: 'Cloud & On-Prem',
  };

  const descriptions = {
    cloud: 'This chapter uses cloud computing resources',
    'on-prem': 'This chapter requires local hardware',
    both: 'This chapter can use either cloud or local resources',
  };

  const label = labels[type] || type;
  const description = descriptions[type] || '';

  return (
    <span
      className={`resource-badge resource-badge--${type}`}
      title={description}
      aria-label={description}
    >
      {type === 'cloud' && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: '4px' }}
        >
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      )}
      {type === 'on-prem' && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: '4px' }}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
      {type === 'both' && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginRight: '4px' }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )}
      {label}
    </span>
  );
}

export default ResourceType;
