import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/designSystem';
import { Card, TabButton, Badge } from './index';

export default function DashboardLayout({
  title,
  tabs = [],
  activeTab,
  onTabChange,
  children,
  actions = null,
  stats = null
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      padding: 'clamp(12px, 4vw, 24px)',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: spacing.xl,
      }}>
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/mapa')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '7px 14px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: spacing.lg,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={16} />
          Voltar ao Mapa
        </button>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          gap: spacing.md,
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
              marginBottom: spacing.sm,
            }}>
              {title}
            </h1>
          </div>

          {actions && (
            <div style={{
              display: 'flex',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}>
              {actions}
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div style={{
            display: 'flex',
            gap: spacing.sm,
            borderBottom: `1px solid ${colors.border.light}`,
            paddingBottom: spacing.sm,
            overflowX: 'auto',
            '@media (max-width: 640px)': {
              gap: spacing.xs,
            },
          }}>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                icon={tab.icon}
                badge={tab.badge}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}>
          {stats.map((stat, index) => (
            <Card key={index} padding="md">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs,
                  }}>
                    {stat.label}
                  </div>
                  <div style={{
                    fontSize: fontSize['2xl'],
                    fontWeight: fontWeight.bold,
                    color: colors.text.primary,
                  }}>
                    {stat.value}
                  </div>
                </div>
                {stat.icon && (
                  <div style={{
                    color: colors.primary[500],
                    opacity: 0.7,
                  }}>
                    {stat.icon}
                  </div>
                )}
              </div>
              {stat.change && (
                <div style={{
                  fontSize: fontSize.sm,
                  color: stat.change > 0 ? colors.success[600] : colors.error[600],
                  marginTop: spacing.xs,
                }}>
                  {stat.change > 0 ? '+' : ''}{stat.change}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}

// Helper component for empty states
export function EmptyState({
  icon,
  title,
  description,
  action = null
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: spacing['3xl'],
      color: colors.text.secondary,
    }}>
      {icon && (
        <div style={{
          marginBottom: spacing.lg,
          opacity: 0.5,
        }}>
          {icon}
        </div>
      )}
      <h3 style={{
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.sm,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: fontSize.base,
        marginBottom: spacing.lg,
        lineHeight: 1.5,
      }}>
        {description}
      </p>
      {action}
    </div>
  );
}

// Helper component for loading states
export function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['3xl'],
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid colors.primary[200]',
        borderTopColor: colors.primary[600],
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
