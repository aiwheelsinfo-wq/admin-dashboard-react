import React, { useState } from 'react';
import { Search, RefreshCw, ExternalLink, Menu, Bell } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Topbar = ({ onRefresh, isRefreshing, onToggleSidebar }) => {
  const { addToast } = useToast();
  const [searchValue, setSearchValue] = useState('');

  const handleNotificationClick = () => {
    addToast('All live services and vehicle fleet engines operational', 'info');
  };

  return (
    <header
      className="topbar-header"
      style={{
        height: 'var(--topbar-height)',
        minHeight: '72px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px 0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'none'
      }}
    >
      {/* Left: Mobile Drawer Trigger + 46px High Search Command Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="header-mobile-toggle"
            style={{
              width: '42px',
              height: '42px',
              padding: 0,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer'
            }}
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu style={{ width: '20px', height: '20px', color: '#334155' }} />
          </button>
        )}

        {/* 500px Desktop Search Box (Height: 46px, Radius: 12px) */}
        <div
          className="header-search-container header-search-box"
          style={{
            position: 'relative',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '0 14px',
            transition: 'all 150ms ease'
          }}
        >
          <Search style={{
            width: '20px',
            height: '20px',
            color: '#94A3B8',
            marginRight: '12px',
            flexShrink: 0
          }} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search bookings, drivers, routes..."
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: '#334155',
              fontFamily: 'var(--font-body)'
            }}
          />
          <div
            className="header-search-shortcut"
            style={{
              height: '28px',
              padding: '0 9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.02em',
              flexShrink: 0,
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            Ctrl K
          </div>
        </div>
      </div>

      {/* Right: Unified 46px Height Controls Group (Gap: 9px) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        {/* 1. AWS Status Badge (Height: 46px, Radius: 12px) */}
        <div
          className="aws-status-badge"
          style={{
            height: '46px',
            minWidth: '135px',
            padding: '0 14px',
            borderRadius: '12px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            userSelect: 'none'
          }}
          title="Connected to AWS EC2 Cloud Server"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#059669',
                letterSpacing: '0.02em'
              }}
            >
              AWS LIVE
            </span>
            <span
              className="aws-ip-text"
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: '#10B981'
              }}
            >
              15.207.10.118
            </span>
          </div>
        </div>

        {/* 2. Customer Site Button (Height: 46px, Radius: 12px) */}
        <a
          href="https://rentox.co.in"
          target="_blank"
          rel="noreferrer"
          className="header-action-btn customer-site-btn"
          style={{
            height: '46px',
            padding: '0 16px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#334155',
            fontSize: '0.90625rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer'
          }}
          title="Open customer booking portal in new tab"
        >
          <span>Customer Site</span>
          <ExternalLink style={{ width: '15px', height: '15px', color: '#64748B' }} />
        </a>

        {/* 3. Notification Button (46px × 46px, Radius: 12px) */}
        <button
          onClick={handleNotificationClick}
          className="header-action-btn"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}
          title="System notifications"
          aria-label="System notifications"
        >
          <Bell style={{ width: '20px', height: '20px', color: '#64748B' }} />
        </button>

        {/* 4. Refresh Button (46px × 46px, Radius: 12px) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="header-action-btn"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            padding: 0
          }}
          title="Refresh dashboard"
          aria-label="Refresh dashboard data from AWS"
        >
          <RefreshCw
            style={{
              width: '20px',
              height: '20px',
              color: isRefreshing ? '#F59E0B' : '#64748B',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
        </button>

        {/* 5. Admin Avatar Chip (46px × 46px, Radius: 12px, Font: 16px/700) */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#FFF7ED',
            border: '1px solid #FDBA74',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
            userSelect: 'none',
            flexShrink: 0
          }}
          title="SuperAdmin (AWS Active)"
        >
          A
        </div>
      </div>
    </header>
  );
};

export default Topbar;
