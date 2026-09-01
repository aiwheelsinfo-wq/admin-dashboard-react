import React, { useState } from 'react';
import Badge from '../../components/common/Badge';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Phone,
  FileText,
  Star,
  Award
} from 'lucide-react';

const Drivers = () => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [drivers, setDrivers] = useState([
    {
      id: 101,
      name: 'Santosh Jadhav',
      phone: '+91 98220 11928',
      city: 'Pune / Mumbai',
      car: 'Maruti Dzire (Sedan)',
      plate: 'MH12-RN4021',
      rating: 4.9,
      totalTrips: 342,
      dlVerified: true,
      rcVerified: true,
      isApproved: true,
      isOnline: true,
    },
    {
      id: 102,
      name: 'Amit Deshmukh',
      phone: '+91 97654 33210',
      city: 'Pune / Shirdi',
      car: 'Maruti Ertiga (SUV)',
      plate: 'MH14-AZ9912',
      rating: 4.8,
      totalTrips: 215,
      dlVerified: true,
      rcVerified: true,
      isApproved: true,
      isOnline: true,
    },
    {
      id: 103,
      name: 'Ramesh Pawar',
      phone: '+91 99200 44551',
      city: 'Mumbai / Goa',
      car: 'Toyota Innova Crysta',
      plate: 'MH01-CK7744',
      rating: 5.0,
      totalTrips: 512,
      dlVerified: true,
      rcVerified: true,
      isApproved: true,
      isOnline: false,
    },
    {
      id: 104,
      name: 'Vikas Patil',
      phone: '+91 94230 77112',
      city: 'Nashik / Mumbai',
      car: 'Hyundai Aura (Sedan)',
      plate: 'MH15-EX1029',
      rating: 4.6,
      totalTrips: 48,
      dlVerified: true,
      rcVerified: false,
      isApproved: false,
      isOnline: false,
    },
  ]);

  const handleToggleApproval = (id) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === id) {
        const next = !d.isApproved;
        addToast(`Driver ${d.name} ${next ? 'approved for live dispatch' : 'suspended'}`, next ? 'success' : 'warning');
        return { ...d, isApproved: next };
      }
      return d;
    }));
  };

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  );

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
              <Users style={{ width: '20px', height: '20px' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
              Partner Driver Fleet & Document Verification
            </h1>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
            Verify Driving Licenses, Vehicle RC documents, approve driver partners, and monitor online dispatch readiness.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Badge variant="green">{drivers.filter(d => d.isOnline).length} Drivers Online</Badge>
          <Badge variant="blue">{drivers.length} Total Registered</Badge>
        </div>
      </div>

      {/* Driver Roster Card */}
      <div className="glass-card">
        {/* Search */}
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
              placeholder="Search by driver name, license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Driver Profile</th>
                <th>Vehicle & Plate</th>
                <th>Base Hub</th>
                <th>Performance</th>
                <th>Document Verification</th>
                <th>Online Readiness</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <b style={{ color: '#111827', fontSize: '0.875rem' }}>{d.name}</b>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{d.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: '#111827', fontSize: '0.8125rem' }}>{d.car}</b>
                      <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{d.plate}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: '#4b5563' }}>{d.city}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star style={{ width: '14px', height: '14px', fill: '#f59e0b', color: '#f59e0b' }} />
                      <b style={{ color: '#111827', fontSize: '0.8125rem' }}>{d.rating}</b>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({d.totalTrips} trips)</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Badge variant={d.dlVerified ? 'green' : 'rose'}>
                        {d.dlVerified ? 'DL ✓' : 'DL Missing'}
                      </Badge>
                      <Badge variant={d.rcVerified ? 'green' : 'rose'}>
                        {d.rcVerified ? 'RC ✓' : 'RC Missing'}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: d.isOnline ? '#10b981' : '#9ca3af'
                      }} />
                      <span style={{ fontSize: '0.8125rem', color: d.isOnline ? '#059669' : '#6b7280', fontWeight: 600 }}>
                        {d.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <ToggleSwitch
                      checked={d.isApproved}
                      onChange={() => handleToggleApproval(d.id)}
                    />
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

export default Drivers;
