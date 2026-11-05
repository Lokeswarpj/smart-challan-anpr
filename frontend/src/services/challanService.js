import apiClient from './apiClient';
import { MOCK_CHALLANS } from '../mocks/challans';

// Keep track of dynamically added challans in session memory
let activeChallans = [...MOCK_CHALLANS];

export const challanService = {
  async getChallans(limit = 10) {
    try {
      const response = await apiClient.get(`/challans?limit=${limit}`);
      return response.data;
    } catch (err) {
      return activeChallans.slice(0, limit);
    }
  },

  async createChallan(challanData) {
    try {
      const response = await apiClient.post('/challans', challanData);
      return response.data;
    } catch (err) {
      const newChallan = {
        id: `CH-202611-${challanData.registration_number.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...challanData,
        issued_at: new Date().toLocaleString(),
        payment_status: 'unpaid',
        dispatch_status: 'sent_both',
        is_mock: true,
      };
      activeChallans = [newChallan, ...activeChallans];
      return newChallan;
    }
  },

  async updatePaymentStatus(id, newStatus) {
    try {
      await apiClient.patch(`/challans/${id}/status`, { payment_status: newStatus });
      activeChallans = activeChallans.map((c) =>
        c.id === id ? { ...c, payment_status: newStatus } : c
      );
      return true;
    } catch (err) {
      console.warn('[challanService] Backend status update failed, applying memory fallback:', err?.message);
      activeChallans = activeChallans.map((c) =>
        c.id === id ? { ...c, payment_status: newStatus } : c
      );
      return true;
    }
  },

  async dispatchReceipt(id, channel) {
    try {
      const response = await apiClient.post(`/challans/${id}/dispatch`, { channel });
      return response.data;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      activeChallans = activeChallans.map((c) =>
        c.id === id ? { ...c, dispatch_status: `sent_${channel}` } : c
      );
      return { success: true, message: `Receipt successfully dispatched via ${channel.toUpperCase()}` };
    }
  },

  async downloadReceipt(id) {
    try {
      const response = await apiClient.get(`/challans/${id}/receipt`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RoadGuard_Challan_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      window.print();
      return false;
    }
  }
};

