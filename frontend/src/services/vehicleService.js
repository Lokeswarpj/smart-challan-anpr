import apiClient from './apiClient';
import { MOCK_VEHICLES } from '../mocks/vehicles';

export const vehicleService = {
  async lookupVehicle(registrationNumber) {
    const cleanPlate = registrationNumber.replace(/[\s-]/g, '').toUpperCase();
    try {
      const response = await apiClient.get(`/vehicles/${cleanPlate}`);
      return { ...response.data, is_mock: false };
    } catch (err) {
      // Mock Fallback
      const match = MOCK_VEHICLES.find(
        (v) => v.registration_number.replace(/[\s-]/g, '').toUpperCase() === cleanPlate
      );
      if (match) {
        return { ...match, is_mock: true };
      }
      throw new Error(err.response?.data?.detail || `No record found for registration plate ${cleanPlate}`);
    }
  },

  getAllVehicles() {
    return MOCK_VEHICLES;
  }
};

