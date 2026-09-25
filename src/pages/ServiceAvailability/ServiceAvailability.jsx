import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sliders,
  Car,
  Clock,
  Zap,
  Repeat,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Save,
  Globe,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { endpoints } from '../../config/api';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

const SERVICE_META = {
  local_taxi: {
    name: 'Local Taxi',
    category: 'City Rides & Point-to-Point',
    icon: Car,
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    description: 'Instant and scheduled point-to-point taxi rides within municipal boundary zones.'
  },
  local_duty: {
    name: 'Hourly Rental',
    category: 'Local Packages (8hr / 80km)',
    icon: Clock,
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
    iconColor: '#D97706',
    bgColor: '#FFFBEB',
    description: 'Flexible hourly and multi-hour local packages with kilometer allowances.'
  },
  one_way: {
    name: 'One-Way Outstation',
    category: 'Intercity One-Way Drops',
    icon: Zap,
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    iconColor: '#2563EB',
    bgColor: '#EFF6FF',
    description: 'Direct intercity one-way cab travel across Maharashtra and neighboring states.'
  },
  round_trip: {
    name: 'Round-Trip Outstation',
    category: 'Multi-Day Intercity Returns',
    icon: Repeat,
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    iconColor: '#059669',
    bgColor: '#ECFDF5',
    description: 'Outstation round trips with driver allowances, multiday stay, and toll calculation.'
  }
};

