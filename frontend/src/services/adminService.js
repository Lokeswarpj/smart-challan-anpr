import { MOCK_VEHICLES } from '../mocks/vehicles';
import { MOCK_OFFICERS } from '../mocks/officers';
import { MOCK_DASHBOARD } from '../mocks/dashboard';

let adminVehicles = [...MOCK_VEHICLES];
let adminOfficers = [...MOCK_OFFICERS];

export const adminService = {
  getVehicles() {
    return adminVehicles;
  },

  deleteVehicle(regNo) {
    adminVehicles = adminVehicles.filter(v => v.registration_number !== regNo);
    return true;
  },

  getOfficers() {
    return adminOfficers;
  },

  getActivityLogs() {
    return MOCK_DASHBOARD.recent_activity_log;
  }
};
