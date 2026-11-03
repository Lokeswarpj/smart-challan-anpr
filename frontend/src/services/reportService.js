import apiClient from './apiClient';
import { MOCK_DASHBOARD } from '../mocks/dashboard';

export const reportService = {
  async getDashboardAnalytics(scope = 'station') {
    try {
      const response = await apiClient.get(`/reports/dashboard?scope=${scope}`);
      return response.data;
    } catch (err) {
      return MOCK_DASHBOARD;
    }
  },

  exportReport(format = 'pdf') {
    // Generate browser download simulation for demo
    const blob = new Blob([`ROADGUARD Traffic Enforcement Report - Exported: ${new Date().toISOString()}`], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadguard_enforcement_report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }
};

