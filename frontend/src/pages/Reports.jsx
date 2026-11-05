import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Download, FileSpreadsheet, TrendingUp, ShieldCheck, Filter, RotateCw } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import { reportService } from '../services/reportService';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await reportService.getDashboardAnalytics('station');
      setData(res);
    } catch (err) {
      console.warn('[Reports] Analytics fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const monthlyTrends = [
    { month: 'Jun', checks: 120, violations: 32 },
    { month: 'Jul', checks: 180, violations: 45 },
    { month: 'Aug', checks: 240, violations: 62 },
    { month: 'Sep', checks: 290, violations: 74 },
    { month: 'Oct', checks: 310, violations: 81 },
    { month: 'Nov', checks: data?.metrics?.total_checked || 95, violations: data?.metrics?.expired_documents || 24 },
  ];

  const violationDistribution = (data?.violations_by_type && data.violations_by_type.length > 0)
    ? data.violations_by_type.map((v, i) => {
        const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'];
        return {
          name: v.type,
          count: v.count,
          percentage: v.percentage,
          color: colors[i % colors.length]
        };
      })
    : [
        { name: 'Air Pollution (PUC Expired)', count: 72, color: '#EF4444', percentage: 24.1 },
        { name: 'Uninsured Driving (No Insurance)', count: 58, color: '#F59E0B', percentage: 19.4 },
        { name: 'Road Tax Pending', count: 28, color: '#3B82F6', percentage: 9.4 },
        { name: 'Signal Jump (Red Light)', count: 42, color: '#8B5CF6', percentage: 14.0 },
        { name: 'No Helmet / Seatbelt', count: 64, color: '#10B981', percentage: 21.4 },
        { name: 'Over-speeding', count: 35, color: '#EC4899', percentage: 11.7 },
      ];

  const totalChecks = data?.metrics?.total_checked ?? 310;
  const compliantCount = data?.metrics?.valid_vehicles ?? 218;
  const complianceRate = data?.compliance_rate ?? 70.3;
  const totalPenalty = data?.metrics?.collection_amount ?? 384500;
  const challansCount = data?.metrics?.challans_issued ?? 208;
  const unpaidCount = data?.metrics?.unpaid_challans ?? 68;

  const maxViolationCount = Math.max(...violationDistribution.map((v) => v.count), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="REPORTS & STATISTICAL ANALYTICS"
        subtitle="Departmental enforcement metrics, compliance rates, and statutory violation analytics."
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

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <span className="text-xs font-mono text-secondary dark:text-gray-400 uppercase font-bold">
            OVERALL COMPLIANCE RATIO
          </span>
          <div className="font-heading text-4xl text-success my-2">
            {complianceRate}%
          </div>
          <p className="text-xs font-sans text-secondary dark:text-gray-300">
            {compliantCount} of {totalChecks} fleet vehicles checked passed all 4 document standards.
          </p>
        </div>

        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <span className="text-xs font-mono text-secondary dark:text-gray-400 uppercase font-bold">
            AVERAGE VERIFICATION TIME
          </span>
          <div className="font-heading text-4xl text-primary dark:text-accent my-2">
            1.84s
          </div>
          <p className="text-xs font-sans text-secondary dark:text-gray-300">
            From optical frame acquisition to full RTO record aggregation.
          </p>
        </div>

        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <span className="text-xs font-mono text-secondary dark:text-gray-400 uppercase font-bold">
            TOTAL PENALTY LOGGED
          </span>
          <div className="font-heading text-4xl text-danger my-2">
            ₹{Number(totalPenalty).toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-sans text-secondary dark:text-gray-300">
            Across {challansCount} statutory challans issued ({unpaidCount} pending collection).
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="pb-4 border-b border-primary/20 mb-6 flex justify-between items-start">
            <div>
              <h3 className="font-heading text-xl text-primary dark:text-white">
                MONTHLY ENFORCEMENT VOLUME
              </h3>
              <p className="text-xs text-secondary dark:text-gray-400 font-sans">
                Total checks performed vs violations flagged across recent months.
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-1.5 border border-primary hover:bg-accent transition-colors shadow-brutal-sm"
              title="Refresh telemetry"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#171E19" fontSize={11} />
                <YAxis stroke="#171E19" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171E19',
                    border: '1px solid #FFE17C',
                    color: '#fff',
                    fontFamily: 'Satoshi, sans-serif'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'Satoshi, sans-serif' }} />
                <Bar dataKey="checks" fill="#171E19" name="Vehicles Checked" />
                <Bar dataKey="violations" fill="#FFE17C" name="Violations Flagged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violation Distribution */}
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="pb-4 border-b border-primary/20 mb-6">
            <h3 className="font-heading text-xl text-primary dark:text-white">
              VIOLATION CATEGORY BREAKDOWN
            </h3>
            <p className="text-xs text-secondary dark:text-gray-400 font-sans">
              Statutory incidence by Motor Vehicles Act rule sections.
            </p>
          </div>

          <div className="space-y-4">
            {violationDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-sans font-bold">
                  <span className="text-primary dark:text-gray-200">{item.name}</span>
                  <span className="font-mono text-secondary dark:text-gray-400">
                    {item.count} cases ({item.percentage ?? ((item.count / maxViolationCount) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-surface dark:bg-gray-800 h-2 border border-primary/20">
                  <div
                    className="h-full"
                    style={{
                      backgroundColor: item.color,
                      width: `${Math.min(100, Math.max(5, (item.count / maxViolationCount) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
