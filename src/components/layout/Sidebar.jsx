import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Calendar,
  Car,
  Users,
  Wallet,
  ShieldCheck,
  MapPin,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/oneway-fare', label: 'One-Way Dynamic Fare', icon: Zap, badge: 'Live' },
    { to: '/local-taxi-fare', label: 'Local Taxi Dynamic Fare', icon: Car, badge: 'City' },
    { to: '/city-boundaries', label: 'City Boundaries & Geo-Fence', icon: MapPin, badge: 'Geo' },
    { to: '/special-days', label: 'Festival Surge Calendar', icon: Calendar, badge: 'Holiday' },
    { to: '/bookings', label: 'Live Bookings', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            display: 'block'
          }}
        />
      )}

      <aside
        className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b'
            }}>
              <ShieldCheck style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111827', lineHeight: 1.1 }}>
                RENTOX
              </h2>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                color: '#6b7280',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#111827' : '#4b5563',
                  backgroundColor: isActive ? '#fff7ed' : 'transparent',
                  borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon style={{
                        width: '18px',
                        height: '18px',
                        color: isActive ? '#f59e0b' : '#6b7280',
                        transition: 'color 0.15s ease'
                      }} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: item.badge === 'Live' ? '#ecfdf5' : '#fff7ed',
                        color: item.badge === 'Live' ? '#059669' : '#c2410c',
                        border: item.badge === 'Live' ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              A
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Ansil (SuperAdmin)</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>Online (AWS Server)</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
