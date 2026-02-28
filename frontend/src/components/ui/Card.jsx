import React from 'react';
import { colors, spacing, borderRadius, shadows } from '../../styles/designSystem';

export default function Card({ 
  children, 
  padding = 'md',
  hoverable = false,
  onClick = null,
  style = {}
}) {
  const getPadding = () => {
    switch (padding) {
      case 'sm': return spacing.md;
      case 'lg': return spacing.xl;
      case 'none': return '0';
      default: return spacing.lg;
    }
  };

  const baseStyles = {
    background: colors.bg.primary,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border.light}`,
    padding: getPadding(),
    cursor: onClick ? 'pointer' : 'default',
    transition: '0.2s ease',
    ...style,
  };

  return (
    <div
      onClick={onClick}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.boxShadow = shadows.md;
          e.currentTarget.style.borderColor = colors.border.medium;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = colors.border.light;
        }
      }}
    >
      {children}
    </div>
  );
}
