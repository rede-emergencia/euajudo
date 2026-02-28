import React from 'react';
import { colors, spacing, borderRadius, fontSize, fontWeight, transitions } from '../../styles/designSystem';

export default function TabButton({ 
  children, 
  active = false, 
  onClick,
  icon = null,
  badge = null
}) {
  const baseStyles = {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: active ? fontWeight.semibold : fontWeight.medium,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: transitions.normal,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    background: active ? colors.primary[50] : 'transparent',
    color: active ? colors.primary[700] : colors.text.secondary,
    position: 'relative',
  };

  return (
    <button
      onClick={onClick}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = colors.neutral[100];
          e.currentTarget.style.color = colors.text.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.text.secondary;
        }
      }}
    >
      {icon && icon}
      <span>{children}</span>
      {badge && (
        <span style={{
          background: active ? colors.primary[600] : colors.neutral[400],
          color: colors.text.inverse,
          padding: `2px ${spacing.xs}`,
          borderRadius: borderRadius.full,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          minWidth: '20px',
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
