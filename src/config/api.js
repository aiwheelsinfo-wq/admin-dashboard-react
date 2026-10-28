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
  bookingsManagement: `${ADMIN_BASE_URL}/bookings_management.php`,
  vendorsManagement: `${ADMIN_BASE_URL}/vendors_management.php`,
  onewayFareManagement: `${ADMIN_BASE_URL}/oneway_fare_management.php`,
  roundtripFareManagement: `${ADMIN_BASE_URL}/roundtrip_fare_management.php`,
  localdutyFareManagement: `${ADMIN_BASE_URL}/localduty_fare_management.php`,
  adminAccountSettings: `${ADMIN_BASE_URL}/admin_account_settings.php`,
  getCityBoundaries: `${API_BASE_URL}/get_city_boundaries.php`,
  getSettlements: `${API_BASE_URL}/get_settlements.php`,
  driverAlertSettings: `${API_BASE_URL}/driver_alert_settings.php`,
  supportChat: `${ADMIN_BASE_URL}/support_chat.php`,
  vendorWallet: `${API_BASE_URL}/vendor_wallet.php`,
  driverListAgni: `${ADMIN_BASE_URL}/driver_list_Agni.php`,
  agentsManagement: `${API_BASE_URL}/admin_agent_api.php`,
  carCategoryMaster: `${ADMIN_BASE_URL}/car_category_master_api.php`,
  carCategoryMaster2025: `${API_BASE_URL}/car_category_master_api.php`,
  getServiceStatus: `${API_BASE_URL}/get_service_status.php`,
  updateServiceStatus: `${API_BASE_URL}/update_service_status.php`,
  incidentReports: `${API_BASE_URL}/get_admin_incident_reports.php`,
  updateIncidentStatus: `${API_BASE_URL}/update_incident_status.php`,
  usersManagement: `${API_BASE_URL}/admin_users_api.php`,
};

// Reusable Axios instance with default headers
const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

export default apiClient;
