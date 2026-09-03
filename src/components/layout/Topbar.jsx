import React, { useState } from 'react';
import { Search, RefreshCw, ExternalLink, Menu, Bell } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const Topbar = ({ onRefresh, isRefreshing, onToggleSidebar }) => {
  const { addToast } = useToast();
  const [searchValue, setSearchValue] = useState('');

  const handleNotificationClick = () => {
    addToast('All live services and vehicle engines operational', 'info');
  };

  return (
    <header
      className="topbar-header"
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'none'
      }}
    >
      {/* Left: Mobile Drawer Trigger + Structured Search Command Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="header-mobile-toggle"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer'
            }}
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu style={{ width: '18px', height: '18px', color: '#334155' }} />
          </button>
        )}

        {/* Search Command Box */}
        <div
          className="header-search-container header-search-box"
          style={{
            position: 'relative',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0 12px',
            transition: 'all 150ms ease',
            marginLeft: '4px'
          }}
        >
          <Search style={{
            width: '16px',
            height: '16px',
            color: '#94A3B8',
            marginRight: '10px',
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
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#334155',
              fontFamily: 'var(--font-body)'
            }}
          />
          <div
            style={{
              padding: '2px 6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '5px',
              fontSize: '0.6875rem',
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

      {/* Right Control Group: Single Unified Flex Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 1. AWS Status Badge */}
        <div
          className="aws-status-badge"
          style={{
            height: '40px',
            padding: '0 12px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '0.6875rem',
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
                fontSize: '0.625rem',
                fontWeight: 600,
                color: '#10B981'
              }}
            >
              15.207.10.118
            </span>
          </div>
        </div>

        {/* 2. Customer Site Link Button */}
        <a
          href="https://rentox.co.in"
          target="_blank"
          rel="noreferrer"
          className="header-action-btn customer-site-btn"
          style={{
            height: '40px',
            padding: '0 13px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#334155',
            fontSize: '0.8125rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer'
          }}
          title="Open customer booking portal in new tab"
        >
          <span>Customer Site</span>
          <ExternalLink style={{ width: '13px', height: '13px', color: '#64748B' }} />
        </a>

        {/* 3. Notifications Button */}
        <button
          onClick={handleNotificationClick}
          className="header-action-btn"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
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
          <Bell style={{ width: '16px', height: '16px', color: '#64748B' }} />
        </button>

        {/* 4. Refresh Dashboard Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="header-action-btn"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
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
              width: '15px',
              height: '15px',
              color: isRefreshing ? '#F59E0B' : '#64748B',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
        </button>

        {/* 5. Compact Admin Avatar */}
        <div
          style={{
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
            fontSize: '0.875rem',
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
