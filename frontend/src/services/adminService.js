import apiClient from './apiClient';
import { MOCK_VEHICLES } from '../mocks/vehicles';
import { MOCK_OFFICERS } from '../mocks/officers';
import { MOCK_DASHBOARD } from '../mocks/dashboard';

export function formatAuditAction(action) {
  switch (action) {
    case 'lookup_anpr':
      return 'Camera ANPR Scan';
    case 'lookup_manual':
      return 'Manual Verification';
    case 'issue_challan':
      return 'Digital Challan Issued';
    case 'delete_vehicle':
      return 'Vehicle Removed';
    case 'create_officer':
      return 'Officer Registered';
    case 'report_export':
      return 'Report Export';
    default:
      if (!action) return 'System Action';
      return action
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    // If it's already a relative string like "10 mins ago"
    if (dateString.includes('ago') || dateString.includes('Just')) {
      return dateString;
    }
    const cleanDate = dateString.includes('Z') || dateString.includes('+') ? dateString : dateString.replace(' ', 'T') + 'Z';
    const logDate = new Date(cleanDate);
    const now = new Date();
    const diffMs = now - logDate;

    if (isNaN(diffMs) || diffMs < 0) {
      return dateString;
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return dateString.slice(0, 16);
  } catch (e) {
    return dateString;
  }
}

let cachedVehicles = [...MOCK_VEHICLES];
let cachedOfficers = [...MOCK_OFFICERS];
let cachedLogs = [...MOCK_DASHBOARD.recent_activity_log];

export const adminService = {
  // Asynchronous live endpoints (preferred)
  async getVehicles(search = '') {
    try {
      const url = search ? `/admin/vehicles?query=${encodeURIComponent(search)}` : '/admin/vehicles';
      const response = await apiClient.get(url);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        cachedVehicles = response.data;
        return response.data;
      }
    } catch (err) {
      console.warn('[adminService] Backend /admin/vehicles unreachable, using local cache:', err?.message);
    }
    return cachedVehicles;
  },

  async deleteVehicle(regNo) {
    try {
      await apiClient.delete(`/admin/vehicles/${encodeURIComponent(regNo)}`);
    } catch (err) {
      console.warn('[adminService] Backend delete failed, applying local state update:', err?.message);
    }
    cachedVehicles = cachedVehicles.filter((v) => v.registration_number !== regNo);
    return true;
  },

  async getOfficers() {
    try {
      const response = await apiClient.get('/admin/officers');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        cachedOfficers = response.data;
        return response.data;
      }
    } catch (err) {
      console.warn('[adminService] Backend /admin/officers unreachable, using local cache:', err?.message);
    }
    return cachedOfficers;
  },

  async getActivityLogs(limit = 50) {
    try {
      const response = await apiClient.get(`/admin/audit-logs?limit=${limit}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const normalized = response.data.map((log) => ({
          id: log.id,
          officer: log.officer_badge || 'SYSTEM',
          action: formatAuditAction(log.action),
          plate: log.registration_queried || 'N/A',
          result: log.details || 'System event recorded',
          timestamp: formatRelativeTime(log.timestamp),
          rawTimestamp: log.timestamp,
        }));
        cachedLogs = normalized;
        return normalized;
      }
    } catch (err) {
      console.warn('[adminService] Backend /admin/audit-logs unreachable, using fallback logs:', err?.message);
    }
    return cachedLogs;
  },

  // Synchronous cache getters for backwards compatibility
  getVehiclesSync() {
    return cachedVehicles;
  },

  getOfficersSync() {
    return cachedOfficers;
  },

  getActivityLogsSync() {
    return cachedLogs;
  }
};
