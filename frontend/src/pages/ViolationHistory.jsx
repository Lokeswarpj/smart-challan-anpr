import React, { useState, useEffect } from 'react';
import { Search, Download, FileSpreadsheet, Calendar, History, ShieldAlert, RotateCw } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import { challanService } from '../services/challanService';
import { reportService } from '../services/reportService';

export default function ViolationHistory() {
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const data = await challanService.getChallans(100);
      if (data && Array.isArray(data)) {
        setViolations(data);
      }
    } catch (err) {
      console.warn('[ViolationHistory] Failed to fetch live challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const filtered = violations.filter((v) => {
    const reg = (v.registration_number || '').toLowerCase();
    const query = vehicleQuery.toLowerCase();
    const matchesPlate = !vehicleQuery || reg.includes(query);
    const matchesStatus = selectedStatus === 'ALL' || (v.payment_status || '').toUpperCase() === selectedStatus;
    return matchesPlate && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="VIOLATION TIMELINE & REPEAT OFFENDERS"
        subtitle="Chronological audit history of vehicle violations, repeat offender patterns, and court records."
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => reportService.exportReport('xlsx')}
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
            >
              EXPORT EXCEL
            </Button>
            <Button
              onClick={() => reportService.exportReport('pdf')}
              variant="accent"
              size="sm"
              icon={Download}
            >
              EXPORT PDF
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-96">
          <Input
            placeholder="Filter by vehicle plate (e.g. KA53Z9000)..."
            value={vehicleQuery}
            onChange={(e) => setVehicleQuery(e.target.value.toUpperCase())}
            icon={Search}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {['ALL', 'UNPAID', 'PAID', 'DISPUTED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 text-xs font-bold font-sans uppercase border border-primary ${
                  selectedStatus === st ? 'bg-accent text-primary font-black shadow-brutal-sm' : 'bg-surface dark:bg-surface-dark text-secondary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchViolations}
            disabled={loading}
            className="p-2 border border-primary hover:bg-accent transition-colors shadow-brutal-sm"
            title="Refresh violation history"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        {loading && violations.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-surface border-2 border-primary shadow-brutal text-secondary font-mono text-sm animate-pulse">
            CONNECTING TO REPOSITORY & LOADING VIOLATIONS TIMELINE...
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary text-accent flex-shrink-0 flex items-center justify-center font-heading text-lg border border-primary">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-lg text-primary dark:text-accent">
                      {item.registration_number}
                    </span>
                    <Badge variant={item.payment_status} size="sm">
                      {item.payment_status}
                    </Badge>
                    {item.challan_number && (
                      <span className="text-[10px] font-mono text-gray-400">
                        {item.challan_number}
                      </span>
                    )}
                  </div>
                  <h4 className="font-sans font-bold text-sm text-primary dark:text-white mt-1">
                    {item.violation_title}
                  </h4>
                  <p className="text-xs font-mono text-secondary dark:text-gray-400 mt-0.5">
                    {item.rule_section} • Location: {item.location}
                  </p>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
                <div className="font-heading text-2xl font-black text-primary dark:text-white">
                  ₹{Number(item.fine_amount).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-mono text-gray-500">
                  {item.issued_at}
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-surface border-2 border-primary shadow-brutal text-secondary text-sm font-sans">
            No violation history matches your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
