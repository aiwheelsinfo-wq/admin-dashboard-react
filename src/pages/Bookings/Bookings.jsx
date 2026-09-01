import React, { useState } from 'react';
import Badge from '../../components/common/Badge';
import {
  Car,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Navigation,
  Eye,
  XCircle,
  Calendar
} from 'lucide-react';

const Bookings = () => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [bookings] = useState([
    {
      id: 347,
      customer: 'Ansil K',
      phone: '+91 98471 23456',
      tripType: 'One-way',
      from: 'Cheeyambam, Kerala',
      to: 'Bangalore Electronic City',
      distance: '280 KM',
      car: 'Sedan (Dzire)',
      driver: 'Unassigned',
      totalFare: '₹4,342.50',
      paidAdvance: '₹1,152.75',
      remainingBalance: '₹3,189.75',
      driverPayout: '₹3,458.25',
      status: 'Pending',
      date: '2026-09-01 14:30'
    },
    {
      id: 346,
      customer: 'Rahul Mehta',
      phone: '+91 99201 88412',
      tripType: 'One-way',
      from: 'Dadar, Mumbai',
      to: 'Koregaon Park, Pune',
      distance: '148 KM',
      car: 'Sedan (Aura)',
      driver: 'Santosh Jadhav (MH12-RN4021)',
      totalFare: '₹2,901.00',
      paidAdvance: '₹750.00',
      remainingBalance: '₹2,151.00',
      driverPayout: '₹2,610.90',
      status: 'Confirmed',
      date: '2026-09-01 10:15'
    },
    {
      id: 345,
      customer: 'Vikram Singh',
      phone: '+91 98112 33400',
      tripType: 'One-way',
      from: 'Pune Station',
      to: 'Shirdi Temple',
      distance: '190 KM',
      car: 'Ertiga (6-Seater)',
      driver: 'Amit Deshmukh (MH14-AZ9912)',
      totalFare: '₹5,150.00',
      paidAdvance: '₹1,500.00',
      remainingBalance: '₹3,650.00',
      driverPayout: '₹4,635.00',
      status: 'In-Transit',
      date: '2026-09-01 08:00'
    },
    {
      id: 344,
      customer: 'Deepak Sharma',
      phone: '+91 98200 44123',
      tripType: 'One-way',
      from: 'Andheri West, Mumbai',
      to: 'Lonavala Main Market',
      distance: '85 KM',
      car: 'Innova Crysta',
      driver: 'Ramesh Pawar (MH01-CK7744)',
      totalFare: '₹3,850.00',
      paidAdvance: '₹3,850.00',
      remainingBalance: '₹0.00',
      driverPayout: '₹3,465.00',
      status: 'Completed',
      date: '2026-09-01 06:30'
    },
  ]);

  const filtered = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'All' || b.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(b.id).includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

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
              <Car style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Live Telemetry & Booking Dispatch
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Track active customer rides, driver trip allocations, prepaid advance amounts, and remaining cash balances.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Pending', 'Confirmed', 'In-Transit', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: filterStatus === st ? '1px solid #f59e0b' : '1px solid var(--border)',
                backgroundColor: filterStatus === st ? '#fff7ed' : '#ffffff',
                color: filterStatus === st ? '#c2410c' : '#4b5563',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="glass-card">
        {/* Search Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search by customer, city, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <Badge variant="blue">{filtered.length} Bookings matching</Badge>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer Details</th>
                <th>Route & Distance</th>
                <th>Vehicle & Driver</th>
                <th>Financial Breakdown</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: '#f59e0b', fontSize: '0.9375rem' }}>#{b.id}</b>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{b.date}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: '#111827', fontSize: '0.875rem' }}>{b.customer}</b>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{b.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.8125rem' }}>{b.from}</span>
                      <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>→ {b.to}</span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{b.distance}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.8125rem' }}>{b.car}</span>
                      <span style={{ fontSize: '0.75rem', color: b.driver === 'Unassigned' ? '#ef4444' : '#059669', fontWeight: 600 }}>
                        {b.driver}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <b style={{ color: '#111827', fontSize: '0.875rem' }}>{b.totalFare}</b>
                      <span style={{ fontSize: '0.75rem', color: '#059669' }}>Paid: {b.paidAdvance}</span>
                      <span style={{ fontSize: '0.75rem', color: '#c2410c' }}>Due to Driver: {b.remainingBalance}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={
                      b.status === 'Confirmed' ? 'green' :
                      b.status === 'Pending' ? 'amber' :
                      b.status === 'In-Transit' ? 'blue' : 'slate'
                    }>
                      {b.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      title="View Details"
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
