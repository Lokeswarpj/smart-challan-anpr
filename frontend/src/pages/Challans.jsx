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
  AlertCircle,
  Smartphone,
  Send,
  Copy,
  ExternalLink,
  Loader2
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
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [demoPhone, setDemoPhone] = useState('8524994488');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDispatchingSms, setIsDispatchingSms] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  useEffect(() => {
    challanService.getChallans().then(setChallans);
  }, []);

  useEffect(() => {
    if (selectedChallan) {
      const p = selectedChallan.owner_phone
        ? selectedChallan.owner_phone.replace(/[^0-9]/g, '').slice(-10)
        : '8524994488';
      setDemoPhone(p || '8524994488');
      setSmsResult(null);
    }
  }, [selectedChallan]);

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
    if (channel === 'sms') {
      setIsDispatchingSms(true);
      setSmsResult(null);
    }
    const targetPhone = demoPhone || selectedChallan.owner_phone || '8524994488';
    setDispatchMessage(`Dispatching via ${channel.toUpperCase()} to ${targetPhone}...`);

    try {
      const res = await challanService.dispatchReceipt(selectedChallan.id, channel, targetPhone);
      setDispatchMessage(res.message);
      if (channel === 'sms') {
        setSmsResult({ success: res.success, message: res.message });
        setShowSmsPreview(true);
      }
      const updated = await challanService.getChallans();
      setChallans(updated);
      setSelectedChallan((prev) => (prev ? { ...prev, dispatch_status: `sent_${channel}` } : null));
    } catch (e) {
      const errMsg = e.message || 'Dispatch request failed';
      setDispatchMessage(`Dispatch error: ${errMsg}`);
      if (channel === 'sms') {
        setSmsResult({ success: false, message: errMsg });
      }
    } finally {
      if (channel === 'sms') {
        setIsDispatchingSms(false);
      }
      setTimeout(() => setDispatchMessage(''), 8000);
    }
  };

  const getSmsMessageText = (challan) => {
    if (!challan) return '';
    return `GOVT OF INDIA - TRAFFIC POLICE NOTICE\nE-Challan: ${challan.challan_number || challan.id}\nVehicle: ${challan.registration_number}\nOffense: ${challan.violation_title} (${challan.rule_section})\nPenalty: INR ${challan.fine_amount}.00\nDue Date: ${challan.due_date}\nPay & Contest Online: https://echallan.parivahan.gov.in`;
  };

  const handleCopySms = () => {
    if (!selectedChallan) return;
    navigator.clipboard.writeText(getSmsMessageText(selectedChallan));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!selectedChallan) return;
    const cleanNumber = (demoPhone || selectedChallan.owner_phone || '8524994488')
      .replace(/[^0-9]/g, '')
      .replace(/^0+/, '');
    const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const text = encodeURIComponent(getSmsMessageText(selectedChallan));
    const url = `https://wa.me/${finalNumber}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleDirectSms = () => {
    if (!selectedChallan) return;
    const cleanNumber = (demoPhone || selectedChallan.owner_phone || '8524994488')
      .replace(/[^0-9]/g, '')
      .slice(-10);
    const text = encodeURIComponent(getSmsMessageText(selectedChallan));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delimiter = isIOS ? '&' : '?';
    window.location.href = `sms:+91${cleanNumber}${delimiter}body=${text}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="DIGITAL ENFORCEMENT & E-CHALLANS"
        subtitle="Manage active enforcement challans, monitor collection recovery, and dispatch digital notifications."
        action={
          <Link to="/challans/new">
            <Button variant="accent" size="sm" icon={Plus}>
              CREATE NEW CHALLAN
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#171E19] border-2 border-primary dark:border-[#2D3931] shadow-brutal p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search plate, challan ID, rule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'UNPAID', 'PAID', 'DISPUTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 font-heading text-xs tracking-wider border-2 border-primary dark:border-[#2D3931] transition-all ${
                statusFilter === st
                  ? 'bg-accent text-[#171E19] dark:text-[#171E19] font-black shadow-brutal-sm'
                  : 'bg-white dark:bg-[#121814] text-secondary dark:text-sage hover:bg-surface dark:hover:bg-[#1F2822]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white dark:bg-[#171E19] border-2 border-primary dark:border-[#2D3931] shadow-brutal overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="bg-primary dark:bg-[#101512] text-white border-b-2 border-primary dark:border-[#2D3931] font-heading tracking-wider">
              <th className="p-3">CHALLAN ID</th>
              <th className="p-3">REGISTRATION</th>
              <th className="p-3">VIOLATION / RULE SECTION</th>
              <th className="p-3">FINE (INR)</th>
              <th className="p-3">ISSUED AT</th>
              <th className="p-3">STATUS</th>
              <th className="p-3">DISPATCH</th>
              <th className="p-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredChallans.map((c) => (
              <tr key={c.id} className="hover:bg-surface/80 dark:hover:bg-[#1F2822]">
                <td className="p-3 font-mono font-bold text-primary dark:text-accent">
                  {c.id}
                </td>
                <td className="p-3 font-mono font-black text-primary dark:text-white">{c.registration_number}</td>
                <td className="p-3">
                  <div className="font-bold text-primary dark:text-white">{c.violation_title}</div>
                  <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{c.rule_section}</div>
                </td>
                <td className="p-3 font-heading font-black text-sm text-danger">
                  ₹{c.fine_amount}
                </td>
                <td className="p-3 font-mono text-gray-500 dark:text-gray-400">{c.issued_at}</td>
                <td className="p-3">
                  <Badge variant={c.payment_status} size="sm">
                    {c.payment_status}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className="font-mono text-[11px] uppercase bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 border border-gray-300 dark:border-gray-700">
                    {c.dispatch_status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button
                    onClick={() => {
                      setSelectedChallan(c);
                      setShowSmsPreview(false);
                      setDemoPhone(c.owner_phone || '');
                    }}
                    variant="outline"
                    size="xs"
                    icon={Eye}
                  >
                    RECEIPT
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Receipt & SMS Modal */}
      {selectedChallan && (
        <Modal
          isOpen={!!selectedChallan}
          onClose={() => {
            setSelectedChallan(null);
            setShowSmsPreview(false);
          }}
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

            {/* Interactive Live SMS Simulator & Faculty Demonstration Drawer */}
            {showSmsPreview && (
              <div className="border-2 border-primary bg-amber-50 dark:bg-surface p-5 space-y-4 shadow-brutal-sm">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-accent" />
                    <h5 className="font-heading text-sm text-primary dark:text-white uppercase font-black">
                      CARRIER SMS GATEWAY SIMULATION (MORTH / VAHAN)
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-primary text-accent px-2 py-0.5 border border-primary">
                    OFFICIAL TEMPLATE
                  </span>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-primary p-4 rounded font-mono text-xs space-y-2">
                  <div className="flex justify-between text-[11px] text-gray-500 border-b border-dashed border-gray-200 dark:border-gray-700 pb-1.5">
                    <span>SENDER: <strong>AD-VAHAN / ROADGUARD</strong></span>
                    <span>TO: <strong>{selectedChallan.owner_phone || '+91 98110 54321'}</strong></span>
                  </div>
                  <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-primary dark:text-gray-200">
                    {getSmsMessageText(selectedChallan)}
                  </pre>
                  <div className="text-[10px] text-gray-400 italic pt-1 border-t border-gray-100 dark:border-gray-800">
                    * Phone number auto-resolved from central vehicle registry for plate {selectedChallan.registration_number}.
                  </div>
                </div>

                {/* Faculty Live Demo Trigger */}
                <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="w-full sm:w-auto flex-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-primary dark:text-white whitespace-nowrap">
                      TEST ON PHONE:
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 9811054321"
                      value={demoPhone}
                      onChange={(e) => setDemoPhone(e.target.value)}
                      className="px-2.5 py-1.5 border border-primary text-xs font-mono w-full max-w-[180px] bg-white dark:bg-surface"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleCopySms}
                      className="px-3 py-1.5 text-xs font-mono font-bold border border-primary bg-white dark:bg-surface hover:bg-surface transition-colors flex items-center gap-1 shadow-brutal-sm cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copySuccess ? 'COPIED!' : 'COPY TEXT'}
                    </button>

                    <button
                      type="button"
                      disabled={isDispatchingSms}
                      onClick={() => handleDispatch('sms')}
                      className="px-3.5 py-1.5 text-xs font-mono font-bold border border-primary bg-primary text-accent hover:bg-black transition-colors flex items-center gap-1.5 shadow-brutal-sm disabled:opacity-50 cursor-pointer"
                      title="Dispatch real carrier SMS via Fast2SMS gateway"
                    >
                      {isDispatchingSms ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>SENDING CARRIER SMS...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>DISPATCH CARRIER SMS</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectSms}
                      className="px-3 py-1.5 text-xs font-mono font-bold border border-primary bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-brutal-sm cursor-pointer"
                      title="Open native SMS Messaging app on your phone / PC with pre-filled notice"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      PHONE SMS APP
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="px-3 py-1.5 text-xs font-mono font-black border border-primary bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1 shadow-brutal-sm cursor-pointer"
                      title="Open WhatsApp notice pre-filled to this number"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      WHATSAPP
                    </button>
                  </div>
                </div>

                {/* Instant Inline Carrier Gateway Response Feedback */}
                {smsResult && (
                  <div
                    className={`p-3.5 border-2 text-xs font-mono flex items-start gap-2.5 transition-all shadow-brutal-sm ${
                      smsResult.success
                        ? 'bg-amber-100 dark:bg-amber-950/60 border-primary text-primary dark:text-amber-200'
                        : 'bg-red-50 dark:bg-red-950/60 border-danger text-danger dark:text-red-300'
                    }`}
                  >
                    {smsResult.success ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary dark:text-accent" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-danger" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-black uppercase tracking-wider text-[11px]">
                          GATEWAY TELEMETRY FEEDBACK
                        </span>
                        <span className="text-[10px] opacity-75 font-mono">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-sans text-xs font-medium leading-relaxed">
                        {smsResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {selectedChallan.payment_status === 'unpaid' && (
                  <Button
                    onClick={async () => {
                      await challanService.updatePaymentStatus(selectedChallan.id, 'paid');
                      setSelectedChallan((prev) => ({ ...prev, payment_status: 'paid' }));
                      const updated = await challanService.getChallans();
                      setChallans(updated);
                    }}
                    variant="accent"
                    size="sm"
                    icon={CheckCircle2}
                  >
                    MARK AS PAID
                  </Button>
                )}
                <Button onClick={() => handleDispatch('email')} variant="outline" size="sm" icon={Mail}>
                  EMAIL DISPATCH
                </Button>
                <Button onClick={() => handleDispatch('sms')} variant="outline" size="sm" icon={MessageSquare}>
                  {showSmsPreview ? 'SMS DISPATCHED' : 'SMS DISPATCH'}
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
