import React from 'react';
import { X } from 'lucide-react';
import { colors, spacing, borderRadius, shadows, fontSize, fontWeight } from '../../styles/designSystem';
import Button from './Button';

export default function Modal({
  show,
  onClose,
  title,
  children,
  footer = null,
  size = 'md', // sm, md, lg, full
  ...props
}) {
  if (!show) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: '90%', maxWidth: '400px' };
      case 'lg':
        return { width: '90%', maxWidth: '800px' };
      case 'full':
        return { width: '95%', maxWidth: '100%', height: '95vh' };
      default: // md
        return { width: '90%', maxWidth: '600px' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: spacing.md,
    }}>
      <div style={{
        background: colors.bg.primary,
        borderRadius: borderRadius.xl,
        boxShadow: shadows.xl,
        display: 'flex',
        flexDirection: 'column',
        ...getSizeStyles(),
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.border.light}`,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.text.primary,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
              color: colors.text.secondary,
              borderRadius: borderRadius.md,
              transition: '0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.neutral[100];
              e.currentTarget.style.color = colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: spacing.lg,
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: spacing.lg,
            borderTop: `1px solid ${colors.border.light}`,
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
