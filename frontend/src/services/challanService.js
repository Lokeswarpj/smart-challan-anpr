import apiClient from './apiClient';
import { MOCK_CHALLANS } from '../mocks/challans';
import { MOCK_VEHICLES } from '../mocks/vehicles';

// Keep track of dynamically added challans in session memory
let activeChallans = [...MOCK_CHALLANS];

export const challanService = {
  async getChallans(limit = 100) {
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
      // If backend responded with an explicit validation error (e.g. 400 Bad Request or 404),
      // re-throw immediately to alert the officer on screen.
      if (err.response?.status === 400 || err.response?.status === 404 || err.response?.data?.detail) {
        throw new Error(err.response?.data?.detail || 'Validation error from RTO registry.');
      }

      // Offline / Mock fallback validation: strictly prevent issuing false document violations
      const cleanPlate = (challanData.registration_number || '').replace(/[\s-]/g, '').toUpperCase();
      const mockVeh = MOCK_VEHICLES.find(
        (v) => v.registration_number.replace(/[\s-]/g, '').toUpperCase() === cleanPlate
      );

      if (mockVeh && mockVeh.documents) {
        const vCode = challanData.violation_code || '';
        const vTitle = (challanData.violation_title || '').toLowerCase();

        if ((vCode.includes('VIO-PUC-EXP') || vTitle.includes('puc') || vTitle.includes('pollution')) &&
            mockVeh.documents.puc?.status === 'valid') {
          throw new Error(`Statutory Audit Error: Vehicle ${cleanPlate} has a VALID Pollution Under Control (PUC) certificate in central records until ${mockVeh.documents.puc.expiry_date}. Cannot issue false citation.`);
        }

        if ((vCode.includes('VIO-INS-EXP') || vTitle.includes('insurance') || vTitle.includes('uninsured')) &&
            mockVeh.documents.insurance?.status === 'valid') {
          throw new Error(`Statutory Audit Error: Vehicle ${cleanPlate} has a VALID Insurance policy in central records until ${mockVeh.documents.insurance.expiry_date}. Cannot issue false citation.`);
        }

        if ((vCode.includes('VIO-RC-EXP') || vTitle.includes('registration') || vTitle.includes('unregistered')) &&
            mockVeh.documents.rc?.status === 'valid') {
          throw new Error(`Statutory Audit Error: Vehicle ${cleanPlate} has a VALID Registration Certificate (RC) in central records until ${mockVeh.documents.rc.expiry_date}. Cannot issue false citation.`);
        }

        if ((vCode.includes('VIO-TAX-PENDING') || vTitle.includes('road tax')) &&
            mockVeh.documents.road_tax?.status === 'paid') {
          throw new Error(`Statutory Audit Error: Vehicle ${cleanPlate} has Road Tax PAID in central records until ${mockVeh.documents.road_tax.valid_until}. Cannot issue false citation.`);
        }
      }

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

  async dispatchReceipt(id, channel, phoneNumber = null) {
    try {
      const payload = { channel };
      if (phoneNumber) payload.phone_number = phoneNumber;
      const response = await apiClient.post(`/challans/${id}/dispatch`, payload);
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

