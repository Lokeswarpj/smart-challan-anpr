import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  MessageSquare,
  QrCode,
  Shield,
  Plus,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { challanService } from '../services/challanService';

export default function Challans() {
  const [challans, setChallans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [dispatchMessage, setDispatchMessage] = useState('');

  useEffect(() => {
    challanService.getChallans().then(setChallans);
  }, []);

  const filteredChallans = challans.filter((c) => {
    const matchesSearch =
      c.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.violation_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || c.payment_status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDispatch = async (channel) => {
    if (!selectedChallan) return;
    setDispatchMessage(`Dispatching via ${channel.toUpperCase()}...`);
    const res = await challanService.dispatchReceipt(selectedChallan.id, channel);
    setDispatchMessage(res.message);
    const updated = await challanService.getChallans();
    setChallans(updated);
    setTimeout(() => setDispatchMessage(''), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="CHALLAN MANAGEMENT"
        subtitle="Search, filter, inspect digital challans, and issue spot receipts."
        action={
          <Link to="/challans/new">
            <Button variant="accent" size="sm" icon={Plus}>
              ISSUE NEW CHALLAN
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search plate, Challan ID, or violation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'UNPAID', 'PAID', 'DISPUTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold font-sans uppercase border border-primary transition-colors ${
                statusFilter === st
                  ? 'bg-accent text-primary font-black shadow-brutal-sm'
                  : 'bg-surface dark:bg-surface-dark text-secondary hover:text-black'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Challan Table */}
      <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary text-white border-b-2 border-primary text-xs font-heading tracking-wider">
              <th className="p-4">CHALLAN ID</th>
              <th className="p-4">PLATE NUMBER</th>
              <th className="p-4">VIOLATION TYPE</th>
              <th className="p-4">FINE (₹)</th>
              <th className="p-4">DATE & TIME</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs font-sans">
            {filteredChallans.map((ch) => (
              <tr
                key={ch.id}
                className="hover:bg-surface/80 dark:hover:bg-surface-dark transition-colors"
              >
                <td className="p-4 font-mono font-bold text-primary dark:text-gray-200">
                  {ch.id}
                </td>
                <td className="p-4 font-mono font-black text-sm text-primary dark:text-accent">
                  {ch.registration_number}
                </td>
                <td className="p-4 text-secondary dark:text-gray-300 font-medium max-w-xs truncate">
                  {ch.violation_title}
                  <div className="text-[10px] text-gray-500 font-mono">{ch.rule_section}</div>
                </td>
                <td className="p-4 font-heading text-sm text-primary dark:text-white font-bold">
                  ₹{ch.fine_amount}
                </td>
                <td className="p-4 font-mono text-gray-500">
                  {ch.issued_at}
                </td>
                <td className="p-4">
                  <Badge variant={ch.payment_status} size="sm">
                    {ch.payment_status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <Button
                    onClick={() => setSelectedChallan(ch)}
                    variant="outline"
                    size="sm"
                    icon={Eye}
                  >
                    RECEIPT
                  </Button>
                </td>
              </tr>
            ))}
            {filteredChallans.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-secondary text-sm font-sans">
                  No matching challan records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Official Challan Receipt Preview Modal (Section 13 Requirement) */}
      {selectedChallan && (
        <Modal
          isOpen={!!selectedChallan}
          onClose={() => setSelectedChallan(null)}
          title={`CHALLAN RECEIPT — ${selectedChallan.id}`}
        >
          <div className="space-y-6 print:m-0 font-sans">
            {/* Dispatch Banner Message */}
            {dispatchMessage && (
              <div className="p-3 bg-accent border-2 border-primary text-xs font-mono font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{dispatchMessage}</span>
              </div>
            )}

            {/* Printable Receipt Canvas */}
            <div className="p-6 border-2 border-primary bg-white text-primary shadow-brutal-sm">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-primary mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary text-accent flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-heading text-lg tracking-wider">ROADGUARD TRAFFIC POLICE</h4>
                    <p className="text-[10px] font-mono text-secondary">DEPARTMENT OF POLICE ENFORCEMENT</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-primary">OFFICIAL E-RECEIPT</div>
                  <div className="text-[10px] font-mono text-gray-500">{selectedChallan.id}</div>
                </div>
              </div>

              {/* Receipt Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-4 border-b border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">VEHICLE NUMBER</span>
                  <strong className="font-mono text-base font-black">{selectedChallan.registration_number}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">REGISTERED OWNER</span>
                  <strong>{selectedChallan.owner_name || 'Vehicle Owner on Record'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">DATE & TIME</span>
                  <span className="font-mono">{selectedChallan.issued_at}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">LOCATION</span>
                  <span>{selectedChallan.location}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">ISSUING OFFICER</span>
                  <span>{selectedChallan.officer_name || 'Traffic Officer'} ({selectedChallan.officer_badge || 'KA-POL-1001'})</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-bold">PAYMENT DUE DATE</span>
                  <span className="font-mono text-danger font-bold">{selectedChallan.due_date}</span>
                </div>
              </div>

              {/* Violation & Penalty Box */}
              <div className="my-4 p-4 bg-surface border border-primary flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase block">{selectedChallan.violation_title}</span>
                  <span className="text-[11px] font-mono text-secondary">{selectedChallan.rule_section}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block font-mono">STATUTORY PENALTY</span>
                  <span className="font-heading text-2xl font-black text-danger">₹{selectedChallan.fine_amount}</span>
                </div>
              </div>

              {/* Payment QR Code Box */}
              <div className="p-4 border border-dashed border-primary flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Generated QR visual */}
                  <div className="w-16 h-16 bg-primary p-1 border border-primary flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-white" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block">SCAN TO PAY ONLINE</span>
                    <span className="text-[10px] font-mono text-gray-500">
                      upi://pay?pa=echallan.gov@sbi&am={selectedChallan.fine_amount}&tn={selectedChallan.id}
                    </span>
                  </div>
                </div>
                <Badge variant={selectedChallan.payment_status} size="sm">
                  {selectedChallan.payment_status}
                </Badge>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <Button onClick={() => handleDispatch('email')} variant="outline" size="sm" icon={Mail}>
                  EMAIL DISPATCH
                </Button>
                <Button onClick={() => handleDispatch('sms')} variant="outline" size="sm" icon={MessageSquare}>
                  SMS DISPATCH
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="primary" size="sm" icon={Printer}>
                  PRINT RECEIPT
                </Button>
                <Button onClick={() => challanService.downloadReceipt(selectedChallan.id)} variant="accent" size="sm" icon={Download}>
                  DOWNLOAD PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

