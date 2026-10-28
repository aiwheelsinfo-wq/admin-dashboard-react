import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Award,
  Gift,
  Sparkles,
  Shield,
  ShieldAlert,
  Eye,
  Edit3,
  X,
  Check,
  Copy,
  ExternalLink,
  Download,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Car,
  Hash,
  Building2,
  CreditCard,
  Crown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  DollarSign,
  Zap,
  Activity
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const UsersPage = () => {
  const { addToast } = useToast();

  // Primary state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    blocked_users: 0,
    inactive_users: 0,
    total_agents: 0,
    total_customers: 0,
    today_logins: 0,
    weekly_logins: 0,
    monthly_logins: 0,
    today_signups: 0,
    total_spent: 0,
    total_bookings: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, yesterday, weekly, monthly, today_signup, weekly_signup, monthly_signup
  const [sortBy, setSortBy] = useState('last_login'); // last_login, recent, bookings, spend, points, name

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const tableRef = useRef(null);

  // Modals & Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userBookings, setUserBookings] = useState([]);

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    city: '',
    pincode: '',
    agency_name: '',
    reward_point: 0,
    available_spin: 0,
    badge: 'green',
    account_type: 'customer',
    status: 'Active'
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Copy helper
  const [copiedPhone, setCopiedPhone] = useState(null);
  const copyToClipboard = (text, label = 'Phone number') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    addToast(`${label} copied to clipboard`, 'info');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Fetch Users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'get_users',
        status: statusFilter,
        type: typeFilter,
        badge: badgeFilter,
        time_filter: timeFilter,
        search: searchTerm,
        limit: '300'
      });
      const res = await axios.get(`${endpoints.usersManagement}?${params.toString()}`, { timeout: 15000 });
      if (res.data && res.data.status === 'success') {
        setUsers(res.data.users || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        addToast(res.data?.message || 'Failed to fetch users list.', 'error');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast('Error connecting to user management API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, badgeFilter, timeFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open User Details & Booking History Modal
  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setUserBookings([]);
    setUserDetailsLoading(true);
    try {
      const res = await axios.get(`${endpoints.usersManagement}?action=get_user_details&user_id=${user.id}&phone_number=${encodeURIComponent(user.phone_number)}`);
      if (res.data && res.data.status === 'success') {
        setSelectedUser(res.data.user || user);
        setUserBookings(res.data.bookings || []);
      } else {
        addToast(res.data?.message || 'Failed to load user booking history', 'warning');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      addToast('Error loading booking history.', 'error');
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name === 'Unnamed User' ? '' : user.name,
      email: user.email || '',
      city: user.city || '',
      pincode: user.pincode ? String(user.pincode) : '',
      agency_name: user.agency_name === 'Not Filled' ? '' : (user.agency_name || ''),
      reward_point: user.reward_point || 0,
      available_spin: user.available_spin || 0,
      badge: user.badge || 'green',
      account_type: user.account_type || 'customer',
      status: user.status || 'Active'
    });
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const payload = {
        action: 'update_profile',
        user_id: editingUser.id,
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        city: editFormData.city.trim(),
        pincode: parseInt(editFormData.pincode, 10) || 0,
        agency_name: editFormData.agency_name.trim(),
        reward_point: parseInt(editFormData.reward_point, 10) || 0,
        available_spin: parseInt(editFormData.available_spin, 10) || 0,
        badge: editFormData.badge,
        account_type: editFormData.account_type
      };

      const res = await axios.post(`${endpoints.usersManagement}?action=update_profile`, payload);
      if (res.data && res.data.status === 'success') {
        if (editFormData.status !== editingUser.status) {
          await axios.post(`${endpoints.usersManagement}?action=update_status`, {
            user_id: editingUser.id,
            status: editFormData.status
          });
        }
        addToast(`Profile for "${editFormData.name || editingUser.phone_number}" updated successfully!`, 'success');
        setEditingUser(null);
        fetchUsers();
        if (selectedUser && selectedUser.id === editingUser.id) {
          handleOpenDetails({ ...editingUser, ...editFormData });
        }
      } else {
        addToast(res.data?.message || 'Failed to update user profile.', 'error');
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
      addToast('Error updating profile.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Status Toggle (Active <-> Blocked)
  const handleToggleStatus = async (user, newStatus) => {
    setStatusUpdatingId(user.id);
    try {
      const res = await axios.post(`${endpoints.usersManagement}?action=update_status`, {
        user_id: user.id,
        status: newStatus
      });
      if (res.data && res.data.status === 'success') {
        addToast(`User ${user.phone_number} is now marked as ${newStatus}`, 'success');
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        addToast(res.data?.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      addToast('Error updating status.', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Export Filtered Users to CSV
  const handleExportCSV = () => {
    if (sortedUsers.length === 0) {
      addToast('No users available to export.', 'warning');
      return;
    }

    const headers = [
      'User ID',
      'Name',
      'Phone Number',
      'Email',
      'City',
      'Pincode',
      'Account Type',
      'Agency Name',
      'Status',
      'Badge',
      'Reward Points',
      'Available Spins',
      'Total Bookings',
      'Completed Bookings',
      'Cancelled Bookings',
      'Total Spent (INR)',
      'Last Booking Date',
      'Last Login Date',
      'Registration Date'
    ];

    const rows = sortedUsers.map(u => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${u.phone_number || ''}"`,
      `"${u.email || ''}"`,
      `"${u.city || ''}"`,
      u.pincode || '',
      u.account_type || 'customer',
      `"${(u.agency_name || '').replace(/"/g, '""')}"`,
      u.status || 'Active',
      u.badge || 'green',
      u.reward_point || 0,
      u.available_spin || 0,
      u.total_bookings || 0,
      u.completed_bookings || 0,
      u.cancelled_bookings || 0,
      u.total_spent || 0,
      u.last_booking_date || '',
      u.last_login || u.created_at || '',
      u.created_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rentox_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${sortedUsers.length} users to CSV`, 'success');
  };

  // Client-side sorting
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (sortBy === 'last_login') {
        const da = new Date(a.last_login || a.created_at || 0).getTime();
        const db = new Date(b.last_login || b.created_at || 0).getTime();
        return db - da;
      }
      if (sortBy === 'bookings') return (b.total_bookings || 0) - (a.total_bookings || 0);
      if (sortBy === 'spend') return (b.total_spent || 0) - (a.total_spent || 0);
      if (sortBy === 'points') return (b.reward_point || 0) - (a.reward_point || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return b.id - a.id; // recent by ID
    });
  }, [users, sortBy]);

  // Reset page to 1 whenever filters, search, or pageSize change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, badgeFilter, timeFilter, sortBy, pageSize]);

  // Pagination metrics
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  // Paginated slice of users
  const paginatedUsers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedUsers.slice(startIndex, startIndex + pageSize);
  }, [sortedUsers, safeCurrentPage, pageSize]);

  // Page change handler with smooth scroll to table top
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate pagination page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Helper: check if date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  // Helper: relative time formatter for login
  const formatLoginTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    if (diffDays === 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) {
      return `Yesterday, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    }
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper for Badge visual styling
  const renderBadgePill = (badge) => {
    const b = (badge || 'green').toLowerCase();
    if (b === 'gold') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          color: '#B45309',
          border: '1px solid #FCD34D'
        }}>
          <Crown style={{ width: '11px', height: '11px', color: '#D97706' }} /> Gold
        </span>
      );
    }
    if (b === 'silver') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          background: '#F1F5F9',
          color: '#475569',
          border: '1px solid #CBD5E1'
        }}>
          <Award style={{ width: '11px', height: '11px', color: '#64748B' }} /> Silver
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        background: '#ECFDF5',
        color: '#059669',
        border: '1px solid #A7F3D0'
      }}>
        <Sparkles style={{ width: '11px', height: '11px', color: '#10B981' }} /> Green
      </span>
    );
  };

  // Helper for Status visual styling
  const renderStatusPill = (status) => {
    const s = (status || 'Active').toLowerCase();
    if (s === 'active') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
          Active
        </span>
      );
    }
    if (s === 'blocked') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: '#FFF1F2',
          color: '#E11D48',
          border: '1px solid #FECDD3'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F43F5E' }} />
          Blocked
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#F8FAFC',
        color: '#64748B',
        border: '1px solid #E2E8F0'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94A3B8' }} />
        {status || 'Inactive'}
      </span>
    );
  };

  // Avatar initials helper
  const getAvatarInitials = (name, phone) => {
    if (name && name !== 'Unnamed User') {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return phone ? phone.slice(-2) : 'U';
  };

  // Quick activity filter tabs config
  const activityTabs = [
    { id: 'all', label: 'All Users', count: stats.total_users, icon: Users },
    { id: 'today', label: "Today's Logins", count: stats.today_logins, icon: Zap, badgeColor: '#10B981', highlight: true },
    { id: 'weekly', label: 'Last 7 Days (Weekly)', count: stats.weekly_logins, icon: Calendar, badgeColor: '#3B82F6' },
    { id: 'monthly', label: 'Last 30 Days (Monthly)', count: stats.monthly_logins, icon: Clock, badgeColor: '#8B5CF6' },
    { id: 'today_signup', label: 'New Today', count: stats.today_signups, icon: Sparkles, badgeColor: '#F59E0B' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header & Actions Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        backgroundColor: '#FFFFFF',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
            }}>
              <Users style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Customers & User Directory
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '3px 0 0 0' }}>
                Monitor active logins, track daily/weekly/monthly active users, trip history, loyalty tiers & security status.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.8125rem',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Download CSV of current user list"
          >
            <Download style={{ width: '15px', height: '15px', color: '#64748B' }} />
            Export CSV
          </button>

          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8125rem',
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Users */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', display: 'block' }}>
              Total Registered
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', display: 'block', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {stats.total_users.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              <span>{stats.total_customers} Riders</span>
              <span>•</span>
              <span style={{ color: '#D97706' }}>{stats.total_agents} Agents</span>
            </div>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Card 2: Today Logins */}
        <div
          onClick={() => setTimeFilter('today')}
          style={{
            backgroundColor: timeFilter === 'today' ? '#F0FDF4' : '#FFFFFF',
            borderRadius: '18px',
            padding: '20px',
            border: timeFilter === 'today' ? '2px solid #10B981' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
                Today's Logins
              </span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#059669', display: 'block', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {stats.today_logins.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#10B981' }}>
              {stats.today_signups} new signups today
            </span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Card 3: Weekly Active Users */}
        <div
          onClick={() => setTimeFilter('weekly')}
          style={{
            backgroundColor: timeFilter === 'weekly' ? '#EFF6FF' : '#FFFFFF',
            borderRadius: '18px',
            padding: '20px',
            border: timeFilter === 'weekly' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2563EB', display: 'block' }}>
              Active This Week
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1D4ED8', display: 'block', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {stats.weekly_logins.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              {stats.monthly_logins} active past 30 days
            </span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Card 4: Customer Revenue */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', display: 'block' }}>
              Lifetime Trips Value
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', display: 'block', marginTop: '4px', letterSpacing: '-0.02em' }}>
              ₹{Number(stats.total_spent || 0).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              Across {stats.total_bookings.toLocaleString()} completed bookings
            </span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#F8FAFC',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E2E8F0'
          }}>
            <TrendingUp style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

      </div>

      {/* 3. Quick Time-Filter Tabs Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        padding: '4px 0'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <Clock style={{ width: '14px', height: '14px' }} /> Filter Activity:
        </span>
        {activityTabs.map((tab) => {
          const isActive = timeFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                backgroundColor: isActive ? '#0F172A' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#334155',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 4px rgba(15, 23, 42, 0.12)' : 'none'
              }}
            >
              <Icon style={{ width: '14px', height: '14px', color: isActive ? '#FFFFFF' : (tab.badgeColor || '#64748B') }} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#475569'
              }}>
                {tab.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search & Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
          <Search style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#94A3B8',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, email, city, agency..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8125rem',
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              transition: 'border-color 0.15s ease'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          
          {/* Timeframe Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Timeframe:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today's Logins</option>
              <option value="yesterday">Yesterday's Logins</option>
              <option value="weekly">Last 7 Days (Weekly)</option>
              <option value="monthly">Last 30 Days (Monthly)</option>
              <option value="today_signup">New Signups Today</option>
              <option value="weekly_signup">New Signups This Week</option>
              <option value="monthly_signup">New Signups This Month</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Account Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Role:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Roles</option>
              <option value="customer">Rider (Customer)</option>
              <option value="agent">Agency (Agent)</option>
            </select>
          </div>

          {/* Badge Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Badge:</span>
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Badges</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="green">Green</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="last_login">Most Recently Active</option>
              <option value="recent">Newest Signups</option>
              <option value="spend">Highest Spend ₹</option>
              <option value="bookings">Most Bookings</option>
              <option value="points">Reward Points</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 5. Users Table */}
      <div
        ref={tableRef}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        
        {/* Table Top Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FAFAFA'
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
            Showing <strong style={{ color: '#0F172A' }}>{sortedUsers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</strong> to <strong style={{ color: '#0F172A' }}>{Math.min(safeCurrentPage * pageSize, sortedUsers.length)}</strong> of <strong style={{ color: '#0F172A' }}>{sortedUsers.length}</strong> users {timeFilter !== 'all' ? `(filtered by ${timeFilter.replace('_', ' ')})` : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#64748B' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Location</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Login & Activity</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trips & Spend</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loyalty & Spins</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                    <RefreshCw style={{ width: '28px', height: '28px', margin: '0 auto 12px auto', color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Loading user accounts...</p>
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Connecting to AWS database & calculating activity</p>
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#94A3B8' }}>
                      <Users style={{ width: '24px', height: '24px' }} />
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>No users found for this timeframe</p>
                    <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>Try switching to "All Users" or adjusting the search term.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isAgent = user.account_type === 'agent';
                  const initials = getAvatarInitials(user.name, user.phone_number);
                  const isUpdatingStatus = statusUpdatingId === user.id;
                  const loggedInToday = isToday(user.last_login || user.created_at);

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* 1. User Details */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: isAgent ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                                {user.name}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
                                #{user.id}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              {user.email ? (
                                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Mail style={{ width: '11px', height: '11px', color: '#94A3B8' }} />
                                  {user.email}
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#CBD5E1', fontStyle: 'italic' }}>No email provided</span>
                              )}
                            </div>
                            <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                              Joined {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact & Location */}
                      <td style={{ padding: '16px 18px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                              {user.phone_number}
                            </span>
                            <button
                              onClick={() => copyToClipboard(user.phone_number, 'Phone')}
                              title="Copy Phone"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: copiedPhone === user.phone_number ? '#10B981' : '#94A3B8'
                              }}
                            >
                              {copiedPhone === user.phone_number ? (
                                <Check style={{ width: '13px', height: '13px' }} />
                              ) : (
                                <Copy style={{ width: '13px', height: '13px' }} />
                              )}
                            </button>
                            {user.phone_number && (
                              <a
                                href={`https://wa.me/91${user.phone_number.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                style={{
                                  color: '#059669',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <MessageCircle style={{ width: '13px', height: '13px' }} />
                              </a>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                            <MapPin style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                            <span>{user.city || 'Location unset'}</span>
                            {user.pincode && <span style={{ color: '#94A3B8' }}>• {user.pincode}</span>}
                          </div>
                        </div>
                      </td>

                      {/* 3. Account Role */}
                      <td style={{ padding: '16px 18px' }}>
                        <div>
                          {isAgent ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: '#FFFBEB',
                              color: '#B45309',
                              border: '1px solid #FCD34D'
                            }}>
                              <Building2 style={{ width: '11px', height: '11px' }} /> Agent
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE'
                            }}>
                              <Car style={{ width: '11px', height: '11px' }} /> Customer
                            </span>
                          )}
                          {user.agency_name && user.agency_name !== 'Not Filled' && (
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                              {user.agency_name}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Last Login & Activity */}
                      <td style={{ padding: '16px 18px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: loggedInToday ? '#10B981' : '#94A3B8',
                              boxShadow: loggedInToday ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
                            }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: loggedInToday ? '#059669' : '#0F172A' }}>
                              {formatLoginTime(user.last_login || user.created_at)}
                            </span>
                          </div>
                          {loggedInToday && (
                            <span style={{
                              display: 'inline-block',
                              marginTop: '3px',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D'
                            }}>
                              Active Today
                            </span>
                          )}
                          {user.last_booking_date && (
                            <span style={{ fontSize: '10px', color: '#64748B', display: 'block', marginTop: '3px' }}>
                              Last Trip: {user.last_booking_date}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Trips & Spend */}
                      <td style={{ padding: '16px 18px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                              ₹{Number(user.total_spent || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            <strong style={{ color: '#0F172A' }}>{user.total_bookings}</strong> trips ({user.completed_bookings} done)
                          </div>
                        </div>
                      </td>

                      {/* 6. Loyalty & Spins */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>{renderBadgePill(user.badge)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                            <span title="Reward Points" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Gift style={{ width: '11px', height: '11px', color: '#F59E0B' }} />
                              <strong>{user.reward_point}</strong> pts
                            </span>
                            <span>•</span>
                            <span title="Available Spins">
                              <strong>{user.available_spin}</strong> spins
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {renderStatusPill(user.status)}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          
                          {/* View Details / Trips */}
                          <button
                            onClick={() => handleOpenDetails(user)}
                            title="View Full Booking History & Profile"
                            style={{
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye style={{ width: '12px', height: '12px' }} />
                            View
                          </button>

                          {/* Edit Profile */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Edit User Profile"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit3 style={{ width: '12px', height: '12px' }} />
                            Edit
                          </button>

                          {/* Quick Toggle Block / Active */}
                          <button
                            onClick={() => handleToggleStatus(user, user.status === 'Active' ? 'Blocked' : 'Active')}
                            disabled={isUpdatingStatus}
                            title={user.status === 'Active' ? 'Block User' : 'Unblock User'}
                            style={{
                              backgroundColor: user.status === 'Active' ? '#FFF1F2' : '#ECFDF5',
                              color: user.status === 'Active' ? '#E11D48' : '#059669',
                              border: `1px solid ${user.status === 'Active' ? '#FECDD3' : '#A7F3D0'}`,
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              opacity: isUpdatingStatus ? 0.6 : 1
                            }}
                          >
                            {isUpdatingStatus ? (
                              <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                            ) : user.status === 'Active' ? (
                              <>
                                <ShieldAlert style={{ width: '12px', height: '12px' }} />
                                Block
                              </>
                            ) : (
                              <>
                                <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                Unblock
                              </>
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#FAFAFA',
          fontSize: '0.8125rem',
          color: '#64748B'
        }}>
          {/* Left: Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              Showing <strong style={{ color: '#0F172A' }}>
                {sortedUsers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong> to <strong style={{ color: '#0F172A' }}>
                {Math.min(safeCurrentPage * pageSize, sortedUsers.length)}
              </strong> of <strong style={{ color: '#0F172A' }}>{sortedUsers.length}</strong> users
              {sortedUsers.length !== users.length && (
                <span style={{ color: '#94A3B8', marginLeft: '4px' }}>
                  (filtered from {users.length} loaded)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsLeft style={{ width: '15px', height: '15px' }} />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronLeft style={{ width: '15px', height: '15px' }} />
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        padding: '0 6px',
                        color: '#94A3B8',
                        fontSize: '0.875rem',
                        userSelect: 'none'
                      }}
                    >
                      ...
                    </span>
                  );
                }

                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      minWidth: '32px',
                      height: '32px',
                      padding: '0 8px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      backgroundColor: isActive ? '#0F172A' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#334155',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronRight style={{ width: '15px', height: '15px' }} />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: safeCurrentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage === totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ChevronsRight style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          6. MODAL: USER DETAILS & BOOKING HISTORY
      ========================================================================= */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFAFA'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: selectedUser.account_type === 'agent' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                }}>
                  {getAvatarInitials(selectedUser.name, selectedUser.phone_number)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {selectedUser.name}
                    </h2>
                    {renderStatusPill(selectedUser.status)}
                    {renderBadgePill(selectedUser.badge)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8125rem', color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone style={{ width: '13px', height: '13px', color: '#94A3B8' }} />
                      <strong style={{ color: '#0F172A' }}>{selectedUser.phone_number}</strong>
                    </span>
                    <span>•</span>
                    <span>ID #{selectedUser.id}</span>
                    <span>•</span>
                    <span>{selectedUser.account_type === 'agent' ? `Agency: ${selectedUser.agency_name || 'N/A'}` : 'Customer'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    handleOpenEdit(selectedUser);
                  }}
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #BFDBFE',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit3 style={{ width: '14px', height: '14px' }} />
                  Edit Profile
                </button>

                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    backgroundColor: '#F1F5F9',
                    border: 'none',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* User KPI Stats Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Total Spent</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    ₹{Number(selectedUser.total_spent || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Total Trips</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {selectedUser.total_bookings || userBookings.length}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Reward Points</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D97706', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gift style={{ width: '16px', height: '16px' }} />
                    {selectedUser.reward_point}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Spins Available</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>
                    {selectedUser.available_spin}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                
                {/* Contact & Activity Card */}
                <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Profile & Activity
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Last Login / Active:</span>
                      <strong style={{ color: '#059669' }}>
                        {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Registered Since:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.created_at || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Phone:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.phone_number}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Email:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.email || 'Not provided'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>City / Area:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.city || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Pincode:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.pincode || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Banking / UPI details */}
                <div style={{ padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Banking & Settlement Info
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Bank Holder:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.bank_holder_name || 'Not filled'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Account No:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.bank_account_no || 'Not filled'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>IFSC Code:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.bank_ifsc || 'Not filled'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>UPI ID:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedUser.upi_id || 'Not filled'}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bookings History Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Booking History ({userBookings.length})
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Linked via phone number ({selectedUser.phone_number})
                  </span>
                </div>

                {userDetailsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', margin: '0 auto 8px auto', animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
                    <p style={{ margin: 0, fontSize: '0.8125rem' }}>Loading user's trip history...</p>
                  </div>
                ) : userBookings.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                    <Car style={{ width: '32px', height: '32px', color: '#CBD5E1', margin: '0 auto 8px auto' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>No trips booked yet</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>This user has registered but hasn't placed any bookings yet.</p>
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Booking #</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Trip Type & Car</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Route</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Date & Time</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Amount</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>Status</th>
                          <th style={{ padding: '10px 14px', fontWeight: 700, color: '#64748B' }}>OTP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userBookings.map((b) => {
                          const isCancelled = (b.booking_status || '').toLowerCase() === 'cancelled';
                          return (
                            <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                #{b.booking_id || b.id}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#0F172A' }}>{b.trip_type || 'Cab'}</div>
                                <div style={{ fontSize: '11px', color: '#64748B' }}>{b.car_type || 'Standard'}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {b.from_address || 'N/A'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  → {b.to_address || 'Local'}
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div>{b.date || 'N/A'}</div>
                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{b.time || ''}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 800, color: isCancelled ? '#94A3B8' : '#059669', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                  ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                                </div>
                                {b.paid_amount > 0 && (
                                  <div style={{ fontSize: '10px', color: '#64748B' }}>Paid: ₹{b.paid_amount}</div>
                                )}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: isCancelled ? '#FFF1F2' : '#ECFDF5',
                                  color: isCancelled ? '#E11D48' : '#059669',
                                  border: `1px solid ${isCancelled ? '#FECDD3' : '#A7F3D0'}`
                                }}>
                                  {b.booking_status || 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                                {b.otp ? `Start: ${b.otp}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              backgroundColor: '#FAFAFA'
            }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          7. MODAL: EDIT USER PROFILE
      ========================================================================= */}
      {editingUser && (
        <div
          onClick={() => setEditingUser(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '620px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFAFA'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Edit User Profile
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0 0' }}>
                  Update identity, role, reward points, loyalty badge tier, and status.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                
                {/* Readonly Phone banner */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone style={{ width: '16px', height: '16px', color: '#2563EB' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                      {editingUser.phone_number}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>User ID #{editingUser.id}</span>
                </div>

                {/* Name & Email Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="e.g. user@rentox.co.in"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                {/* City & Pincode Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      City / Area
                    </label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      placeholder="e.g. Mumbai, Pune"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Pincode
                    </label>
                    <input
                      type="number"
                      value={editFormData.pincode}
                      onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                      placeholder="e.g. 400001"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                {/* Role & Agency Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Account Role
                    </label>
                    <select
                      value={editFormData.account_type}
                      onChange={(e) => setEditFormData({ ...editFormData, account_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <option value="customer">Rider (Customer)</option>
                      <option value="agent">Agency (Agent)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Agency Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.agency_name}
                      onChange={(e) => setEditFormData({ ...editFormData, agency_name: e.target.value })}
                      placeholder="If agency account"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                {/* Gamification: Points, Spins, Badge */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Reward Points
                    </label>
                    <input
                      type="number"
                      value={editFormData.reward_point}
                      onChange={(e) => setEditFormData({ ...editFormData, reward_point: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Spins Available
                    </label>
                    <input
                      type="number"
                      value={editFormData.available_spin}
                      onChange={(e) => setEditFormData({ ...editFormData, available_spin: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Loyalty Tier
                    </label>
                    <select
                      value={editFormData.badge}
                      onChange={(e) => setEditFormData({ ...editFormData, badge: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                        color: '#0F172A',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <option value="green">Green (Standard)</option>
                      <option value="silver">Silver Tier</option>
                      <option value="gold">Gold Elite</option>
                    </select>
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Account Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                      outline: 'none',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 600
                    }}
                  >
                    <option value="Active">Active (Full access)</option>
                    <option value="Blocked">Blocked (Restricted)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                backgroundColor: '#FAFAFA'
              }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={actionLoading}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
