import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  Camera,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { reportService } from '../services/reportService';
import { challanService } from '../services/challanService';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [challans, setChallans] = useState([]);

  useEffect(() => {
    reportService.getDashboardAnalytics().then(setData);
    challanService.getChallans().then(setChallans);
  }, []);

  if (!data) return null;

  const metrics = [
    {
      label: 'TOTAL VEHICLES CHECKED',
      value: data.metrics.total_checked,
      icon: Car,
      change: '+14% today',
      variant: 'primary',
    },
    {
      label: 'FULLY COMPLIANT (ALL GREEN)',
      value: data.metrics.valid_vehicles,
      icon: CheckCircle2,
      change: '70.3% compliance rate',
      variant: 'success',
    },
    {
      label: 'EXPIRED / PENDING WARNINGS',
      value: data.metrics.expired_documents,
      icon: AlertTriangle,
      change: `${data.metrics.amber_warnings} expiring soon`,
      variant: 'danger',
    },
    {
      label: 'TOTAL CHALLANS ISSUED',
      value: data.metrics.challans_issued,
      icon: Receipt,
      change: `₹${(data.metrics.collection_amount / 1000).toFixed(1)}k penalty logged`,
      variant: 'accent',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="ENFORCEMENT OVERVIEW"
        subtitle="Live roadside document verification metrics and real-time checkpoint telemetry."
        action={
          <div className="flex gap-3">
            <Link to="/anpr-scanner">
              <Button variant="accent" size="sm" icon={Camera}>
                OPEN ANPR SCANNER
              </Button>
            </Link>
            <Link to="/vehicle-verification">
              <Button variant="primary" size="sm" icon={Search}>
                VERIFY VEHICLE
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-surface border-2 border-primary shadow-brutal flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase text-secondary dark:text-gray-300">
                  {m.label}
                </span>
                <div className="p-2 border border-primary bg-surface dark:bg-surface-dark">
                  <Icon className="w-4 h-4 text-primary dark:text-accent" />
                </div>
              </div>
              <div>
                <div className="font-heading text-4xl text-primary dark:text-white mb-2">
                  {m.value}
                </div>
                <div className="text-xs font-mono font-bold text-secondary dark:text-gray-400">
                  {m.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="flex items-center justify-between pb-4 border-b border-primary/20 mb-6">
            <div>
              <h3 className="font-heading text-xl text-primary dark:text-white">
                HOURLY VERIFICATION VOLUME
              </h3>
              <p className="text-xs font-sans text-secondary dark:text-gray-400">
                Vehicle inspection throughput vs detected violations across shifts.
              </p>
            </div>
            <span className="text-xs font-mono bg-accent text-primary px-2 py-0.5 border border-primary font-bold">
              TODAY
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activity_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="time" stroke="#171E19" fontSize={11} />
                <YAxis stroke="#171E19" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171E19',
                    border: '1px solid #FFE17C',
                    color: '#fff',
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="checks"
                  stroke="#171E19"
                  fill="#FFE17C"
                  fillOpacity={0.6}
                  strokeWidth={2}
                  name="Total Checks"
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Violations Flagged"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Breakdown (1 col) */}
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-primary/20 mb-6">
              <h3 className="font-heading text-xl text-primary dark:text-white">
                DOCUMENT STATUS SPLIT
              </h3>
              <ShieldAlert className="w-5 h-5 text-accent" />
            </div>

            <div className="space-y-4">
              {data.document_breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-sans font-bold">
                    <span className="text-primary dark:text-gray-200">{item.name}</span>
                    <span className="font-mono text-secondary dark:text-gray-400">{item.count}</span>
                  </div>
                  <div className="w-full bg-surface dark:bg-gray-800 h-2 border border-primary/20">
                    <div
                      className="h-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${Math.min(100, (item.count / 310) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-primary/20 mt-6">
            <Link to="/reports">
              <Button variant="outline" size="sm" className="w-full">
                VIEW DETAILED ANALYTICS <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Challans & Officer Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="flex items-center justify-between pb-4 border-b border-primary/20 mb-4">
            <h3 className="font-heading text-xl text-primary dark:text-white">
              RECENT DIGITAL CHALLANS
            </h3>
            <Link to="/challans" className="text-xs font-bold text-secondary dark:text-accent hover:underline">
              VIEW ALL ({challans.length})
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {challans.slice(0, 4).map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-primary dark:text-white">
                      {c.registration_number}
                    </span>
                    <Badge variant={c.payment_status} size="sm">
                      {c.payment_status}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary dark:text-gray-400 font-sans mt-0.5">
                    {c.violation_title}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-heading text-lg text-primary dark:text-accent font-bold">
                    ₹{c.fine_amount}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">
                    {c.id.split('-').slice(0, 3).join('-')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log / Officer Activity */}
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <div className="flex items-center justify-between pb-4 border-b border-primary/20 mb-4">
            <h3 className="font-heading text-xl text-primary dark:text-white">
              CHECKPOINT AUDIT TRAIL
            </h3>
            <span className="text-[10px] font-mono bg-surface border border-primary px-2 py-0.5 font-bold">
              TAMPER-PROOF LOG
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800 font-sans text-xs">
            {data.recent_activity_log.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-accent bg-primary px-1.5 py-0.5 text-[10px]">
                      {log.officer}
                    </span>
                    <span className="font-bold text-primary dark:text-white">{log.action}</span>
                  </div>
                  <p className="text-secondary dark:text-gray-300">
                    Plate: <strong className="font-mono">{log.plate}</strong> — {log.result}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
