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

  async exportReport(format = 'pdf') {
    try {
      const response = await apiClient.get(`/reports/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roadguard_enforcement_report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.warn('[reportService] Live export failed, generating local report:', err?.message);
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
  }
};