const ServiceAvailability = () => {
  const { showSuccess, showError } = useToast();
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);
  const [editForms, setEditForms] = useState({});

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(endpoints.getServiceStatus);
      if (res.data && res.data.services) {
        setServices(res.data.services);

        // Pre-fill edit forms
        const forms = {};
        Object.entries(res.data.services).forEach(([k, item]) => {
          forms[k] = {
            badge_text: item.badge_text || 'Coming Soon',
            coming_soon_title: item.coming_soon_title || `${item.service_name || k} is Coming Soon`,
            coming_soon_message: item.coming_soon_message || 'This service is currently being fine-tuned in your area.'
          };
        });
        setEditForms(forms);

        if (isManual) {
          showSuccess('Trip service statuses refreshed successfully');
        }
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Failed to load trip service status:', err);
      showError('Failed to fetch service availability. Please check AWS connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggle = async (key, currentStatus) => {
    const newStatus = !currentStatus;
    const oldServices = { ...services };

    // Optimistic UI update
    setServices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        is_enabled: newStatus
      }
    }));
    setUpdatingKey(key);

    try {
      const res = await axios.post(endpoints.updateServiceStatus, {
        service_key: key,
        is_enabled: newStatus ? 1 : 0
      });

      if (res.data && res.data.success) {
        showSuccess(
          `${SERVICE_META[key]?.name || key} is now ${newStatus ? 'LIVE & AVAILABLE' : 'PAUSED (COMING SOON)'} across Web & Mobile apps`
        );
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      setServices(oldServices);
      showError(`Failed to update status for ${SERVICE_META[key]?.name || key}`);
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleFormChange = (key, field, value) => {
    setEditForms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveText = async (key) => {
    const form = editForms[key];
    if (!form) return;

    setUpdatingKey(key);
    try {
      const res = await axios.post(endpoints.updateServiceStatus, {
        service_key: key,
        badge_text: form.badge_text,
        coming_soon_title: form.coming_soon_title,
        coming_soon_message: form.coming_soon_message
      });

      if (res.data && res.data.success) {
        setServices(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            badge_text: form.badge_text,
            coming_soon_title: form.coming_soon_title,
            coming_soon_message: form.coming_soon_message
          }
        }));
        showSuccess(`Coming Soon messages updated for ${SERVICE_META[key]?.name || key}`);
        setExpandedKey(null);
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (err) {
      console.error('Save message error:', err);
      showError(`Failed to save message: ${err.message}`);
    } finally {
      setUpdatingKey(null);
    }
  };

  // Metrics
  const serviceKeys = ['local_taxi', 'local_duty', 'one_way', 'round_trip'];
  const totalCount = serviceKeys.length;
  const activeCount = serviceKeys.filter(k => services[k]?.is_enabled).length;
  const comingSoonCount = totalCount - activeCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Page Header Card ────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FFF7ED',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #FED7AA'
          }}>
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Trip Services Availability
              </h1>
              <Badge variant="amber">Live Sync Active</Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Control which trip types are active or marked "Coming Soon" across Web and Mobile Customer Apps.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* ── KPI Metric Cards Row ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Engines
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {totalCount} Services
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active & Live
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {activeCount} Live
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#FFF7ED',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Coming Soon
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
              {comingSoonCount} Paused
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '18px 20px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#F5F3FF',
            color: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Backend API Guard
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
              Enforced
            </div>
          </div>
        </div>
      </div>

      {/* ── Informative Banner ──────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#F0FDF4',
        borderRadius: '12px',
        border: '1px solid #BBF7D0',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={18} color="#15803D" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
          <strong>Real-Time App Synchronization:</strong> Toggling any service OFF immediately disables the booking form on the Web Customer Site and Flutter App with a branded <em>"Coming Soon"</em> badge. It also triggers an instant server-side validation lock on <code>saveBooking.php</code> to prevent unauthorized booking entries.
        </div>
      </div>

      {/* ── Services Master List ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '20px'
      }}>
        {serviceKeys.map((key) => {
          const meta = SERVICE_META[key] || {
            name: key,
            category: 'Trip Engine',
            icon: Car,
            gradient: 'linear-gradient(135deg, #4B5563 0%, #1F2937 100%)',
            iconColor: '#4B5563',
            bgColor: '#F3F4F6',
            description: ''
          };
          const data = services[key] || {};
          const isEnabled = Boolean(data.is_enabled);
          const isBusy = updatingKey === key;
          const isExpanded = expandedKey === key;
          const form = editForms[key] || {};
          const IconComponent = meta.icon;

          return (
            <div
              key={key}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: isEnabled ? '1px solid var(--border)' : '1px solid #FED7AA',
                boxShadow: isEnabled ? 'var(--shadow-card)' : '0 4px 12px rgba(245, 158, 11, 0.08)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Card Header & Primary Toggle */}
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                borderBottom: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: meta.bgColor,
                    color: meta.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={26} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {meta.name}
                      </h2>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isEnabled ? '#ECFDF5' : '#FFF7ED',
                        color: isEnabled ? '#059669' : '#C2410C',
                        border: isEnabled ? '1px solid #A7F3D0' : '1px solid #FED7AA'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isEnabled ? '#10B981' : '#F59E0B'
                        }} />
                        {isEnabled ? 'Live on App' : (data.badge_text || 'Coming Soon')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
                      {meta.category}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <ToggleSwitch
                    checked={isEnabled}
                    onChange={() => handleToggle(key, isEnabled)}
                    disabled={isBusy}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isEnabled ? '#059669' : '#9CA3AF' }}>
                    {isEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                    {meta.description}
                  </p>

                  {/* Sync Indicators */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Globe size={14} color="#2563EB" />
                      <span>Web Portal</span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Smartphone size={14} color="#7C3AED" />
                      <span>Flutter App</span>
                    </div>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                    <span style={{ fontWeight: 600, color: isEnabled ? '#059669' : '#D97706' }}>
                      {isEnabled ? 'Accepting Customer Bookings' : 'Shows "Coming Soon" Banner'}
                    </span>
                  </div>
                </div>

                {/* Edit Message Accordion Header */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: isExpanded ? '#F3F4F6' : '#FAFAFA',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit3 size={13} color="#4B5563" />
                      <span>Customize Coming Soon Message & Badge</span>
                    </div>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Expandable Message Editor Drawer */}
              {isExpanded && (
                <div style={{
                  padding: '18px 20px',
                  backgroundColor: '#F9FAFB',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Badge Text (Shows on Tabs & Cards)
                    </label>
                    <input
                      type="text"
                      value={form.badge_text || ''}
                      onChange={e => handleFormChange(key, 'badge_text', e.target.value)}
                      placeholder="e.g. Coming Soon, Launching Soon"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Coming Soon Title
                    </label>
                    <input
                      type="text"
                      value={form.coming_soon_title || ''}
                      onChange={e => handleFormChange(key, 'coming_soon_title', e.target.value)}
                      placeholder="e.g. Local Taxi is Coming Soon"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Coming Soon Description (Shown to Customers)
                    </label>
                    <textarea
                      rows={2}
                      value={form.coming_soon_message || ''}
                      onChange={e => handleFormChange(key, 'coming_soon_message', e.target.value)}
                      placeholder="Explanation shown when customer taps on this service..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedKey(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveText(key)}
                      disabled={isBusy}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#F59E0B',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: isBusy ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Save size={13} />
                      <span>{isBusy ? 'Saving...' : 'Save Messages'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceAvailability;
