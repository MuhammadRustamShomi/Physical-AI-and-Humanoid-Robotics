import React from 'react';

/**
 * HardwareRequirements component displays hardware requirements from frontmatter.
 * Used to satisfy FR-011 (Hardware Truthfulness).
 *
 * Usage in MDX:
 * <HardwareRequirements requirements="NVIDIA RTX 3070, 32GB RAM, 100GB SSD" />
 */
function HardwareRequirements({ requirements }) {
  if (!requirements) {
    return null;
  }

  // Parse requirements string into list
  const items = requirements.split(',').map((item) => item.trim()).filter(Boolean);

  return (
    <div className="hardware-requirements">
      <h4>Hardware Requirements</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default HardwareRequirements;
