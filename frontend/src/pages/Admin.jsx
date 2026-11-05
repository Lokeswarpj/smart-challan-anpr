import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Trash2, UserPlus, Database, Search, ShieldCheck, RotateCw, Activity, Car, Users } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState(() => adminService.getVehiclesSync());
  const [officers, setOfficers] = useState(() => adminService.getOfficersSync());
  const [auditLogs, setAuditLogs] = useState(() => adminService.getActivityLogsSync());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('VEHICLES');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTabContent = useCallback(async (tab, isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      if (tab === 'VEHICLES') {
        const vList = await adminService.getVehicles();
        if (vList && Array.isArray(vList)) setVehicles(vList);
      } else if (tab === 'OFFICERS') {
        const oList = await adminService.getOfficers();
        if (oList && Array.isArray(oList)) setOfficers(oList);
      } else if (tab === 'AUDIT_LOGS') {
        const logs = await adminService.getActivityLogs(100);
        if (logs && Array.isArray(logs)) setAuditLogs(logs);
      }
    } catch (err) {
      console.warn('[Admin] Failed to refresh tab data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTabContent(activeTab);
  }, [activeTab, fetchTabContent]);

  const filteredVehicles = vehicles.filter((v) =>
    (v.registration_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.maker_model || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (regNo) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${regNo} from registry?`)) {
      await adminService.deleteVehicle(regNo);
      setVehicles((prev) => prev.filter((v) => v.registration_number !== regNo));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="ADMINISTRATIVE CONSOLE"
        subtitle="Manage vehicle registry records, officer credentials, and system audit logs."
        action={
          <div className="flex gap-2">
            <span className="bg-primary text-accent px-3 py-1.5 font-mono text-xs font-bold border border-primary flex items-center gap-1.5 shadow-brutal-sm">
              <ShieldCheck className="w-4 h-4" /> ADMIN AUTHORIZED
            </span>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 border-b-2 border-primary pb-3 justify-between items-center">
        <div className="flex gap-3">
          {[
            { id: 'VEHICLES', label: 'VEHICLES', icon: Car },
            { id: 'OFFICERS', label: 'OFFICERS', icon: Users },
            { id: 'AUDIT_LOGS', label: 'AUDIT LOGS', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 font-heading text-sm tracking-wider border-2 border-primary transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-accent text-primary font-black shadow-brutal-sm'
                    : 'bg-white dark:bg-surface text-secondary hover:bg-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fetchTabContent(activeTab, true)}
          disabled={isRefreshing || loading}
          className="px-3 py-2 bg-white dark:bg-surface border-2 border-primary font-mono text-xs font-bold hover:bg-accent transition-colors flex items-center gap-1.5 shadow-brutal-sm disabled:opacity-50"
          title="Refresh live data from server"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          {isRefreshing ? 'SYNCING...' : 'REFRESH'}
        </button>
      </div>

      {/* Tab 1: Vehicle Registry Management */}
      {activeTab === 'VEHICLES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface border-2 border-primary p-4 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search plate, owner, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="text-xs font-mono font-bold text-secondary flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse"></span>
              TOTAL RECORDS: {vehicles.length} (SHOWING {filteredVehicles.length})
            </div>
          </div>

          <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-primary text-white border-b-2 border-primary font-heading tracking-wider">
                  <th className="p-3">REGISTRATION</th>
                  <th className="p-3">MAKE & MODEL</th>
                  <th className="p-3">OWNER</th>
                  <th className="p-3">PHONE</th>
                  <th className="p-3">RTO</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 font-mono">
                      No vehicles found matching query "{search}"
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.registration_number} className="hover:bg-surface/80">
                      <td className="p-3 font-mono font-black text-primary dark:text-accent">
                        {v.registration_number}
                      </td>
                      <td className="p-3 font-medium">{v.maker_model}</td>
                      <td className="p-3">{v.owner_name}</td>
                      <td className="p-3 font-mono text-gray-500">{v.owner_phone}</td>
                      <td className="p-3 text-gray-500">{v.registered_rto}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(v.registration_number)}
                          className="p-1 text-danger hover:bg-red-50 border border-transparent hover:border-danger transition-colors"
                          title="Delete vehicle record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Officers Management */}
      {activeTab === 'OFFICERS' && (
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="pb-4 border-b border-primary/20 mb-6 flex justify-between items-center">
            <h3 className="font-heading text-xl text-primary dark:text-white">
              AUTHORIZED PERSONNEL DIRECTORY
            </h3>
            <span className="text-xs font-mono bg-accent text-primary px-2 py-0.5 border border-primary font-bold">
              {officers.length} ACTIVE BADGES
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-sans">
            {officers.map((off) => (
              <div key={off.id || off.badge_number} className="py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent bg-primary px-2 py-0.5 text-xs">
                      {off.badge_number}
                    </span>
                    <strong className="text-sm text-primary dark:text-white">{off.name}</strong>
                    <Badge variant={off.role === 'admin' ? 'accent' : 'neutral'} size="sm">
                      {off.role}
                    </Badge>
                  </div>
                  <p className="text-gray-500 font-sans mt-1">{off.station}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-gray-400">
                  STATUS: {off.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="pb-4 border-b border-primary/20 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-heading text-xl text-primary dark:text-white">
                SYSTEM ACCESS AUDIT TRAIL
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time cryptographic audit trail of all officer scans, queries, and enforcement actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 px-2.5 py-1 border border-green-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                LIVE DATABASE FEED ({auditLogs.length} EVENTS)
              </span>
            </div>
          </div>

          {loading && auditLogs.length === 0 ? (
            <div className="p-12 text-center font-mono text-sm text-secondary animate-pulse">
              FETCHING AUDIT TRAIL FROM SERVER...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-xs border border-dashed border-primary">
              No audit records currently available. Perform an ANPR scan or verification lookup to generate logs.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-surface dark:bg-surface-dark border border-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:border-accent transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-accent bg-primary px-2 py-0.5 text-[11px] border border-primary shadow-brutal-sm">
                      {log.officer}
                    </span>
                    <span className="font-sans font-bold text-primary dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-gray-500 font-sans">
                      Plate:{' '}
                      <strong className="font-mono text-primary dark:text-accent font-bold">
                        {log.plate}
                      </strong>{' '}
                      <span className="text-gray-400">({log.result})</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-[11px] self-end md:self-auto font-mono">
                    {log.rawTimestamp && (
                      <span className="hidden lg:inline text-[10px] text-gray-400">
                        {log.rawTimestamp.slice(0, 19).replace('T', ' ')} •
                      </span>
                    )}
                    <span className="font-bold text-secondary dark:text-gray-300">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
