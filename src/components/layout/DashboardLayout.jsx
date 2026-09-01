import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useToast } from '../../context/ToastContext';

const DashboardLayout = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { addToast } = useToast();

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('Live data refreshed from AWS', 'success');
      window.dispatchEvent(new CustomEvent('rentox-refresh-data'));
    }, 600);
  };

  return (
    <div className="app-container">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="main-content">
        <Topbar
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
