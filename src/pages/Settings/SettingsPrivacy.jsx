import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Server,
  UserCheck,
  Clock,
  RefreshCw,
  Sparkles,
  Database,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { endpoints } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SettingsPrivacy = () => {
  const { adminUser, updateAuthUser } = useAuth();
  const { addToast } = useToast();

  // Profile data from server
  const [profileLoading, setProfileLoading] = useState(true);
  const [serverEmail, setServerEmail] = useState(adminUser?.email || 'agnicarrental@gmail.com');
  const [adminName, setAdminName] = useState(adminUser?.name || 'Agni Car Rental');
  const [accountCreatedAt, setAccountCreatedAt] = useState('');

  // Active Tab: 'credentials' | 'email' | 'privacy'
  const [activeTab, setActiveTab] = useState('credentials');

  // --- Password Form State ---
  const [passCurrent, setPassCurrent] = useState('');
  const [passNew, setPassNew] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [showPassCurrent, setShowPassCurrent] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // --- Email Form State ---
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPass, setEmailCurrentPass] = useState('');
  const [showEmailCurrentPass, setShowEmailCurrentPass] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Fetch current admin profile from AWS MySQL
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await axios.get(`${endpoints.adminAccountSettings}?action=get_profile`, {
        timeout: 10000
      });
      if (res.data && res.data.status === 'success') {
        const data = res.data.data;
        setServerEmail(data.email || 'agnicarrental@gmail.com');
        setAdminName(data.userName || 'Agni Car Rental');
        setAccountCreatedAt(data.created_at || '');
        updateAuthUser({ email: data.email, name: data.userName });
      }
    } catch (err) {
      console.warn('Could not fetch remote profile, using auth session:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // --- Handle Password Change ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!passCurrent.trim()) {
      setPassError('Please enter your current password.');
      return;
    }
    if (!passNew || passNew.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (passNew !== passConfirm) {
      setPassError('New password and confirmation password do not match.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await axios.post(
        endpoints.adminAccountSettings,
        {
          action: 'update_password',
          current_password: passCurrent.trim(),
          new_password: passNew.trim()
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        }
      );

      if (res.data && res.data.status === 'success') {
        setPassSuccess('Password successfully updated in AWS MySQL database! Both new and old dashboards now use this password.');
        addToast('Admin password changed successfully', 'success');
        setPassCurrent('');
        setPassNew('');
        setPassConfirm('');
      } else {
        setPassError(res.data?.message || 'Failed to update password.');
        addToast(res.data?.message || 'Password update failed', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error updating password.';
      setPassError(msg);
      addToast(msg, 'error');
    } finally {
      setPassLoading(false);
    }
  };

  // --- Handle Email Change ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail.trim()) {
      setEmailError('Please enter a new email address.');
      return;
    }
    if (!emailCurrentPass.trim()) {
      setEmailError('Please enter your current password to authorize this email change.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setEmailError('Please enter a valid email format.');
      return;
    }

    setEmailLoading(true);
    try {
      const res = await axios.post(
        endpoints.adminAccountSettings,
        {
          action: 'update_email',
          current_password: emailCurrentPass.trim(),
          new_email: newEmail.trim()
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000
        }
      );

      if (res.data && res.data.status === 'success') {
        const updated = res.data.data?.email || newEmail.trim();
        setServerEmail(updated);
        updateAuthUser({ email: updated });
        setEmailSuccess(`Email successfully updated to ${updated}!`);
        addToast(`Admin email updated to ${updated}`, 'success');
        setNewEmail('');
        setEmailCurrentPass('');
      } else {
        setEmailError(res.data?.message || 'Failed to update email.');
        addToast(res.data?.message || 'Email update failed', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Network error updating email.';
      setEmailError(msg);
      addToast(msg, 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(passNew);
  const getStrengthLabel = (s) => {
    if (s <= 25) return { label: 'Weak', color: '#EF4444' };
    if (s <= 50) return { label: 'Fair', color: '#F59E0B' };
    if (s <= 75) return { label: 'Good', color: '#3B82F6' };
    return { label: 'Strong', color: '#10B981' };
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>Account Management</span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D97706' }}>Settings & Privacy</span>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            Account Settings & Security
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
            Manage your administrative email credentials, password security, and database sync preferences.
          </p>
        </div>

        {/* Live Database Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
          }} />
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#047857', letterSpacing: '0.05em' }}>
              AWS RDS / EC2 CONNECTED
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#065F46' }}>
              MySQL: agnicar2025 (admins)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Admin Identity Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar Ring */}
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            boxShadow: '0 8px 16px -4px rgba(217, 119, 6, 0.35)',
            flexShrink: 0
          }}>
            A
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {adminName}
              </h2>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#C2410C',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                padding: '3px 10px',
                borderRadius: '20px'
              }}>
                Super Administrator
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#475569' }}>
                <Mail style={{ width: '15px', height: '15px', color: '#94A3B8' }} />
                <span style={{ fontWeight: 600 }}>{serverEmail}</span>
              </div>
              {accountCreatedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  <Clock style={{ width: '14px', height: '14px' }} />
                  <span>Created: {new Date(accountCreatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={fetchProfile}
          disabled={profileLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#334155',
            cursor: profileLoading ? 'not-allowed' : 'pointer'
          }}
          title="Sync latest admin profile from AWS"
        >
          <RefreshCw style={{
            width: '15px',
            height: '15px',
            animation: profileLoading ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #E2E8F0',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('credentials')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'credentials' ? '2.5px solid #D97706' : '2.5px solid transparent',
            color: activeTab === 'credentials' ? '#D97706' : '#64748B',
            fontWeight: activeTab === 'credentials' ? 800 : 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Lock style={{ width: '18px', height: '18px' }} />
          <span>Change Password</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'email' ? '2.5px solid #D97706' : '2.5px solid transparent',
            color: activeTab === 'email' ? '#D97706' : '#64748B',
            fontWeight: activeTab === 'email' ? 800 : 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Mail style={{ width: '18px', height: '18px' }} />
          <span>Update Email</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'privacy' ? '2.5px solid #D97706' : '2.5px solid transparent',
            color: activeTab === 'privacy' ? '#D97706' : '#64748B',
            fontWeight: activeTab === 'privacy' ? 800 : 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldCheck style={{ width: '18px', height: '18px' }} />
          <span>Privacy & Sync Architecture</span>
        </button>
      </div>

      {/* 4. Tab 1: Change Password */}
      {activeTab === 'credentials' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)',
          gap: '24px'
        }}>
          {/* Form Column */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Update Administrator Password
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
                Enter your existing password followed by your chosen new password.
              </p>
            </div>

            {passError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#B91C1C',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0, color: '#10B981' }} />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Current Password *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <KeyRound style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
                  <input
                    type={showPassCurrent ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={passCurrent}
                    onChange={(e) => setPassCurrent(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassCurrent(!showPassCurrent)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  >
                    {showPassCurrent ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New Password *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <Lock style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
                  <input
                    type={showPassNew ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={passNew}
                    onChange={(e) => setPassNew(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassNew(!showPassNew)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  >
                    {showPassNew ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passNew && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: '#64748B' }}>Password Strength</span>
                      <span style={{ fontWeight: 700, color: getStrengthLabel(strength).color }}>
                        {getStrengthLabel(strength).label}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${strength}%`,
                        height: '100%',
                        backgroundColor: getStrengthLabel(strength).color,
                        transition: 'all 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: passConfirm && passNew === passConfirm ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <Lock style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
                  <input
                    type={showPassConfirm ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassConfirm(!showPassConfirm)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  >
                    {showPassConfirm ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
                {passConfirm && passNew !== passConfirm && (
                  <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={passLoading}
                style={{
                  marginTop: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: passLoading ? 'not-allowed' : 'pointer',
                  opacity: passLoading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{passLoading ? 'Updating Database...' : 'Save New Password'}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </form>
          </div>

          {/* Security Information Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Guidelines Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
            }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ width: '18px', height: '18px', color: '#D97706' }} />
                <span>Password Requirements</span>
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passNew.length >= 6 ? '#059669' : '#64748B' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: passNew.length >= 6 ? '#10B981' : '#CBD5E1' }} />
                  <span>Minimum 6 characters long</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passNew.length >= 8 ? '#059669' : '#64748B' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: passNew.length >= 8 ? '#10B981' : '#CBD5E1' }} />
                  <span>Recommended 8+ characters for production</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: /[0-9]/.test(passNew) ? '#059669' : '#64748B' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: /[0-9]/.test(passNew) ? '#10B981' : '#CBD5E1' }} />
                  <span>Includes numbers (0-9)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passNew && passNew === passConfirm ? '#059669' : '#64748B' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: passNew && passNew === passConfirm ? '#10B981' : '#CBD5E1' }} />
                  <span>Both passwords match exactly</span>
                </li>
              </ul>
            </div>

            {/* Sync Note Card */}
            <div style={{
              backgroundColor: '#FFFBEB',
              borderRadius: '16px',
              border: '1px solid #FDE68A',
              padding: '20px',
              color: '#92400E'
            }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database style={{ width: '16px', height: '16px' }} />
                <span>Automatic Double Dashboard Sync</span>
              </h5>
              <p style={{ fontSize: '0.8125rem', lineHeight: '1.5', margin: 0 }}>
                Updating your password here automatically updates the <strong>agnicar2025.admins</strong> MySQL table. The next time you sign into either this React dashboard or the older PHP dashboard, your new password will be active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Update Email */}
      {activeTab === 'email' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)',
          gap: '24px'
        }}>
          {/* Email Form */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Change Administrative Email Address
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px', margin: 0 }}>
                Your email is used to log in to the administrative portals and receive critical fleet notifications.
              </p>
            </div>

            {emailError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#B91C1C',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#065F46',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0, color: '#10B981' }} />
                <span>{emailSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Current Active Email (Readonly Display) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Current Active Email
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <Mail style={{ width: '18px', height: '18px', color: '#64748B', marginRight: '10px' }} />
                  <input
                    type="text"
                    disabled
                    value={serverEmail}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#334155'
                    }}
                  />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#D1FAE5',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    Active
                  </span>
                </div>
              </div>

              {/* New Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New Admin Email Address *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <Mail style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
                  <input
                    type="email"
                    required
                    placeholder="newadmin@rentox.co.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A'
                    }}
                  />
                </div>
              </div>

              {/* Current Password Confirmation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Verify Current Password *
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <Lock style={{ width: '18px', height: '18px', color: '#94A3B8', marginRight: '10px' }} />
                  <input
                    type={showEmailCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password to authorize change"
                    value={emailCurrentPass}
                    onChange={(e) => setEmailCurrentPass(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailCurrentPass(!showEmailCurrentPass)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  >
                    {showEmailCurrentPass ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                style={{
                  marginTop: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  opacity: emailLoading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{emailLoading ? 'Updating Email...' : 'Save New Email'}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </form>
          </div>

          {/* Email Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
            }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fingerprint style={{ width: '18px', height: '18px', color: '#D97706' }} />
                <span>Security Notice</span>
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
                Changing your administrative email directly alters your login identity across all services. Ensure that you have access to the new email address before saving.
              </p>
            </div>

            <div style={{
              backgroundColor: '#EFF6FF',
              borderRadius: '16px',
              border: '1px solid #BFDBFE',
              padding: '20px',
              color: '#1E40AF'
            }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server style={{ width: '16px', height: '16px' }} />
                <span>Instant Database Update</span>
              </h5>
              <p style={{ fontSize: '0.8125rem', lineHeight: '1.5', margin: 0 }}>
                The update is committed immediately to <strong>agnicar2025.admins</strong> via secure parameterized SQL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Privacy & Architecture */}
      {activeTab === 'privacy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Active Session Telemetry */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck style={{ width: '20px', height: '20px', color: '#D97706' }} />
              <span>Active Session Telemetry</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Authenticated Role</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>SuperAdmin (Full Access)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Remote Server Host</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>15.207.10.118 (AWS EC2 Mumbai)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Database Target</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A' }}>agnicar2025.admins</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Session Status</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10B981' }}>Active & Verified</span>
              </div>
            </div>
          </div>

          {/* Privacy & Safeguards Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck style={{ width: '20px', height: '20px', color: '#10B981' }} />
              <span>Security & Access Controls</span>
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.6', marginBottom: '18px' }}>
              All administrative actions including dynamic fare modifications, festival surge scheduling, and geo-fence settings are governed under this authenticated profile.
            </p>

            <div style={{
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Sparkles style={{ width: '24px', height: '24px', color: '#D97706', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: '1.4' }}>
                <strong>Zero Downtime Credentials:</strong> Your sessions stay seamless when saving updates.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPrivacy;
