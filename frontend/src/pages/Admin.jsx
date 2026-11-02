import React, { useState } from 'react';
import { ShieldAlert, Trash2, UserPlus, Database, Search, ShieldCheck } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState(() => adminService.getVehicles());
  const [officers, setOfficers] = useState(() => adminService.getOfficers());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('VEHICLES');

  const filteredVehicles = vehicles.filter((v) =>
    v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    v.owner_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (regNo) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${regNo}?`)) {
      adminService.deleteVehicle(regNo);
      setVehicles(adminService.getVehicles());
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
      <div className="flex gap-3 border-b-2 border-primary pb-3">
        {['VEHICLES', 'OFFICERS', 'AUDIT_LOGS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 font-heading text-sm tracking-wider border-2 border-primary transition-all ${
              activeTab === tab
                ? 'bg-accent text-primary font-black shadow-brutal-sm'
                : 'bg-white dark:bg-surface text-secondary hover:bg-surface'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab 1: Vehicle Registry Management */}
      {activeTab === 'VEHICLES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-surface border-2 border-primary p-4 shadow-brutal flex justify-between items-center">
            <div className="w-80">
              <Input
                placeholder="Search plate or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="text-xs font-mono font-bold text-secondary">
              TOTAL RECORDS: {vehicles.length}
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
                {filteredVehicles.map((v) => (
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
                ))}
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
              <div key={off.id} className="py-4 flex items-center justify-between">
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
                  STATUS: ACTIVE
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <h3 className="font-heading text-xl text-primary dark:text-white pb-4 border-b border-primary/20 mb-6">
            SYSTEM ACCESS AUDIT TRAIL
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {adminService.getActivityLogs().map((log) => (
              <div key={log.id} className="p-3 bg-surface dark:bg-surface-dark border border-primary flex justify-between items-center">
                <div>
                  <span className="font-bold text-accent bg-primary px-1.5 py-0.5 mr-2">{log.officer}</span>
                  <span className="font-sans font-bold text-primary dark:text-white">{log.action}</span>
                  <span className="text-gray-500 font-sans ml-2">Plate: {log.plate} ({log.result})</span>
                </div>
                <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

