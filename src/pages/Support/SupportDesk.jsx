import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  Send,
  User,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCheck,
  Building2,
  Phone,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

export default function SupportDesk() {
  const { addToast } = useToast();

  // State
  const [threads, setThreads] = useState([]);
  const [activePhone, setActivePhone] = useState(null);
  const [activeVendor, setActiveVendor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'blocked'
  const [previewImage, setPreviewImage] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch Threads
  const fetchThreads = async (silent = false) => {
    if (!silent) setIsLoadingThreads(true);
    try {
      const res = await fetch(`${endpoints.supportChat}?action=get_threads`);
      const data = await res.json();
      if (data.status === 'success') {
        const list = data.threads || [];
        setThreads(list);
        if (!activePhone && list.length > 0) {
          setActivePhone(list[0].vendor_phone);
        }
      }
    } catch (err) {
      console.error('Failed to fetch support threads:', err);
    } finally {
      if (!silent) setIsLoadingThreads(false);
    }
  };

  // 2. Fetch Messages for active thread
  const fetchMessages = async (phone, silent = false) => {
    if (!phone) return;
    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await fetch(`${endpoints.supportChat}?action=get_messages&vendor_phone=${phone}&reader=admin`);
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(data.messages || []);
        if (data.vendor) {
          setActiveVendor(data.vendor);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  // Initial load & 5-second polling
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads(true);
      if (activePhone) {
        fetchMessages(activePhone, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activePhone]);

  // When activePhone changes, load messages
  useEffect(() => {
    if (activePhone) {
      fetchMessages(activePhone);
    }
  }, [activePhone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.vendor_name || '').toLowerCase().includes(q) ||
        (t.vendor_phone || '').includes(q) ||
        (t.agency_name || '').toLowerCase().includes(q) ||
        (t.last_message || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === 'unread') return t.unread_count > 0;
      if (filterType === 'blocked') return t.vendor_status === 'blocked';
      return true;
    });
  }, [threads, searchQuery, filterType]);

  // Send Reply
  const handleSendReply = async (customText = null) => {
    const textToSend = customText || replyText.trim();
    if (!textToSend || !activePhone || isSending) return;

    setIsSending(true);
    if (!customText) setReplyText('');

    try {
      const res = await fetch(`${endpoints.supportChat}?action=send_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_phone: activePhone,
          sender_type: 'admin',
          sender_name: 'Rentox Support Desk',
          message: textToSend
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setMessages(prev => [...prev, data.data]);
        fetchThreads(true);
      } else {
        addToast(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      addToast('Network error while sending reply', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Vendor Block / Unblock directly from Chat
  const handleToggleBlock = async (newStatus) => {
    if (!activePhone || isActionLoading) return;
    setIsActionLoading(true);

    try {
      const res = await fetch(endpoints.vendorsManagement, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_vendor_block',
          vendor_phone: activePhone,
          status: newStatus,
          block_reason: newStatus === 'active' ? '' : 'Administrative suspension via Helpdesk'
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast(
          newStatus === 'active' ? 'Partner has been successfully unblocked!' : 'Partner has been blocked.',
          'success'
        );
        fetchMessages(activePhone, true);
        fetchThreads(true);

        if (newStatus === 'active') {
          handleSendReply('Your account has been verified and successfully re-activated. You can now go online and accept bookings!');
        }
      } else {
        addToast(data.message || 'Failed to update partner status', 'error');
      }
    } catch (err) {
      addToast('Network error while updating partner status', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const quickReplies = [
    'Payment received. Your account has been re-activated!',
    'Please send the UPI transaction screenshot or UTR number.',
    'Your dispute is under review with accounts team.',
    'Please re-upload your valid vehicle documents.'
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 90px)',
      backgroundColor: '#F8FAFC',
      padding: '16px 20px',
      gap: '14px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR                                         */}
      {/* ========================================================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #FDE68A'
          }}>
            <MessageSquare style={{ width: '22px', height: '22px', color: '#D97706' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Partner Support & Dispute Helpdesk
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                Live Sync Active
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
              Resolve partner disputes, verify commission receipts, and re-activate suspended accounts in real-time
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchThreads();
            if (activePhone) fetchMessages(activePhone);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E2E8F0'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
        >
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Refresh Feed
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN SPLIT DESK (LEFT THREADS / RIGHT CHAT)            */}
      {/* ========================================================= */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '14px',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* ======================================================= */}
        {/* LEFT COLUMN: CONVERSATION THREADS                       */}
        {/* ======================================================= */}
        <div style={{
          width: '360px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          flexShrink: 0
        }}>
          {/* Search & Filter Toolbar */}
          <div style={{ padding: '14px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '15px',
                height: '15px',
                color: '#94A3B8'
              }} />
              <input
                type="text"
                placeholder="Search vendor, phone, agency..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 12px 8px 32px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  color: '#0F172A',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: `All (${threads.length})` },
                { id: 'unread', label: `Unread (${threads.filter(t => t.unread_count > 0).length})` },
                { id: 'blocked', label: `Blocked (${threads.filter(t => t.vendor_status === 'blocked').length})` }
              ].map(tab => {
                const isSel = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isSel ? '#0F172A' : '#F1F5F9',
                      color: isSel ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Threads List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoadingThreads && threads.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: '0.8125rem', color: '#94A3B8' }}>
                Loading conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: '0.8125rem', color: '#94A3B8' }}>
                No partner conversations match filter.
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isActive = thread.vendor_phone === activePhone;
                const isBlocked = thread.vendor_status === 'blocked';

                return (
                  <div
                    key={thread.vendor_phone}
                    onClick={() => setActivePhone(thread.vendor_phone)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: isActive ? '#FEF3C7' : '#FFFFFF',
                      borderLeft: isActive ? '4px solid #D97706' : '4px solid transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isBlocked ? '#FEE2E2' : '#E2E8F0',
                          color: isBlocked ? '#DC2626' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          {thread.vendor_name ? thread.vendor_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {thread.vendor_name || 'Transport Partner'}
                          </h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                            {thread.vendor_phone}
                          </p>
                        </div>
                      </div>

                      {/* Status & Unread Count */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                        {isBlocked ? (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: '1px solid #FECACA'
                          }}>
                            BLOCKED
                          </span>
                        ) : (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            backgroundColor: '#ECFDF5',
                            color: '#065F46'
                          }}>
                            ACTIVE
                          </span>
                        )}

                        {thread.unread_count > 0 && (
                          <span style={{
                            minWidth: '18px',
                            height: '18px',
                            padding: '0 5px',
                            borderRadius: '9999px',
                            backgroundColor: '#D97706',
                            color: '#FFFFFF',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snippet */}
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                      <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '230px' }}>
                        {thread.has_attachment && <strong style={{ color: '#D97706' }}>[Receipt] </strong>}
                        {thread.last_message || 'No messages yet'}
                      </p>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        {thread.last_created_at ? thread.last_created_at.split(' ')[1]?.slice(0, 5) : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: ACTIVE CHAT & DISPUTE WORKSPACE           */}
        {/* ======================================================= */}
        <div style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {activePhone ? (
            <>
              {/* Workspace Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: activeVendor?.status === 'blocked' ? '#FEE2E2' : '#FEF3C7',
                    color: activeVendor?.status === 'blocked' ? '#DC2626' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    border: activeVendor?.status === 'blocked' ? '1px solid #FECACA' : '1px solid #FDE68A'
                  }}>
                    {activeVendor?.name ? activeVendor.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
                        {activeVendor?.name || 'Transport Partner'}
                      </h3>
                      {activeVendor?.status === 'blocked' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: '1px solid #FECACA'
                        }}>
                          <ShieldAlert style={{ width: '12px', height: '12px' }} />
                          Suspended Account
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#ECFDF5',
                          color: '#065F46'
                        }}>
                          <ShieldCheck style={{ width: '12px', height: '12px' }} />
                          Active Partner
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activePhone}</span>
                      {activeVendor?.agency_name && (
                        <span> • Agency: <strong>{activeVendor.agency_name}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Instant Unblock / Block Action Button */}
                <div>
                  {activeVendor?.status === 'blocked' ? (
                    <button
                      onClick={() => handleToggleBlock('active')}
                      disabled={isActionLoading}
                      style={{
                        padding: '9px 18px',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: isActionLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#059669'}
                    >
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      {isActionLoading ? 'Processing...' : 'Unblock Partner Now'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBlock('blocked')}
                      disabled={isActionLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FFFFFF',
                        color: '#DC2626',
                        borderRadius: '8px',
                        border: '1px solid #FCA5A5',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: isActionLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <XCircle style={{ width: '15px', height: '15px' }} />
                      Block Account
                    </button>
                  )}
                </div>
              </div>

              {/* Suspension Reason Warning Bar if blocked */}
              {activeVendor?.status === 'blocked' && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  borderBottom: '1px solid #FEE2E2',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  color: '#991B1B',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle style={{ width: '16px', height: '16px', color: '#DC2626' }} />
                    <span>
                      <strong>Account Suspension Reason:</strong>{' '}
                      {activeVendor.block_reason || 'Administrative Default / Commission Overdue'}
                    </span>
                  </div>
                  {activeVendor.blocked_at && (
                    <span style={{ fontSize: '0.75rem', color: '#B91C1C' }}>
                      Blocked on: {activeVendor.blocked_at}
                    </span>
                  )}
                </div>
              )}

              {/* Message History Feed */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {isLoadingMessages && messages.length === 0 ? (
                  <div style={{ margin: 'auto', fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#94A3B8' }}>
                    <MessageSquare style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.8125rem' }}>No messages yet with this partner.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isAdmin = msg.sender_type === 'admin';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isAdmin ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '4px', padding: '0 4px' }}>
                          <strong>{isAdmin ? 'Rentox Helpdesk' : activeVendor?.name || 'Partner'}</strong> •{' '}
                          {msg.created_at ? msg.created_at.split(' ')[1]?.slice(0, 5) : ''}
                        </div>

                        <div style={{
                          maxWidth: '65%',
                          padding: '12px 16px',
                          borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: isAdmin ? '#0F172A' : '#FFFFFF',
                          color: isAdmin ? '#FFFFFF' : '#0F172A',
                          border: isAdmin ? 'none' : '1px solid #E2E8F0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          fontSize: '0.84rem',
                          lineHeight: 1.45
                        }}>
                          {/* Image receipt if present */}
                          {msg.attachment_url && (
                            <div style={{ marginBottom: '8px' }}>
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                onClick={() => setPreviewImage(msg.attachment_url)}
                                style={{
                                  borderRadius: '8px',
                                  maxHeight: '180px',
                                  width: '100%',
                                  objectFit: 'cover',
                                  cursor: 'pointer'
                                }}
                              />
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.6875rem', color: isAdmin ? '#94A3B8' : '#64748B' }}>
                                Tap image to view full receipt
                              </p>
                            </div>
                          )}

                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Templates Bar */}
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#F1F5F9',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles style={{ width: '13px', height: '13px', color: '#D97706' }} />
                  Quick:
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendReply(reply)}
                    disabled={isSending}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#FEF3C7';
                      e.currentTarget.style.borderColor = '#F59E0B';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Reply Input Bar */}
              <div style={{
                padding: '14px 20px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0
              }}>
                <input
                  type="text"
                  placeholder={`Write reply to ${activeVendor?.name || 'Partner'}... (Press Enter to send)`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />

                <button
                  onClick={() => handleSendReply()}
                  disabled={isSending || !replyText.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: isSending || !replyText.trim() ? '#CBD5E1' : '#F59E0B',
                    color: '#111827',
                    fontWeight: 700,
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.84rem',
                    cursor: isSending || !replyText.trim() ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!isSending && replyText.trim()) e.currentTarget.style.backgroundColor = '#D97706';
                  }}
                  onMouseLeave={e => {
                    if (!isSending && replyText.trim()) e.currentTarget.style.backgroundColor = '#F59E0B';
                  }}
                >
                  <Send style={{ width: '15px', height: '15px' }} />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
              <MessageSquare style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', opacity: 0.3 }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#334155' }}>No Conversation Selected</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem' }}>Select a partner thread from the left sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }}>
            <img src={previewImage} alt="Payment Receipt" style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: '12px' }} />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
