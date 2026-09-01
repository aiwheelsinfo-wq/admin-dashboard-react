import React, { useState, useEffect } from 'react';
import Badge from '../../components/common/Badge';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Flame,
  X,
  Loader2
} from 'lucide-react';

const SpecialDays = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);

  const [newHoliday, setNewHoliday] = useState({
    name: '',
    startDate: '',
    endDate: '',
    multiplier: 1.30,
    reason: ''
  });

  const [showModal, setShowModal] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/get_special_events.php`);
      if (res.data && res.data.events) {
        setHolidays(res.data.events);
      }
    } catch (err) {
      console.warn("Failed to fetch special events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.name || !newHoliday.startDate) {
      addToast('Please enter event name and start date', 'warning');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/save_special_event.php`, {
        action: 'save',
        name: newHoliday.name,
        startDate: newHoliday.startDate,
        endDate: newHoliday.endDate || newHoliday.startDate,
        multiplier: newHoliday.multiplier,
        reason: newHoliday.reason,
        category: 'Custom Event'
      });

      if (res.data && res.data.status === 'success') {
        setShowModal(false);
        setNewHoliday({ name: '', startDate: '', endDate: '', multiplier: 1.30, reason: '' });
        addToast(`Special Event "${newHoliday.name}" saved to AWS & live on pricing!`, 'success');
        fetchEvents();
      } else {
        addToast(res.data.message || 'Failed to save event', 'error');
      }
    } catch (err) {
      addToast('Network error while saving special event', 'error');
    }
  };

  const handleToggleHoliday = async (id, currentStatus) => {
    try {
      await axios.post(`${API_BASE_URL}/save_special_event.php`, {
        action: 'toggle',
        id: id,
        isActive: !currentStatus
      });
      setHolidays(prev => prev.map(h => h.id === id ? { ...h, isActive: !currentStatus } : h));
      addToast('Holiday active status updated on AWS', 'info');
    } catch (err) {
      addToast('Failed to update event status', 'error');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await axios.post(`${API_BASE_URL}/save_special_event.php`, {
        action: 'delete',
        id: id
      });
      setHolidays(prev => prev.filter(h => h.id !== id));
      addToast('Special holiday removed from live calendar', 'info');
    } catch (err) {
      addToast('Failed to delete event', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Card */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#fff7ed',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Special Days & Festival Surge Calendar
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Schedule automatic holiday multipliers for Holi, Diwali, New Year's Eve, and long weekends. Multipliers apply seamlessly to customer search fares and pass 90% higher payouts to drivers.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Add Surge Event</span>
        </button>
      </div>

      {/* Info Notice Banner */}
      <div style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: '#ffedd5',
          color: '#c2410c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame style={{ width: '22px', height: '22px' }} />
        </div>
        <div style={{ fontSize: '0.875rem', color: '#9a3412', lineHeight: 1.6 }}>
          <b>Why Festival Surges are Essential:</b> On days like Holi and Diwali, customer demand increases by <b>+200%</b> while <b>50% of drivers take holidays</b>. The special multiplier increases customer fare and automatically passes <b>90% higher earnings to drivers</b>, ensuring maximum driver availability.
        </div>
      </div>

      {/* Holiday Calendar List */}
      <div className="glass-card">
        <div className="section-header">
          <div className="section-title">
            <Sparkles style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <span>Configured Festival & Holiday Dates</span>
          </div>
          <Badge variant="amber">{holidays.filter(h => h.isActive).length} Active Calendars</Badge>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event & Festival</th>
                <th>Target Dates</th>
                <th>Surge Multiplier</th>
                <th>Business Rationale</th>
                <th>Category</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>
                    <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', color: '#f59e0b', margin: '0 auto' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '8px', display: 'block' }}>Loading special events...</span>
                  </td>
                </tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                    No festival events configured. Click <b>+ Add Surge Event</b> to create one.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <b style={{ color: '#111827', fontSize: '0.875rem' }}>{h.name}</b>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600 }}>
                        {h.startDate} {h.endDate && h.endDate !== h.startDate ? `→ ${h.endDate}` : ''}
                      </span>
                    </td>
                    <td>
                      <Badge variant={h.multiplier >= 1.35 ? 'rose' : 'amber'}>
                        {h.surgePct} ({h.multiplier}x)
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{h.reason}</span>
                    </td>
                    <td>
                      <Badge variant="blue">{h.category}</Badge>
                    </td>
                    <td>
                      <ToggleSwitch
                        checked={h.isActive}
                        onChange={() => handleToggleHoliday(h.id, h.isActive)}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete event"
                      >
                        <Trash2 style={{ width: '16px', height: '16px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>Add Festival / Event Surge</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Festival / Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Holi Homecoming Rush"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday(s => ({ ...s, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newHoliday.startDate}
                    onChange={(e) => setNewHoliday(s => ({ ...s, startDate: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newHoliday.endDate}
                    onChange={(e) => setNewHoliday(s => ({ ...s, endDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Surge Multiplier: <b style={{ color: '#c2410c' }}>{newHoliday.multiplier}x (+{Math.round((newHoliday.multiplier - 1.0) * 100)}%)</b>
                </label>
                <input
                  type="range"
                  min={1.05}
                  max={1.40}
                  step={0.05}
                  value={newHoliday.multiplier}
                  onChange={(e) => setNewHoliday(s => ({ ...s, multiplier: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Operational Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% driver holiday drop & high family transit"
                  value={newHoliday.reason}
                  onChange={(e) => setNewHoliday(s => ({ ...s, reason: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Event Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialDays;
