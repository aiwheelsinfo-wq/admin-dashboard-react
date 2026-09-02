import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import { ToastProvider } from './context/ToastContext';

// Pages
import Overview from './pages/Overview/Overview';
import OneWayFare from './pages/OneWayFare/OneWayFare';
import LocalTaxiFare from './pages/LocalTaxiFare/LocalTaxiFare';
import SpecialDays from './pages/SpecialDays/SpecialDays';
import Bookings from './pages/Bookings/Bookings';

function App() {
  return (
    <ToastProvider>
      <Router>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/oneway-fare" element={<OneWayFare />} />
            <Route path="/local-taxi-fare" element={<LocalTaxiFare />} />
            <Route path="/special-days" element={<SpecialDays />} />
            <Route path="/bookings" element={<Bookings />} />
          </Routes>
        </DashboardLayout>
      </Router>
    </ToastProvider>
  );
}

export default App;
