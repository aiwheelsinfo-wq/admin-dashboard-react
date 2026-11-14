import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  PhoneCall,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  User,
  DollarSign,
  CheckCircle2,
  Volume2,
  VolumeX,
  Trash2,
  X,
  Filter,
  Car
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useToast } from '../../context/ToastContext';

// Helper to normalize phone numbers to their last 10 digits for accurate matching
const normalizePhone = (phone) => (phone || '').replace(/\D/g, '').slice(-10);

// Helper for status badge colors
const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) {
    return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
  }
  if (s.includes('cancel') || s.includes('declin')) {
    return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
  }
  if (s.includes('assign') || s.includes('accept') || s.includes('progress') || s.includes('transit')) {
    return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  }
  return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' }; // Pending / Default
};

// Play audio alert chime using Web Audio API (100% browser supported, no external audio files needed)
const playChimeAlert = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 2-tone melodic chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

const SpecificBookings = () => {
  const { addToast } = useToast();

  // Monitored target phone number state
  const [targetPhone, setTargetPhone] = useState(() => {
    return localStorage.getItem('rentox_monitored_phone') || '';
  });
  const [inputPhone, setInputPhone] = useState(() => {
    return localStorage.getItem('rentox_monitored_phone') || '';
  });

  // Sound alert enabled/disabled toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Bookings and stats state
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inspectBooking, setInspectBooking] = useState(null);

  // Filters & Search within this number's bookings
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTripType, setFilterTripType] = useState('All');

  // Ref to track latest booking ID to detect incoming new orders
  const latestSeenIdRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Fetch bookings from AWS backend
  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        `${endpoints.bookingsManagement}?action=get_all_bookings&limit=500`,
        { timeout: 12000 }
      );

      if (res.data && res.data.status === 'success') {
        const bookingsList = res.data.bookings || [];
        setAllBookings(bookingsList);

        // Check for new bookings matching target number if target phone is set
        const normTarget = normalizePhone(targetPhone);
        if (normTarget.length >= 10) {
          const matchingBookings = bookingsList.filter((b) => {
            const cp = normalizePhone(b.customer_phone);
            const pp = normalizePhone(b.passenger_phone);
            return cp === normTarget || pp === normTarget;
          });

          if (matchingBookings.length > 0) {
            const currentHighestId = Math.max(...matchingBookings.map((b) => b.id));

            if (!isInitialLoadRef.current && latestSeenIdRef.current !== null) {
              if (currentHighestId > latestSeenIdRef.current) {
                // NEW BOOKING DETECTED FOR MONITORED NUMBER!
                if (soundEnabled) playChimeAlert();
                addToast(
                  `🚨 New Booking #${currentHighestId} received for ${targetPhone}!`,
                  'success'
                );
              }
            }
            latestSeenIdRef.current = currentHighestId;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      if (!silent) {
        addToast('Unable to load bookings from AWS.', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
      isInitialLoadRef.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings(false);

    // Auto-polling every 12 seconds in the background
    const timer = setInterval(() => {
      fetchBookings(true);
    }, 12000);

    return () => clearInterval(timer);
  }, [targetPhone]);

  // Handle setting a new monitored phone number
  const handleSavePhone = (e) => {
    e?.preventDefault();
    const clean = inputPhone.trim();
    if (!clean) {
      addToast('Please enter a valid phone number.', 'error');
      return;
    }
    const digits = normalizePhone(clean);
    if (digits.length < 10) {
      addToast('Please enter at least 10 digits for the phone number.', 'error');
      return;
    }

    setTargetPhone(clean);
    localStorage.setItem('rentox_monitored_phone', clean);
    addToast(`Now actively monitoring bookings for: ${clean}`, 'success');
  };

  // Clear target phone number
  const handleClearPhone = () => {
    setTargetPhone('');
    setInputPhone('');
    localStorage.removeItem('rentox_monitored_phone');
    latestSeenIdRef.current = null;
    addToast('Target phone number cleared. Showing full booking list.', 'info');
  };

  // Filter bookings strictly for the target phone number
  const monitoredBookings = useMemo(() => {
    const normTarget = normalizePhone(targetPhone);
    if (!normTarget || normTarget.length < 10) {
      return [];
    }
    return allBookings.filter((b) => {
      const cp = normalizePhone(b.customer_phone);
      const pp = normalizePhone(b.passenger_phone);
      return cp === normTarget || pp === normTarget;
    });
  }, [allBookings, targetPhone]);

  // Compute stats for monitored phone number
  const stats = useMemo(() => {
    const total = monitoredBookings.length;
    let revenue = 0;
    let active = 0;
    let completed = 0;

    monitoredBookings.forEach((b) => {
      revenue += Number(b.total_amount) || 0;
      const status = (b.booking_status || '').toLowerCase();
      if (status.includes('complete')) {
        completed += 1;
      } else if (!status.includes('cancel') && !status.includes('declin')) {
        active += 1;
      }
    });

    return { total, revenue, active, completed };
  }, [monitoredBookings]);

  // Secondary search & status filters on top of the monitored list
  const filteredList = useMemo(() => {
    return monitoredBookings.filter((b) => {
      const status = (b.booking_status || '').toLowerCase();
      const trip = (b.trip_type || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();

      const matchesStatus = filterStatus === 'All' || status === filterStatus.toLowerCase();
      const matchesTripType = filterTripType === 'All' || trip === filterTripType.toLowerCase();
      const matchesSearch =
        !q ||
        String(b.id).includes(q) ||
        String(b.invoice_no || '').toLowerCase().includes(q) ||
        (b.from_address || '').toLowerCase().includes(q) ||
        (b.to_address || '').toLowerCase().includes(q) ||
        (b.car_type || '').toLowerCase().includes(q);

      return matchesStatus && matchesTripType && matchesSearch;
    });
  }, [monitoredBookings, searchTerm, filterStatus, filterTripType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* 1. Header with Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <PhoneCall style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Specific Number Monitor
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Surveillance and booking tracking filtered exclusively for a designated phone number
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: soundEnabled ? '#ECFDF5' : '#F8FAFC',
              color: soundEnabled ? '#059669' : '#64748B',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {soundEnabled ? <Volume2 style={{ width: '16px', height: '16px' }} /> : <VolumeX style={{ width: '16px', height: '16px' }} />}
            <span>{soundEnabled ? 'Alert Sound ON' : 'Muted'}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={() => fetchBookings(false)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* 2. Target Phone Setup Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        border: targetPhone ? '2px solid #3B82F6' : '1px dashed #CBD5E1',
        boxShadow: targetPhone ? '0 4px 12px rgba(59, 130, 246, 0.08)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
              Target Number Configuration
            </span>
            {targetPhone ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid #A7F3D0'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669', animation: 'pulse 1.5s infinite' }}></span>
                Actively Monitoring: <strong>{targetPhone}</strong>
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EA580C', backgroundColor: '#FFF7ED', padding: '3px 10px', borderRadius: '999px' }}>
                No Number Set (Enter Below)
              </span>
            )}
          </div>

          {targetPhone && (
            <button
              onClick={handleClearPhone}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Trash2 style={{ width: '13px', height: '13px' }} />
              <span>Clear Target Number</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSavePhone} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <div style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: 700
            }}>
              <PhoneCall style={{ width: '16px', height: '16px', color: '#3B82F6' }} />
              <span>+91</span>
            </div>
            <input
              type="text"
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              placeholder="Enter customer / agent phone number (e.g. 9847267465)..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 70px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            <span>Lock Target Number</span>
          </button>
        </form>
      </div>

      {/* 3. Metric KPI Cards for Target Number */}
      {targetPhone && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Bookings</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0F172A', marginTop: '6px' }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Recorded for {targetPhone}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Gross Revenue / Spend</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563EB', marginTop: '6px' }}>₹{stats.revenue.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Cumulative customer fare</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active / Pending</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#D97706', marginTop: '6px' }}>{stats.active}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Awaiting or in-transit</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed Trips</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>{stats.completed}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Fulfilled journeys</div>
          </div>
        </div>
      )}

      {/* 4. Bookings Filter & Table */}
      {!targetPhone ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #E2E8F0'
        }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: '#94A3B8', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
            No Target Phone Number Configured
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '440px', margin: '0 auto' }}>
            Enter a customer or agent phone number in the box above to filter and monitor all bookings for that specific person.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {/* Table Header Filter Bar */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px' }}>
              <Search style={{ width: '16px', height: '16px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search route, car type, invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0F172A',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={filterTripType}
                onChange={(e) => setFilterTripType(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  outline: 'none'
                }}
              >
                <option value="All">All Trip Types</option>
                <option value="One-way">One-Way</option>
                <option value="Round-Trip">Round-Trip</option>
                <option value="Local-taxi">Local Taxi</option>
                <option value="Local-Duty">Hourly Rental</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Booking / Bill</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Trip & Vehicle</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Route</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Schedule</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Fare</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
                      <AlertCircle style={{ width: '32px', height: '32px', margin: '0 auto 10px auto', color: '#CBD5E1' }} />
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#475569' }}>
                        No bookings found for this specific number.
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
                        When a customer books with {targetPhone}, it will appear here automatically in real-time.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((b) => {
                    const badge = getStatusBadge(b.booking_status);
                    return (
                      <tr
                        key={b.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        {/* Booking ID */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
                            #{b.id}
                          </div>
                          {b.invoice_no && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366F1' }}>
                              Bill #{b.invoice_no}
                            </span>
                          )}
                        </td>

                        {/* Customer Contact */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                            {b.customer_name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            📞 {b.customer_phone || targetPhone}
                          </div>
                        </td>

                        {/* Trip & Vehicle */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                            {b.car_type || 'Car'}
                          </div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            color: '#2563EB',
                            textTransform: 'uppercase'
                          }}>
                            {b.trip_type}
                          </span>
                        </td>

                        {/* Route */}
                        <td style={{ padding: '16px 20px', maxWidth: '240px' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.from_address || '—'}
                          </div>
                          {b.to_address && (
                            <div style={{ fontSize: '0.8125rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              ➔ {b.to_address}
                            </div>
                          )}
                          {b.distance > 0 && (
                            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                              {b.distance} KM
                            </div>
                          )}
                        </td>

                        {/* Schedule */}
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>
                            {b.date || '—'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                            {b.time || ''}
                          </div>
                        </td>

                        {/* Fare */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
                            ₹{(Number(b.total_amount) || 0).toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                            Paid: ₹{(Number(b.paid_amount) || 0).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}>
                            {b.booking_status || 'Pending'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setInspectBooking(b)}
                              title="Inspect details"
                              style={{
                                padding: '6px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#475569',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye style={{ width: '15px', height: '15px' }} />
                            </button>
                            <a
                              href={`https://agnicarrental.com/2025/get_invoice_data.php?bookingId=${b.id}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View Invoice"
                              style={{
                                padding: '6px',
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                color: '#2563EB',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <ExternalLink style={{ width: '15px', height: '15px' }} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Detailed Modal Sheet */}
      {inspectBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Booking #{inspectBooking.id}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
                  {inspectBooking.trip_type} • {inspectBooking.car_type}
                </div>
              </div>

              <button
                onClick={() => setInspectBooking(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Trip Route & Schedule
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>
                  <strong>Pickup:</strong> {inspectBooking.from_address || '—'}
                </div>
                {inspectBooking.to_address && (
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                    <strong>Drop:</strong> {inspectBooking.to_address}
                  </div>
                )}
                <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                  <strong>Schedule:</strong> {inspectBooking.date} at {inspectBooking.time}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Customer & Payment
                </div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A' }}>
                  <strong>Customer:</strong> {inspectBooking.customer_name} (📞 {inspectBooking.customer_phone})
                </div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '4px' }}>
                  <strong>Total Fare:</strong> ₹{(Number(inspectBooking.total_amount) || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#059669', marginTop: '4px' }}>
                  <strong>Advance Paid:</strong> ₹{(Number(inspectBooking.paid_amount) || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#D97706', marginTop: '4px' }}>
                  <strong>Remaining Balance:</strong> ₹{(Number(inspectBooking.remaining_balance) || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectBooking(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificBookings;

