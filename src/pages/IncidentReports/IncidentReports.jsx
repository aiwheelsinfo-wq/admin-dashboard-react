import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Phone,
  User,
  Car,
  MapPin,
  Calendar,
  X,
  FileText,
  UserX,
  ShieldCheck,
  ChevronRight,
  Filter,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const IncidentReports = () => {
  const { addToast } = useToast();

  const [reports, setReports] = useState([]);
  const [kpi, setKpi] = useState({
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Modal State
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [adminActionType, setAdminActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [blockDriver, setBlockDriver] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchIncidentReports();
  }, [statusFilter, severityFilter]);

  const fetchIncidentReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await axios.get(`${endpoints.incidentReports}?${params.toString()}`);
      if (res.data && res.data.success) {
        setReports(res.data.reports || []);
        if (res.data.kpi) {
          setKpi(res.data.kpi);
        }
      } else {
        addToast(res.data?.message || 'Failed to fetch incident reports', 'error');
      }
    } catch (err) {
      console.error('Error fetching incident reports:', err);
      addToast('Network error while connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (incident) => {
    setSelectedIncident(incident);
    setActionStatus(incident.status || 'Pending');
    setAdminActionType(incident.admin_action || '');
    setAdminNotes(incident.admin_notes || '');
    setBlockDriver(false);
  };

  const handleCloseActionModal = () => {
    setSelectedIncident(null);
    setActionStatus('');
    setAdminActionType('');
    setAdminNotes('');
    setBlockDriver(false);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setSubmittingAction(true);
    try {
      const body = {
        id: selectedIncident.id,
        ticket_no: selectedIncident.ticket_no,
        status: actionStatus,
        admin_action: adminActionType,
        admin_notes: adminNotes,
        block_driver: blockDriver
      };

      const res = await axios.post(endpoints.updateIncidentStatus, body, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data && res.data.success) {
        addToast(
          res.data.message || 'Incident status and action updated successfully',
          'success'
        );
        handleCloseActionModal();
        fetchIncidentReports();
      } else {
        addToast(res.data?.message || 'Failed to update incident', 'error');
      }
    } catch (err) {
      console.error('Error updating incident:', err);
      addToast('Server error while saving resolution', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Client-side search filtering
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) => {
      return (
        (r.ticket_no || '').toLowerCase().includes(q) ||
        (r.booking_id || '').toLowerCase().includes(q) ||
        (r.customer_phone || '').toLowerCase().includes(q) ||
        (r.driver_name || '').toLowerCase().includes(q) ||
        (r.incident_type || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  const renderSeverityBadge = (severity) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    let border = '#CBD5E1';

    if (severity === 'Critical') {
      bg = '#FEF2F2';
      color = '#DC2626';
      border = '#FECACA';
    } else if (severity === 'High') {
      bg = '#FFF7ED';
      color = '#EA580C';
      border = '#FED7AA';
    } else if (severity === 'Medium') {
      bg = '#EFF6FF';
      color = '#2563EB';
      border = '#BFDBFE';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '0.6875rem',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap'
        }}
      >
        {severity === 'Critical' && <AlertOctagon style={{ width: '11px', height: '11px' }} />}
        {severity === 'High' && <AlertTriangle style={{ width: '11px', height: '11px' }} />}
        {severity}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    let bg = '#F1F5F9';
    let color = '#475569';
    let border = '#E2E8F0';

    if (status === 'Pending') {
      bg = '#FFFBEB';
      color = '#D97706';
      border = '#FDE68A';
    } else if (status === 'Investigating') {
      bg = '#EEF2FF';
      color = '#4F46E5';
      border = '#C7D2FE';
    } else if (status === 'Resolved') {
      bg = '#ECFDF5';
      color = '#059669';
      border = '#A7F3D0';
    } else if (status === 'Dismissed') {
      bg = '#F8FAFC';
      color = '#64748B';
      border = '#E2E8F0';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap'
        }}
      >
        {status === 'Pending' && <Clock style={{ width: '12px', height: '12px' }} />}
        {status === 'Investigating' && <ShieldAlert style={{ width: '12px', height: '12px' }} />}
        {status === 'Resolved' && <CheckCircle2 style={{ width: '12px', height: '12px' }} />}
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── 1. Page Header & Actions ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
              Management & Security
            </span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#DC2626' }}>
              Safety & Incident Reports
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}
            >
              <ShieldAlert style={{ width: '22px', height: '22px' }} />
            </span>
            Driver & Safety Incident Reports
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Inspect passenger complaints, safety hazards, and enforce driver disciplinary actions across the fleet.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchIncidentReports}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw
              style={{
                width: '15px',
                height: '15px',
                color: '#64748B',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top KPI Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Total Incidents */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
              Total Incidents
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {kpi.total}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              All tickets logged
            </span>
          </div>
        </div>

        {/* Pending Review */}
        <div
          style={{
            backgroundColor: '#FFFDF5',
            border: '1px solid #FED7AA',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C2410C', letterSpacing: '0.5px' }}>
              Pending Review
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#EA580C', lineHeight: 1.1 }}>
              {kpi.pending}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#C2410C', marginTop: '4px', display: 'block' }}>
              Requires immediate action
            </span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div
          style={{
            backgroundColor: '#FFF9F9',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#DC2626', letterSpacing: '0.5px' }}>
              Critical Alerts
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertOctagon style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#DC2626', lineHeight: 1.1 }}>
              {kpi.critical}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '4px', display: 'block' }}>
              High hazard or harassment
            </span>
          </div>
        </div>

        {/* Resolved Cases */}
        <div
          style={{
            backgroundColor: '#F7FEFA',
            border: '1px solid #A7F3D0',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.5px' }}>
              Resolved Cases
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
              {kpi.resolved}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px', display: 'block' }}>
              Closed & settled cases
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '520px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#94A3B8'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ticket #, Booking ID, Phone, Driver..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '0.875rem',
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>

          {/* Severity Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#64748B' }}>
              Severity:
            </span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid #F1F5F9'
          }}
        >
          {[
            { id: 'all', label: `All Incidents (${kpi.total})` },
            { id: 'Pending', label: `Pending (${kpi.pending})` },
            { id: 'Investigating', label: `Investigating (${kpi.investigating})` },
            { id: 'Resolved', label: `Resolved (${kpi.resolved})` },
            { id: 'Dismissed', label: 'Dismissed' }
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  backgroundColor: isActive ? '#0F172A' : '#F8FAFC',
                  color: isActive ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Incidents Table ── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw
              style={{
                width: '32px',
                height: '32px',
                margin: '0 auto 12px auto',
                color: '#F59E0B',
                animation: 'spin 1s linear infinite'
              }}
            />
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1E293B' }}>
              Loading incident records...
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <ShieldCheck style={{ width: '28px', height: '28px' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              No Incident Reports Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              {searchQuery || statusFilter !== 'all' || severityFilter !== 'all'
                ? 'No tickets match your active filter criteria. Try resetting your search or filters.'
                : 'Great news! There are currently no customer safety disturbance complaints recorded.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ticket & Date
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Booking & Route
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Passenger Phone
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Reported Driver
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Incident Issue
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Severity
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  return (
                    <tr
                      key={report.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAFBFD')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      {/* Ticket & Date */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D97706', fontSize: '0.875rem' }}>
                          {report.ticket_no}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                          {report.created_at || 'Just now'}
                        </div>
                      </td>

                      {/* Booking & Route */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>
                          #{report.booking_id}
                        </div>
                        {report.from_address && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#64748B',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}
                            title={`${report.from_address} ➔ ${report.to_address || ''}`}
                          >
                            {report.from_address} {report.to_address ? `➔ ${report.to_address}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Passenger Phone */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <a
                          href={`tel:${report.customer_phone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: 700,
                            color: '#1E293B',
                            textDecoration: 'none',
                            fontSize: '0.8125rem'
                          }}
                        >
                          <Phone style={{ width: '13px', height: '13px', color: '#94A3B8' }} />
                          {report.customer_phone}
                        </a>
                      </td>

                      {/* Reported Driver */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>
                          {report.driver_name || 'Driver #' + (report.driver_id || 'N/A')}
                        </div>
                        {report.driver_phone && (
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px' }}>
                            {report.driver_phone}
                          </div>
                        )}
                        {report.driver_current_status === 'inactive' && (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              marginTop: '2px'
                            }}
                          >
                            BLOCKED
                          </span>
                        )}
                      </td>

                      {/* Incident Issue */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8125rem' }}>
                          {report.incident_type}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }}
                          title={report.description}
                        >
                          "{report.description}"
                        </div>
                      </td>

                      {/* Severity */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        {renderSeverityBadge(report.severity)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                        {renderStatusBadge(report.status)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenActionModal(report)}
                          style={{
                            padding: '7px 14px',
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>Investigate</span>
                          <ChevronRight style={{ width: '13px', height: '13px' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Investigation & Resolution Modal ── */}
      {selectedIncident && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 99999
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                backgroundColor: '#FFFFFF',
                zIndex: 2
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldAlert style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Ticket {selectedIncident.ticket_no}
                    </h3>
                    {renderSeverityBadge(selectedIncident.severity)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                    Booking #{selectedIncident.booking_id} · Reported {selectedIncident.created_at}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCloseActionModal}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitResolution} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Customer Statement Highlight Box */}
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px' }} />
                  Passenger Complaint: {selectedIncident.incident_type}
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#7F1D1D', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{selectedIncident.description}"
                </p>
              </div>

              {/* Passenger & Driver Contacts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Passenger */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Complainant Passenger
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                      {selectedIncident.customer_phone}
                    </span>
                    <a
                      href={`tel:${selectedIncident.customer_phone}`}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Phone style={{ width: '11px', height: '11px' }} /> Call
                    </a>
                  </div>
                </div>

                {/* Driver */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Reported Driver
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                        {selectedIncident.driver_name || 'Driver #' + selectedIncident.driver_id}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        {selectedIncident.driver_phone || 'ID: ' + selectedIncident.driver_id}
                      </div>
                    </div>
                    {selectedIncident.driver_phone && (
                      <a
                        href={`tel:${selectedIncident.driver_phone}`}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Phone style={{ width: '11px', height: '11px' }} /> Call
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Route Details */}
              {selectedIncident.from_address && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.8125rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MapPin style={{ width: '16px', height: '16px', color: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>Route:</strong> {selectedIncident.from_address} {selectedIncident.to_address ? `➔ ${selectedIncident.to_address}` : ''}
                  </span>
                </div>
              )}

              {/* Compliance & Resolution Actions */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0F172A', letterSpacing: '0.5px' }}>
                  Compliance & Resolution Actions
                </span>

                {/* Status Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Incident Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Investigating">Investigating / Called Parties</option>
                    <option value="Resolved">Resolved & Closed</option>
                    <option value="Dismissed">Dismissed (No Fault / False Claim)</option>
                  </select>
                </div>

                {/* Action Taken */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Action Taken
                  </label>
                  <select
                    value={adminActionType}
                    onChange={(e) => {
                      setAdminActionType(e.target.value);
                      if (e.target.value.includes('Block') || e.target.value.includes('Suspension')) {
                        setBlockDriver(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Disciplinary Action...</option>
                    <option value="Official Warning Issued">Official Warning Notice Issued</option>
                    <option value="Temporary Suspension (3 Days)">Temporary Suspension (3 Days)</option>
                    <option value="Permanent Blacklist / Block">Permanent Blacklist / Block Driver</option>
                    <option value="Fare Refund Issued to Customer">Fare Refund Issued to Customer</option>
                    <option value="Goodwill Credit Added to Customer">Goodwill Credit Added to Customer</option>
                    <option value="Driver Retraining / Counseling">Driver Retraining / Counseling Completed</option>
                    <option value="Mutual Settlement">Mutual Settlement / Misunderstanding</option>
                    <option value="False Complaint Dismissed">False Complaint Dismissed</option>
                  </select>
                </div>

                {/* Block Driver One-Click Toggle */}
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    id="blockDriverBox"
                    checked={blockDriver}
                    onChange={(e) => setBlockDriver(e.target.checked)}
                    style={{
                      marginTop: '3px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#DC2626'
                    }}
                  />
                  <label htmlFor="blockDriverBox" style={{ cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991B1B', display: 'block' }}>
                      Block Driver Account Immediately
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#B91C1C', display: 'block', marginTop: '2px', lineHeight: 1.4 }}>
                      Check this to immediately deactivate driver's access across the Rentox Driver App and prevent dispatch of upcoming rides.
                    </span>
                  </label>
                </div>

                {/* Admin Internal Investigation Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Admin Investigation Notes
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter notes on phone call with customer, driver explanation, settlement terms, or follow-up notes..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: '#F59E0B',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
                  }}
                >
                  {submittingAction && (
                    <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  )}
                  <span>Save Resolution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReports;
