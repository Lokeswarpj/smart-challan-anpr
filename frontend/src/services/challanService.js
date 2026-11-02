import apiClient from './apiClient';
import { MOCK_CHALLANS } from '../mocks/challans';

// Keep track of dynamically added challans in session memory
let activeChallans = [...MOCK_CHALLANS];

export const challanService = {
  async getChallans() {
    try {
      const response = await apiClient.get('/challans');
      return response.data;
    } catch (err) {
      return activeChallans;
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
    activeChallans = activeChallans.map((c) =>
      c.id === id ? { ...c, payment_status: newStatus } : c
    );
    return true;
  },

  async dispatchReceipt(id, channel) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    activeChallans = activeChallans.map((c) =>
      c.id === id ? { ...c, dispatch_status: `sent_${channel}` } : c
    );
    return { success: true, message: `Receipt successfully dispatched via ${channel.toUpperCase()}` };
  }
};
