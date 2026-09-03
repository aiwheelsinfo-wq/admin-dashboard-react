import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Repeat,
  Calendar,
  Car,
  ShieldCheck,
  MapPin,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Grouped Navigation Sections (strictly preserving all existing routes)
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/oneway-fare', label: 'One-Way Dynamic Fare', icon: Zap, badge: 'Live', badgeType: 'live' },
        { to: '/roundtrip-fare', label: 'Round-Trip Fare', icon: Repeat, badge: 'Fleet', badgeType: 'fleet' },
        { to: '/local-taxi-fare', label: 'Local Taxi Dynamic Fare', icon: Car, badge: 'City', badgeType: 'city' },
      ]
    },
    {
      title: 'PRICING & CONFIGURATION',
      items: [
        { to: '/city-boundaries', label: 'City Boundaries & Geo-Fence', icon: MapPin, badge: 'Geo', badgeType: 'geo' },
        { to: '/special-days', label: 'Festival Surge Calendar', icon: Calendar, badge: 'Holiday', badgeType: 'holiday' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { to: '/bookings', label: 'Live Bookings', icon: ShieldCheck },
      ]
    }
  ];

  // Refined enterprise badge styling
  const getBadgeStyle = (type) => {
    switch (type) {
      case 'live':
        return {
          backgroundColor: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0'
        };
      case 'fleet':
        return {
          backgroundColor: '#FFF7ED',
          color: '#C2410C',
          border: '1px solid #FED7AA'
        };
      case 'city':
        return {
          backgroundColor: '#FFF7ED',
          color: '#D97706',
          border: '1px solid #FED7AA'
        };
      case 'geo':
        return {
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          border: '1px solid #BFDBFE'
        };
      case 'holiday':
        return {
          backgroundColor: '#FFF7ED',
          color: '#EA580C',
          border: '1px solid #FED7AA'
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          color: '#4B5563',
          border: '1px solid #E5E7EB'
        };
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            display: 'block'
          }}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
          boxShadow: '0 1px 8px rgba(15, 23, 42, 0.04)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Rentox Brand Header */}
        <div style={{
          padding: '20px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
              flexShrink: 0,
              boxShadow: '0 2px 5px rgba(245, 158, 11, 0.12)'
            }}>
              <ShieldCheck style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.375rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#111827',
                lineHeight: 1.15,
                margin: 0
              }}>
                RENTOX
              </h2>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#F59E0B',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginTop: '3px'
              }}>
                ADMIN PORTAL
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {isOpen && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close navigation"
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          )}
        </div>

        {/* Grouped Navigation Menu */}
        <nav style={{
          padding: '14px 0',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {navSections.map((section, sIdx) => (
            <div key={section.title} style={{ marginBottom: sIdx < navSections.length - 1 ? '16px' : '6px' }}>
              {/* Section Header Label */}
              <div style={{
                fontSize: '0.656rem',
                fontWeight: 700,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 22px 6px',
                margin: 0
              }}>
                {section.title}
              </div>

              {/* Section Nav Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                      {({ isActive }) => (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon
                              className="sidebar-nav-icon"
                              style={{
                                width: '19px',
                                height: '19px',
                                color: isActive ? '#F59E0B' : '#6B7280',
                                flexShrink: 0,
                                transition: 'color 180ms ease'
                              }}
                            />
                            <span style={{ fontSize: '0.90rem' }}>{item.label}</span>
                          </div>

                          {item.badge && (
                            <span style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              lineHeight: 1.2,
                              ...getBadgeStyle(item.badgeType)
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom User Profile */}
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9375rem',
                flexShrink: 0
              }}>
                A
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                  SuperAdmin
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span>Online (AWS)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 150ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Sign out"
            >
              <LogOut style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '380px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            animation: 'fadeIn 0.15s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <LogOut style={{ width: '22px', height: '22px' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                Confirm Sign Out
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to log out of the Rentox Admin Portal? You will need to enter your email and password to access the dashboard again.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
