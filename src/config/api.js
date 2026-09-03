import axios from 'axios';

export const API_BASE_URL = 'https://agnicarrental.com/2025';
export const ADMIN_BASE_URL = 'https://agnicarrental.com/admin2025';
export const DRIVER_BASE_URL = 'https://agnicarrental.com/driver2025';

export const endpoints = {
  // One-Way Dynamic Pricing & Cost List
  selectCarCostList: `${API_BASE_URL}/selectCarCostList.php`,
  getInvoiceData: `${API_BASE_URL}/get_invoice_data.php`,
  
  // Bookings & Trips
  getBookings: `${DRIVER_BASE_URL}/getBookings.php`,
  tripLiveMapping: `${DRIVER_BASE_URL}/trip_live_mapping_backend.php`,
  
  // Admin Management Endpoints
  onewayFareManagement: `${ADMIN_BASE_URL}/oneway_fare_management.php`,
  roundtripFareManagement: `${ADMIN_BASE_URL}/roundtrip_fare_management.php`,
  getCityBoundaries: `${API_BASE_URL}/get_city_boundaries.php`,
  getSettlements: `${API_BASE_URL}/get_settlements.php`,
};

// Reusable Axios instance with default headers
const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

export default apiClient;
