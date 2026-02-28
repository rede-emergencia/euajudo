import React, { useState } from 'react';
import { Menu, X, MapPin, User, LogOut, Settings } from 'lucide-react';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, transitions } from '../../styles/designSystem';
import { Button, TabButton } from './index';

export default function Header({
  user,
  onLogout,
  onNavigate,
  activeTab = 'mapa',
  userActions = { hasActiveOperation: false, operations: [] }
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getHeaderColor = () => {
    if (!userActions.hasActiveOperation) {
      return {
        background: colors.primary[50],
        borderColor: colors.primary[200],
        boxShadow: `0 2px 4px ${colors.primary[200]}`,
      };
    }

    const now = new Date();
    let mostUrgentOperation = null;
    let minTimeRemaining = Infinity;

    userActions.operations.forEach(operation => {
      const createdAt = new Date(operation.createdAt);
      const timeElapsed = (now - createdAt) / (1000 * 60 * 60);
      const timeLimit = 24;
      const timeRemaining = timeLimit - timeElapsed;

      if (timeRemaining < minTimeRemaining) {
        minTimeRemaining = timeRemaining;
        mostUrgentOperation = operation;
      }
    });

    if (!mostUrgentOperation) {
      return {
        background: colors.warning[50],
        borderColor: colors.warning[200],
        boxShadow: `0 2px 4px ${colors.warning[200]}`,
      };
    }

    const timeRemaining = minTimeRemaining;

    if (timeRemaining <= 0) {
      return {
        background: colors.error[50],
        borderColor: colors.error[200],
        boxShadow: `0 2px 4px ${colors.error[200]}`,
      };
    } else if (timeRemaining <= 4) {
      return {
        background: colors.error[50],
        borderColor: colors.error[200],
        boxShadow: `0 2px 4px ${colors.error[200]}`,
      };
    } else if (timeRemaining <= 8) {
      return {
        background: colors.warning[50],
        borderColor: colors.warning[200],
        boxShadow: `0 2px 4px ${colors.warning[200]}`,
      };
    } else {
      return {
        background: colors.warning[50],
        borderColor: colors.warning[200],
        boxShadow: `0 2px 4px ${colors.warning[200]}`,
      };
    }
  };

  const headerColors = getHeaderColor();

  const navigationItems = [
    { id: 'painel', label: 'Dashboard', icon: null },
  ];

  const userMenuItems = [
    { id: 'profile', label: 'Perfil', icon: <User size={16} />, action: () => onNavigate('/perfil') },
    { id: 'settings', label: 'Configurações', icon: <Settings size={16} />, action: () => { } },
    { id: 'logout', label: 'Sair', icon: <LogOut size={16} />, action: onLogout },
  ];

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: headerColors.background,
      borderBottom: `2px solid ${headerColors.borderColor}`,
      boxShadow: headerColors.boxShadow,
      transition: transitions.normal,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${spacing.md} ${spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div
          onClick={() => onNavigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: 'pointer',
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          <MapPin size={24} />
          <span>VouAjudar</span>
        </div>

        {/* Desktop Navigation */}
        <div style={{
          display: 'none',
          gap: spacing.sm,
          '@media (min-width: 768px)': {
            display: 'flex',
          },
        }}>
          {navigationItems.map(item => (
            <TabButton
              key={item.id}
              active={activeTab === item.id}
              onClick={() => onNavigate(item.id === 'mapa' ? '/' : '/dashboard')}
              icon={item.icon}
            >
              {item.label}
            </TabButton>
          ))}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          {/* Desktop User Menu */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: spacing.md,
            '@media (min-width: 768px)': {
              display: 'flex',
            },
          }}>
            <span style={{
              fontSize: fontSize.sm,
              color: colors.text.secondary,
            }}>
              {user?.email || 'Usuário'}
            </span>
            <div style={{
              position: 'relative',
            }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <User size={20} />
              </Button>

              {/* Dropdown Menu */}
              {mobileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: spacing.xs,
                  background: colors.bg.primary,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.lg,
                  minWidth: '200px',
                  overflow: 'hidden',
                }}>
                  {userMenuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        fontSize: fontSize.sm,
                        color: colors.text.primary,
                        transition: transitions.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.neutral[100];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              '@media (min-width: 768px)': {
                display: 'none',
              },
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
              color: colors.text.primary,
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          background: colors.bg.primary,
          borderTop: `1px solid ${colors.border.light}`,
          padding: spacing.md,
          display: 'none',
          '@media (max-width: 767px)': {
            display: 'block',
          },
        }}>
          {/* Mobile Navigation */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}>
            {navigationItems.map(item => (
              <TabButton
                key={item.id}
                active={activeTab === item.id}
                onClick={() => {
                  onNavigate(item.id === 'mapa' ? '/' : '/dashboard');
                  setMobileMenuOpen(false);
                }}
                icon={item.icon}
              >
                {item.label}
              </TabButton>
            ))}
          </div>

          {/* Mobile User Menu */}
          <div style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
          }}>
            <div style={{
              fontSize: fontSize.sm,
              color: colors.text.secondary,
              marginBottom: spacing.sm,
            }}>
              {user?.email || 'Usuário'}
            </div>
            {userMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  fontSize: fontSize.sm,
                  color: colors.text.primary,
                  textAlign: 'left',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
