import React from 'react';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../styles/designSystem';

export default function Badge({ 
  children, 
  variant = 'neutral', // primary, success, warning, error, neutral
  size = 'md' // sm, md
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.primary[100],
          color: colors.primary[700],
        };
      case 'success':
        return {
          background: colors.success[100],
          color: colors.success[700],
        };
      case 'warning':
        return {
          background: colors.warning[100],
          color: colors.warning[700],
        };
      case 'error':
        return {
          background: colors.error[100],
          color: colors.error[700],
        };
      default: // neutral
        return {
          background: colors.neutral[100],
          color: colors.neutral[700],
        };
    }
  };

  const getSizeStyles = () => {
    return size === 'sm' 
      ? { padding: `2px ${spacing.xs}`, fontSize: fontSize.xs }
      : { padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.sm };
  };

  return (
    <span style={{
      ...getVariantStyles(),
      ...getSizeStyles(),
      borderRadius: borderRadius.full,
      fontWeight: fontWeight.semibold,
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
