import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Bell,
  Volume2,
  VolumeX,
  Sliders,
  Clock,
  Smartphone,
  Play,
  Square,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Radio,
  Sparkles,
  ShieldCheck,
  Vibrate,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import SliderInput from '../../components/common/SliderInput';
import { endpoints } from '../../config/api';

const DEFAULT_SETTINGS = {
  alert_enabled: 1,
  ringtone_name: 'preview',
  vibration_duration_sec: 15,
  dialog_countdown_sec: 45,
  notification_title_template: 'New Trip Available - {trip_type}',
  notification_body_template: "From: {pickup_location}\nTo: {drop_location}\nEarnings: ₹{vendor_amount}",
  advance_lead_time_min: 45,
  auto_retry_enabled: 1,
  retry_interval_min: 2,
  max_retries: 3
};

const SAMPLE_DATA = {
  '{trip_type}': 'One-Way Outstation',
  '{pickup_location}': 'Connaught Place, Central Delhi',
  '{drop_location}': 'Sector 62, Electronic City, Noida',
  '{vendor_amount}': '1,850.00',
  '{booking_id}': '98421'
};

const DriverAlertSettings = () => {
  const { addToast } = useToast();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);
  const [availableRingtones, setAvailableRingtones] = useState([
    { id: 'preview', name: 'Rentox Signature (Default)', description: 'Crisp energetic alert chime with prominent pulse' },
    { id: 'loud_alarm', name: 'High Alert Siren', description: 'Loud repeating alarm tone for high urgency orders' },
    { id: 'uber_pulse', name: 'Radar Pulse Tone', description: 'Continuous sonar radar pulse sound' },
    { id: 'default', name: 'System Default Notification', description: 'Standard Android device notification sound' }
  ]);
  const [availableTags, setAvailableTags] = useState({
    '{trip_type}': 'Booking category (e.g. One-Way, Local Taxi)',
    '{pickup_location}': 'Customer pickup address or city',
    '{drop_location}': 'Drop destination address (if applicable)',
    '{vendor_amount}': 'Earnings payable to driver / vendor (e.g. 1450.00)',
    '{booking_id}': 'Unique numeric booking reference ID'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('lockscreen'); // 'lockscreen' | 'inapp'
  const [focusedField, setFocusedField] = useState('body'); // 'title' | 'body'

  const audioCtxRef = useRef(null);
  const titleInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  // Fetch settings on mount
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(endpoints.driverAlertSettings);
      if (res.data && res.data.success) {
        setSettings(res.data.data);
        setInitialSettings(res.data.data);
        if (res.data.available_ringtones) {
          setAvailableRingtones(res.data.available_ringtones);
        }
        if (res.data.available_tags) {
          setAvailableTags(res.data.available_tags);
        }
      }
    } catch (err) {
      console.error('Failed to load driver alert settings:', err);
      addToast('Failed to load alert settings from server. Using local defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check if dirty
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(endpoints.driverAlertSettings, settings);
      if (res.data && res.data.success) {
        setSettings(res.data.data);
        setInitialSettings(res.data.data);
        addToast('Driver alert settings saved successfully!', 'success');
      } else {
        addToast(res.data?.message || 'Failed to update alert settings', 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      addToast('Network error while saving driver alert settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    setSettings(initialSettings);
    addToast('Changes reset to last saved state.', 'info');
  };

  // Insert tag into focused field
  const handleInsertTag = (tag) => {
    if (focusedField === 'title') {
      setSettings(prev => ({
        ...prev,
        notification_title_template: (prev.notification_title_template || '') + ' ' + tag
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        notification_body_template: (prev.notification_body_template || '') + ' ' + tag
      }));
    }
    addToast(`Inserted ${tag}`, 'info');
  };

  // Web Audio tone preview synthesizer
  const toggleAudioPreview = () => {
    if (isPlayingAudio) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        addToast('Web Audio API not supported in this browser.', 'warning');
        return;
      }

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      setIsPlayingAudio(true);

      const ringtone = settings.ringtone_name;
      const now = ctx.currentTime;

      if (ringtone === 'preview') {
        // Rentox Signature: energetic dual-tone melody chime
        const notes = [587.33, 880.0, 1174.66, 880.0, 1174.66]; // D5, A5, D6, A5, D6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.16);

          gain.gain.setValueAtTime(0, now + idx * 0.16);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.16 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.16);
          osc.stop(now + idx * 0.16 + 0.3);
        });

        setTimeout(() => {
          setIsPlayingAudio(false);
          if (audioCtxRef.current === ctx) {
            ctx.close().catch(() => {});
          }
        }, 1200);
      } else if (ringtone === 'loud_alarm') {
        // High Alert Siren: alternating urgent square wave sirens
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, now + i * 0.3);
          osc.frequency.linearRampToValueAtTime(1200, now + i * 0.3 + 0.15);
          osc.frequency.linearRampToValueAtTime(800, now + i * 0.3 + 0.28);

          gain.gain.setValueAtTime(0.2, now + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.29);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.3);
          osc.stop(now + i * 0.3 + 0.3);
        }

        setTimeout(() => {
          setIsPlayingAudio(false);
          if (audioCtxRef.current === ctx) {
            ctx.close().catch(() => {});
          }
        }, 1500);
      } else if (ringtone === 'uber_pulse') {
        // Radar Pulse: deep sonar sweep
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1400, now + i * 0.4);
          osc.frequency.exponentialRampToValueAtTime(400, now + i * 0.4 + 0.35);

          gain.gain.setValueAtTime(0.28, now + i * 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.4);
          osc.stop(now + i * 0.4 + 0.4);
        }

        setTimeout(() => {
          setIsPlayingAudio(false);
          if (audioCtxRef.current === ctx) {
            ctx.close().catch(() => {});
          }
        }, 1400);
      } else {
        // System Default: simple standard ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);

        setTimeout(() => {
          setIsPlayingAudio(false);
          if (audioCtxRef.current === ctx) {
            ctx.close().catch(() => {});
          }
        }, 700);
      }
    } catch (err) {
      console.error('Audio preview error:', err);
      setIsPlayingAudio(false);
    }
  };

  // Helper to interpolate placeholders for live preview
  const interpolate = (template) => {
    if (!template) return '';
    let res = template;
    Object.entries(SAMPLE_DATA).forEach(([tag, val]) => {
      res = res.replaceAll(tag, val);
    });
    return res;
  };

  const previewTitle = interpolate(settings.notification_title_template);
  const previewBody = interpolate(settings.notification_body_template);

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: '#6B7280'
      }}>
        <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px', color: '#F59E0B' }} />
        <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Loading Driver Alert Settings...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#F59E0B',
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              Operations
            </span>
            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>/</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>
              Fleet Dispatch Engine
            </span>
          </div>
          <h1 style={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Bell style={{ width: '26px', height: '26px', color: '#F59E0B' }} />
            Driver & Vendor Alert System
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '6px 0 0 0' }}>
            Configure push notification sound, vibration pulse duration, acceptance countdown timers, and message templates across the driver fleet.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              style={{
                backgroundColor: '#F3F4F6',
                color: '#4B5563',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              Reset Changes
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              backgroundColor: isDirty ? '#F59E0B' : '#E5E7EB',
              color: isDirty ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isDirty ? '0 2px 6px rgba(245, 158, 11, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
                Saving Settings...
              </>
            ) : (
              <>
                <Save style={{ width: '16px', height: '16px' }} />
                Save Alert Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Master Toggle Banner */}
      <div style={{
        backgroundColor: settings.alert_enabled ? '#ECFDF5' : '#FEF2F2',
        border: `1px solid ${settings.alert_enabled ? '#A7F3D0' : '#FECACA'}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: settings.alert_enabled ? '#10B981' : '#EF4444',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {settings.alert_enabled ? (
              <Radio style={{ width: '22px', height: '22px' }} />
            ) : (
              <VolumeX style={{ width: '22px', height: '22px' }} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Fleet Dispatch Notifications
              </h3>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: settings.alert_enabled ? '#D1FAE5' : '#FEE2E2',
                color: settings.alert_enabled ? '#065F46' : '#991B1B'
              }}>
                {settings.alert_enabled ? 'Active Broadcast' : 'Dispatcher Paused'}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#4B5563', margin: '4px 0 0 0' }}>
              {settings.alert_enabled
                ? 'Incoming customer bookings will instantly trigger sound, vibration, and push notification alerts to all eligible nearby drivers.'
                : 'Emergency kill switch active. All push notifications and ringtone triggers to driver devices are completely suspended.'}
            </p>
          </div>
        </div>

        <ToggleSwitch
          checked={settings.alert_enabled === 1}
          onChange={(checked) => setSettings(prev => ({ ...prev, alert_enabled: checked ? 1 : 0 }))}
          label=""
        />
      </div>

      {/* Main Grid: Left Controls (2 Cols) / Right Live Preview (1 Col) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Settings Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Ringtone & Sound Selector */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Volume2 style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Audible Ringtone Tone
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Select high-priority sound played on driver devices
                  </span>
                </div>
              </div>

              {/* Audio In-Browser Preview Button */}
              <button
                type="button"
                onClick={toggleAudioPreview}
                style={{
                  backgroundColor: isPlayingAudio ? '#FEE2E2' : '#EFF6FF',
                  color: isPlayingAudio ? '#DC2626' : '#2563EB',
                  border: `1px solid ${isPlayingAudio ? '#FECACA' : '#BFDBFE'}`,
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title="Simulate sound in browser"
              >
                {isPlayingAudio ? (
                  <>
                    <Square style={{ width: '14px', height: '14px' }} />
                    Stop Sound
                  </>
                ) : (
                  <>
                    <Play style={{ width: '14px', height: '14px' }} />
                    Preview Audio
                  </>
                )}
              </button>
            </div>

            {/* Ringtone Selection Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableRingtones.map((tone) => {
                const isSelected = settings.ringtone_name === tone.id;
                return (
                  <div
                    key={tone.id}
                    onClick={() => setSettings(prev => ({ ...prev, ringtone_name: tone.id }))}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? '#F59E0B' : '#E5E7EB'}`,
                      backgroundColor: isSelected ? '#FFFBEB' : '#FAFAFA',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#F59E0B' : '#D1D5DB'}`,
                        backgroundColor: isSelected ? '#F59E0B' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                          {tone.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                          {tone.description}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#6B7280',
                      backgroundColor: '#F3F4F6',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      res/raw/{tone.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Durations & Timers */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Vibration & Acceptance Durations
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Hardware haptics pulse cycle and driver timeout windows
                </span>
              </div>
            </div>

            {/* Vibration Duration Slider */}
            <div>
              <SliderInput
                label="Haptic Vibration Duration"
                value={settings.vibration_duration_sec}
                onChange={(val) => setSettings(prev => ({ ...prev, vibration_duration_sec: val }))}
                min={5}
                max={45}
                step={1}
                unit=" seconds"
                subtext="Pulsing vibration pattern (1s buzz, 0.5s pause) sustained on the driver's phone."
              />
            </div>

            <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />

            {/* In-App Dialog Countdown Slider */}
            <div>
              <SliderInput
                label="Ride Request In-App Countdown"
                value={settings.dialog_countdown_sec}
                onChange={(val) => setSettings(prev => ({ ...prev, dialog_countdown_sec: val }))}
                min={15}
                max={90}
                step={5}
                unit=" seconds"
                subtext="Time allotted to driver to inspect pickup/drop points and accept the trip before auto-dismissal."
              />
            </div>
          </div>

          {/* Card 3: Advance Bookings & Auto-Retry Dispatch Engine */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Radio style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Advance Bookings & Auto-Retry Dispatch Engine
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Scheduled ride promotion window and automated retry sirens for unaccepted trips
                </span>
              </div>
            </div>

            {/* Advance Lead Time Slider */}
            <div>
              <SliderInput
                label="Scheduled Ride Emergency Lead Time"
                value={settings.advance_lead_time_min ?? 45}
                onChange={(val) => setSettings(prev => ({ ...prev, advance_lead_time_min: val }))}
                min={15}
                max={90}
                step={5}
                unit=" minutes before pickup"
                subtext="How early on trip day the server promotes an unaccepted scheduled ride to an Urgent Loud Siren + Overlay alert."
              />
            </div>

            <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />

            {/* Auto-Retry Master Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                  Repeat Siren If Unaccepted
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Automatically re-alert nearby drivers if 45s timer expires without an acceptance
                </div>
              </div>
              <ToggleSwitch
                enabled={settings.auto_retry_enabled === 1}
                onChange={(val) => setSettings(prev => ({ ...prev, auto_retry_enabled: val ? 1 : 0 }))}
                ariaLabel="Auto-retry siren toggle"
              />
            </div>

            {/* Retry Controls (Shown when enabled) */}
            {settings.auto_retry_enabled === 1 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                paddingLeft: '14px',
                borderLeft: '3px solid #10B981'
              }}>
                <div>
                  <SliderInput
                    label="Retry Cooldown Interval"
                    value={settings.retry_interval_min ?? 2}
                    onChange={(val) => setSettings(prev => ({ ...prev, retry_interval_min: val }))}
                    min={1}
                    max={5}
                    step={1}
                    unit=" minutes"
                    subtext="Wait duration between repeat sirens to prevent continuous battery drain and driver fatigue."
                  />
                </div>

                <div>
                  <SliderInput
                    label="Maximum Retry Rounds"
                    value={settings.max_retries ?? 3}
                    onChange={(val) => setSettings(prev => ({ ...prev, max_retries: val }))}
                    min={1}
                    max={5}
                    step={1}
                    unit=" attempts"
                    subtext="Maximum number of siren dispatches before halting and flagging the trip on the Admin dashboard."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Dynamic Template Editor */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F5F3FF',
                border: '1px solid #DDD6FE',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Tag style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Notification Message Templates
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Customize push banner text with live trip variables
                </span>
              </div>
            </div>

            {/* Dynamic Tags Helper Bar */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#475569',
                display: 'block',
                marginBottom: '8px'
              }}>
                Click any placeholder to insert into {focusedField === 'title' ? 'Notification Title' : 'Message Body'}:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(availableTags).map(([tag, desc]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag(tag)}
                    title={desc}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF7ED';
                      e.currentTarget.style.borderColor = '#F59E0B';
                      e.currentTarget.style.color = '#B45309';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.color = '#0F172A';
                    }}
                  >
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Title Template */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '6px'
              }}>
                Notification Banner Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={settings.notification_title_template}
                onFocus={() => setFocusedField('title')}
                onChange={(e) => setSettings(prev => ({ ...prev, notification_title_template: e.target.value }))}
                placeholder="e.g. New Trip Available - {trip_type}"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${focusedField === 'title' ? '#F59E0B' : '#D1D5DB'}`,
                  outline: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  color: '#111827',
                  boxShadow: focusedField === 'title' ? '0 0 0 3px rgba(245, 158, 11, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>

            {/* Notification Body Template */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '6px'
              }}>
                Notification Message Body (Supports Multi-line)
              </label>
              <textarea
                ref={bodyTextareaRef}
                rows={4}
                value={settings.notification_body_template}
                onFocus={() => setFocusedField('body')}
                onChange={(e) => setSettings(prev => ({ ...prev, notification_body_template: e.target.value }))}
                placeholder="From: {pickup_location}&#10;To: {drop_location}&#10;Earnings: ₹{vendor_amount}"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${focusedField === 'body' ? '#F59E0B' : '#D1D5DB'}`,
                  outline: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  color: '#111827',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxShadow: focusedField === 'body' ? '0 0 0 3px rgba(245, 158, 11, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Smartphone Preview */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
          }}>
            {/* Simulation Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Live Device Preview
                </h3>
              </div>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #A7F3D0'
              }}>
                Realtime Sync
              </span>
            </div>

            {/* Preview Mode Switcher */}
            <div style={{
              display: 'flex',
              backgroundColor: '#F3F4F6',
              borderRadius: '10px',
              padding: '3px',
              marginBottom: '16px'
            }}>
              <button
                type="button"
                onClick={() => setActivePreviewTab('lockscreen')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activePreviewTab === 'lockscreen' ? '#FFFFFF' : 'transparent',
                  color: activePreviewTab === 'lockscreen' ? '#111827' : '#6B7280',
                  boxShadow: activePreviewTab === 'lockscreen' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Push Banner
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('inapp')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activePreviewTab === 'inapp' ? '#FFFFFF' : 'transparent',
                  color: activePreviewTab === 'inapp' ? '#111827' : '#6B7280',
                  boxShadow: activePreviewTab === 'inapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                In-App Popup Dialog
              </button>
            </div>

            {/* Smartphone Graphic Mockup Frame */}
            <div style={{
              backgroundColor: '#1E293B',
              borderRadius: '32px',
              padding: '14px',
              boxShadow: 'inset 0 0 0 2px #334155, 0 20px 40px rgba(0,0,0,0.25)',
              maxWidth: '340px',
              margin: '0 auto'
            }}>
              {/* Phone Inner Display */}
              <div style={{
                backgroundColor: activePreviewTab === 'lockscreen' ? '#0F172A' : '#111827',
                borderRadius: '24px',
                overflow: 'hidden',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}>
                {/* Phone Notch & Status Bar */}
                <div style={{
                  padding: '10px 18px 6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.6875rem',
                  color: '#94A3B8',
                  fontWeight: 600
                }}>
                  <span>9:41</span>
                  <div style={{
                    width: '60px',
                    height: '14px',
                    backgroundColor: '#1E293B',
                    borderRadius: '999px'
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Body Content based on active tab */}
                {activePreviewTab === 'lockscreen' ? (
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Simulated Clock on Lockscreen */}
                    <div style={{ textAlign: 'center', margin: '20px 0 28px' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        09:41
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                        Monday, September 7
                      </div>
                    </div>

                    {/* The Push Notification Banner Bubble */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '16px',
                      padding: '14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                      animation: 'pulse 2s infinite'
                    }}>
                      {/* App Header in notification */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            backgroundColor: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF'
                          }}>
                            <ShieldCheck style={{ width: '12px', height: '12px' }} />
                          </div>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#1E293B', letterSpacing: '0.5px' }}>
                            RENTOX DRIVER
                          </span>
                        </div>
                        <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                          Now • {settings.vibration_duration_sec}s Vibe
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.3,
                        marginBottom: '4px'
                      }}>
                        {previewTitle || 'New Trip Available'}
                      </div>

                      {/* Body */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#334155',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-line'
                      }}>
                        {previewBody || 'No template specified'}
                      </div>

                      {/* Notification Sub-badges */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9'
                      }}>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          backgroundColor: '#FFF7ED',
                          color: '#C2410C',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          🎵 {settings.ringtone_name}
                        </span>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          ⏳ {settings.dialog_countdown_sec}s Dialog
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', textAlign: 'center', padding: '12px 0 6px' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        Swipe up to open Rentox Driver
                      </span>
                    </div>
                  </div>
                ) : (
                  /* In-App Interactive Modal Simulation */
                  <div style={{
                    padding: '16px 12px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.65)'
                  }}>
                    <div style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
                    }}>
                      {/* Animated Top Progress Bar */}
                      <div style={{
                        height: '5px',
                        backgroundColor: '#E2E8F0',
                        position: 'relative'
                      }}>
                        <div style={{
                          height: '100%',
                          width: '70%',
                          backgroundColor: '#F59E0B',
                          borderRadius: '999px'
                        }} />
                      </div>

                      <div style={{ padding: '16px 14px' }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: '#FFF7ED',
                            color: '#D97706',
                            padding: '2px 8px',
                            borderRadius: '999px'
                          }}>
                            {SAMPLE_DATA['{trip_type}']}
                          </span>
                          <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            color: '#DC2626'
                          }}>
                            ⏳ {settings.dialog_countdown_sec}s left
                          </span>
                        </div>

                        {/* Amount */}
                        <div style={{ textAlign: 'center', margin: '8px 0 14px' }}>
                          <span style={{ fontSize: '0.6875rem', color: '#64748B', display: 'block' }}>Driver Earnings</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>
                            ₹{SAMPLE_DATA['{vendor_amount}']}
                          </span>
                        </div>

                        {/* Route points */}
                        <div style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: '10px',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '0.7188rem'
                        }}>
                          <div style={{ color: '#059669', fontWeight: 700 }}>
                            ● {SAMPLE_DATA['{pickup_location}']}
                          </div>
                          <div style={{ color: '#DC2626', fontWeight: 700 }}>
                            ■ {SAMPLE_DATA['{drop_location}']}
                          </div>
                        </div>

                        {/* Simulated Accept Button */}
                        <div style={{
                          marginTop: '14px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          padding: '10px',
                          textAlign: 'center',
                          fontSize: '0.8125rem',
                          fontWeight: 800
                        }}>
                          Accept Booking
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Footer Note */}
            <div style={{
              marginTop: '18px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                Tested and verified with Google FCM v1 API and Android 8.0+ custom notification channels.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAlertSettings;
