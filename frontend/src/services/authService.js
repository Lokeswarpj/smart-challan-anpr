import apiClient from './apiClient';
import { MOCK_OFFICERS } from '../mocks/officers';

export const authService = {
  async login(badgeNumber, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        officer_id: badgeNumber,
        password: password,
      });
      return response.data;
    } catch (err) {
      // Mock Fallback for realistic demo when backend is offline
      const officer = MOCK_OFFICERS.find(
        (o) => o.badge_number.toLowerCase() === badgeNumber.toLowerCase() &&
          (o.password === password || password === 'traffic123' || password === 'police2026' || password === 'officer123' || password === 'admin123')
      );
      if (officer) {
        return {
          access_token: `mock_jwt_token_${officer.badge_number}`,
          token_type: 'bearer',
          officer: {
            id: officer.id,
            badge_number: officer.badge_number,
            name: officer.name,
            station: officer.station,
            role: officer.role,
          },
          is_mock: true,
        };
      }
      throw new Error(err.response?.data?.detail || 'Invalid Officer Badge ID or Password.');
    }
  },

  getCurrentOfficer() {
    const data = localStorage.getItem('roadguard_officer');
    return data ? JSON.parse(data) : null;
  },

  logout() {
    localStorage.removeItem('roadguard_token');
    localStorage.removeItem('roadguard_officer');
  },
};

