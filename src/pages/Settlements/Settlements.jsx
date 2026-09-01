import React, { useState } from 'react';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';

const Settlements = () => {
  const { addToast } = useToast();

  const [settlements, setSettlements] = useState([
    {
      id: 'SET-9042',
      driver: 'Santosh Jadhav',
      account: 'HDFC Bank •••• 4012',
      tripId: '#346 (Mumbai → Pune)',
      grossFare: '₹2,901.00',
      companyShare: '₹290.10 (10%)',
      driverNet: '₹2,610.90',
      status: 'Paid',
      date: '2026-09-01 11:30'
    },
    {
      id: 'SET-9041',
      driver: 'Amit Deshmukh',
      account: 'SBI Bank •••• 9811',
      tripId: '#345 (Pune → Shirdi)',
      grossFare: '₹5,150.00',
      companyShare: '₹515.00 (10%)',
      driverNet: '₹4,635.00',
      status: 'Paid',
      date: '2026-09-01 09:15'
    },
    {
      id: 'SET-9040',
      driver: 'Ramesh Pawar',
      account: 'ICICI Bank •••• 3341',
      tripId: '#344 (Mumbai → Lonavala)',
      grossFare: '₹3,850.00',
      companyShare: '₹385.00 (10%)',
      driverNet: '₹3,465.00',
      status: 'Pending',
      date: '2026-09-01 07:00'
    },
  ]);

  const handleProcessPayout = (id) => {
    setSettlements(prev => prev.map(s => {
      if (s.id === id) {
        addToast(`Payout ${id} marked as disbursed to driver bank account`, 'success');
        return { ...s, status: 'Paid' };
      }
      return s;
    }));
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
              <Wallet style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Company Share & Driver Payout Settlements
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Track the 90% driver earnings vs 10% platform company revenue split, advance deductions, and automate direct bank payouts.
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid-4">
        <StatCard
          title="Total Gross Booking Volume"
          value="₹8,42,500"
          subtitle="All completed trips this month"
          icon={CreditCard}
          trend="+12.4%"
          color="blue"
        />

        <StatCard
          title="Driver Net Earnings (90%)"
          value="₹7,58,250"
          subtitle="Disbursed directly to drivers"
          icon={ArrowDownLeft}
          color="emerald"
        />

        <StatCard
          title="Rentox Net Commission (10%)"
          value="₹84,250"
          subtitle="Platform technology margin"
          icon={Building2}
          color="amber"
        />

        <StatCard
          title="Pending Bank Transfers"
          value="₹3,465"
          subtitle="1 transaction ready for disbursement"
          icon={Clock}
          color="rose"
        />
      </div>

      {/* Settlements Table Card */}
      <div className="glass-card">
        <div className="section-header">
          <div>
            <div className="section-title">
              <CheckCircle2 style={{ width: '20px', height: '20px', color: '#10b981' }} />
              <span>Recent Payout Settlements & Reconciliation</span>
            </div>
            <div className="section-subtitle">Individual trip revenue distribution and bank transfer audit trail</div>
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Driver & Bank Account</th>
                <th>Associated Trip</th>
                <th>Gross Fare</th>
                <th>Rentox Commission</th>
                <th>Driver Net Payout</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: '#f59e0b', fontSize: '0.875rem' }}>{s.id}</b>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.date}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: '#111827', fontSize: '0.875rem' }}>{s.driver}</b>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.account}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem' }}>{s.tripId}</span>
                  </td>
                  <td>
                    <b style={{ color: '#111827', fontSize: '0.875rem' }}>{s.grossFare}</b>
                  </td>
                  <td>
                    <span style={{ color: '#c2410c', fontWeight: 600, fontSize: '0.8125rem' }}>{s.companyShare}</span>
                  </td>
                  <td>
                    <b style={{ color: '#059669', fontSize: '0.9375rem' }}>{s.driverNet}</b>
                  </td>
                  <td>
                    <Badge variant={s.status === 'Paid' ? 'green' : 'amber'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td>
                    {s.status === 'Pending' ? (
                      <button
                        onClick={() => handleProcessPayout(s.id)}
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Send style={{ width: '12px', height: '12px' }} />
                        <span>Disburse</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Disbursed ✓</span>
                    )}
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

export default Settlements;
