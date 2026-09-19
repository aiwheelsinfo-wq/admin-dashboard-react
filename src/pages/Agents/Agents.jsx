import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Building2,
  Users,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  XCircle,
  FileText,
  Briefcase
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const Agents = () => {
  const { addToast } = useToast();

  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState(null);
  const [rejectingAgent, setRejectingAgent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Copy helper
  const [copiedPhone, setCopiedPhone] = useState(null);
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    addToast('Phone number copied to clipboard', 'info');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Fetch agents list
  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${endpoints.agentsManagement}?action=get_agents&status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`;
      const res = await axios.get(url, { timeout: 15000 });
      if (res.data && res.data.status === 'success') {
        setAgents(res.data.agents || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        addToast(res.data?.message || 'Failed to fetch agents.', 'error');
      }
    } catch (e) {
      console.error('Error fetching agents:', e);
      addToast('Error connecting to agents API.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, addToast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Handle Approve Agent
  const handleApprove = async (agent) => {
    if (!window.confirm(`Are you sure you want to approve "${agent.agency_name}" (${agent.full_name})?`)) return;

    setActionLoading(true);
    try {
      const res = await axios.post(`${endpoints.agentsManagement}?action=approve_agent`, {
        id: agent.id,
        phone_number: agent.phone_number
      });
      if (res.data && res.data.status === 'success') {
        addToast(`Agent "${agent.agency_name}" approved successfully!`, 'success');
        fetchAgents();
      } else {
        addToast(res.data?.message || 'Failed to approve agent.', 'error');
      }
    } catch (e) {
      console.error('Error approving agent:', e);
      addToast('Failed to approve agent.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Rejection
  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!rejectingAgent) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${endpoints.agentsManagement}?action=reject_agent`, {
        id: rejectingAgent.id,
        phone_number: rejectingAgent.phone_number,
        reason: rejectReason || 'Incomplete or unverified documentation.'
      });
      if (res.data && res.data.status === 'success') {
        addToast(`Agent "${rejectingAgent.agency_name}" application marked as rejected.`, 'info');
        setRejectingAgent(null);
        setRejectReason('');
        fetchAgents();
      } else {
        addToast(res.data?.message || 'Failed to reject agent.', 'error');
      }
    } catch (e) {
      console.error('Error rejecting agent:', e);
      addToast('Failed to reject agent.', 'error');
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '48px' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '9999px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              B2B NETWORK
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>• PARTNER AGENCY VERIFICATION</span>
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Building2 style={{ width: '26px', height: '26px', color: '#F59E0B' }} />
            Agent & Agency Approvals
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px', maxWidth: '680px' }}>
            Review onboarding requests from travel agencies, verify uploaded PAN and business documents, and manage partner approvals.
          </p>
        </div>

        <button
          onClick={fetchAgents}
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
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh List
        </button>
      </div>

      {/* 2. KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Total Agents */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', display: 'block' }}>
              Total Agents
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', display: 'block', marginTop: '4px' }}>
              {stats.total}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Registered agencies</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#F1F5F9',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Pending Approvals */}
        <div style={{
          backgroundColor: stats.pending > 0 ? '#FFFBEB' : '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: stats.pending > 0 ? '1px solid #FCD34D' : '1px solid #E2E8F0',
          boxShadow: stats.pending > 0 ? '0 0 0 3px rgba(245, 158, 11, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400E', display: 'block' }}>
                Pending Review
              </span>
              {stats.pending > 0 && (
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#F59E0B' }}></span>
              )}
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#78350F', display: 'block', marginTop: '4px' }}>
              {stats.pending}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309' }}>Requires verification</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#F59E0B',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Approved Agents */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', display: 'block' }}>
              Approved Agents
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', display: 'block', marginTop: '4px' }}>
              {stats.approved}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669' }}>Active booking access</span>
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
            <CheckCircle2 style={{ width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Rejected Applications */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', display: 'block' }}>
              Rejected
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#DC2626', display: 'block', marginTop: '4px' }}>
              {stats.rejected}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>Requires re-submission</span>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <XCircle style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All', count: stats.total },
            { id: 'pending', label: 'Pending Review', count: stats.pending, highlight: stats.pending > 0 },
            { id: 'approved', label: 'Approved', count: stats.approved },
            { id: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: statusFilter === tab.id ? '#0F172A' : '#F8FAFC',
                color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: statusFilter === tab.id
                  ? '#F59E0B'
                  : tab.highlight
                  ? '#FEF3C7'
                  : '#E2E8F0',
                color: statusFilter === tab.id
                  ? '#0F172A'
                  : tab.highlight
                  ? '#92400E'
                  : '#475569'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#94A3B8'
          }} />
          <input
            type="text"
            placeholder="Search by agency, owner, phone, GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0F172A',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
          />
        </div>
      </div>

      {/* 4. Agents List */}
      {loading ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '4px solid #E2E8F0',
            borderTopColor: '#F59E0B',
            borderRadius: '9999px',
            margin: '0 auto 12px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B' }}>Loading agent records from server...</p>
        </div>
      ) : agents.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#F1F5F9',
            color: '#94A3B8',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Building2 style={{ width: '28px', height: '28px' }} />
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1E293B' }}>No agents found</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
            There are currently no agent applications matching this status.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px 24px',
                border: agent.status === 'pending' ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                background: agent.status === 'pending'
                  ? 'linear-gradient(to right, #FFFDF5, #FFFFFF)'
                  : '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
              }}
            >
              {/* Left Column: Photo & Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '320px', flex: '1 1 auto' }}>
                <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '14px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {agent.profile_photo ? (
                      <img
                        src={agent.profile_photo}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectCover: 'cover', cursor: 'pointer' }}
                        onClick={() => setPreviewDoc({ url: agent.profile_photo, title: `${agent.agency_name} - Photo` })}
                      />
                    ) : (
                      <Briefcase style={{ width: '24px', height: '24px', color: '#94A3B8' }} />
                    )}
                  </div>
                  {agent.status === 'approved' && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '18px',
                      height: '18px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 900,
                      border: '2px solid #FFFFFF'
                    }}>
                      ✓
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                      {agent.agency_name || 'Agency Name'}
                    </h3>

                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: agent.status === 'approved'
                        ? '#ECFDF5'
                        : agent.status === 'rejected'
                        ? '#FEF2F2'
                        : '#FEF3C7',
                      color: agent.status === 'approved'
                        ? '#065F46'
                        : agent.status === 'rejected'
                        ? '#991B1B'
                        : '#92400E',
                      border: agent.status === 'approved'
                        ? '1px solid #A7F3D0'
                        : agent.status === 'rejected'
                        ? '1px solid #FECACA'
                        : '1px solid #FCD34D'
                    }}>
                      {agent.status === 'pending' ? '⏳ PENDING REVIEW' : agent.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8125rem', color: '#475569', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users style={{ width: '13px', height: '13px', color: '#94A3B8' }} />
                      {agent.full_name}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>
                      <Phone style={{ width: '13px', height: '13px', color: '#94A3B8' }} />
                      +91 {agent.phone_number}
                      <button
                        onClick={() => copyToClipboard(agent.phone_number)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94A3B8', display: 'flex' }}
                        title="Copy phone"
                      >
                        {copiedPhone === agent.phone_number ? (
                          <Check style={{ width: '12px', height: '12px', color: '#10B981' }} />
                        ) : (
                          <Copy style={{ width: '12px', height: '12px' }} />
                        )}
                      </button>
                    </span>

                    {agent.gst_number && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748B',
                        backgroundColor: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        GST: {agent.gst_number}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748B' }}>
                    <MapPin style={{ width: '12px', height: '12px', color: '#94A3B8', flexShrink: 0 }} />
                    <span style={{ maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.address}
                    </span>
                  </div>

                  {agent.rejection_reason && agent.status === 'rejected' && (
                    <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '2px' }}>
                      <strong>Rejection Reason:</strong> {agent.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Documents & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                
                {/* Documents Button */}
                {agent.pan_doc ? (
                  <button
                    onClick={() => setPreviewDoc({ url: agent.pan_doc, title: `${agent.agency_name} - PAN Document` })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    <FileText style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                    View PAN / Doc
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No doc</span>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {agent.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(agent)}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          padding: '9px 16px',
                          borderRadius: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                        Approve Agent
                      </button>

                      <button
                        onClick={() => {
                          setRejectingAgent(agent);
                          setRejectReason('');
                        }}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <XCircle style={{ width: '14px', height: '14px' }} />
                        Reject
                      </button>
                    </>
                  ) : agent.status === 'approved' ? (
                    <button
                      onClick={() => {
                        setRejectingAgent(agent);
                        setRejectReason('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 14px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Revoke approval"
                    >
                      <XCircle style={{ width: '13px', height: '13px' }} />
                      Revoke Approval
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(agent)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0F172A',
                        color: '#FFFFFF',
                        padding: '9px 16px',
                        borderRadius: '10px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                      Re-Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Document Preview Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>{previewDoc.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink style={{ width: '12px', height: '12px' }} /> Open External
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    backgroundColor: '#F1F5F9',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B'
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>

            <div style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '60vh'
            }}>
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} title="PDF Viewer" style={{ width: '100%', height: '500px', border: 'none' }} />
              ) : (
                <img src={previewDoc.url} alt="Document" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Rejection Modal */}
      {rejectingAgent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <AlertTriangle style={{ width: '22px', height: '22px' }} />
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              Reject Agent Application
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              Please state why "{rejectingAgent.agency_name}" was rejected. They will be notified and given the option to re-upload.
            </p>

            <form onSubmit={handleSubmitReject} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['PAN number unclear', 'Address proof mismatch', 'Invalid GSTIN', 'Non-travel business'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#F1F5F9',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      color: '#475569'
                    }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={3}
                placeholder="Enter rejection notes..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRejectingAgent(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Saving...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
