import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/Login/Login';
import Overview from './pages/Overview/Overview';
import OneWayFare from './pages/OneWayFare/OneWayFare';
import RoundTripFare from './pages/RoundTripFare/RoundTripFare';
import LocalTaxiFare from './pages/LocalTaxiFare/LocalTaxiFare';
import SpecialDays from './pages/SpecialDays/SpecialDays';
import Bookings from './pages/Bookings/Bookings';
import CityBoundaries from './pages/CityBoundaries/CityBoundaries';
import SettingsPrivacy from './pages/Settings/SettingsPrivacy';
import LocalDutyFare from './pages/LocalDutyFare/LocalDutyFare';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Overview />} />
                      <Route path="/oneway-fare" element={<OneWayFare />} />
                      <Route path="/roundtrip-fare" element={<RoundTripFare />} />
                      <Route path="/localduty-fare" element={<LocalDutyFare />} />
                      <Route path="/local-taxi-fare" element={<LocalTaxiFare />} />
                      <Route path="/special-days" element={<SpecialDays />} />
                      <Route path="/city-boundaries" element={<CityBoundaries />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/settings" element={<SettingsPrivacy />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
