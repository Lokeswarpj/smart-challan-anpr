import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Receipt, CheckCircle2, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { VIOLATION_TYPES } from '../mocks/challans';
import { challanService } from '../services/challanService';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';

export default function CreateChallan() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [selectedViolationCode, setSelectedViolationCode] = useState(VIOLATION_TYPES[0].code);
  const [locationName, setLocationName] = useState('Indiranagar 100ft Road Signal, Bengaluru');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { officer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedViolation =
    VIOLATION_TYPES.find((v) => v.code === selectedViolationCode) || VIOLATION_TYPES[0];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reg = params.get('reg');
    if (reg) {
      setRegistrationNumber(reg);
      vehicleService.lookupVehicle(reg).then((v) => {
        if (v && v.owner_name) {
          setOwnerName(v.owner_name);
        }
      }).catch(() => {});
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registrationNumber.trim()) {
      setError('Vehicle Registration Number is mandatory.');
      return;
    }

    setLoading(true);
    try {
      await challanService.createChallan({
        registration_number: registrationNumber.toUpperCase().trim(),
        owner_name: ownerName || 'Vehicle Owner on Record',
        violation_code: selectedViolation.code,
        violation_title: selectedViolation.title,
        rule_section: selectedViolation.section,
        fine_amount: selectedViolation.fine,
        location: locationName,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        officer_name: officer?.name || 'Sub-Inspector Ramesh Kumar',
        officer_badge: officer?.badge_number || 'KA-POL-1001',
        notes: notes,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/challans');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to issue challan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/challans" className="p-2 border border-primary bg-white hover:bg-surface">
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <PageHeader
          title="ISSUE DIGITAL CHALLAN"
          subtitle="Generate an enforceable statutory traffic fine with embedded payment QR code."
        />
      </div>

      {success && (
        <div className="p-4 bg-green-50 border-2 border-success text-success font-bold text-sm flex items-center gap-2 shadow-brutal-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Digital challan successfully created and logged to audit trail! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-danger text-danger font-bold text-sm flex items-center gap-2 shadow-brutal-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. KA05NB3321"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            className="font-mono font-bold tracking-wider"
            required
          />

          <Input
            label="Registered Owner Name"
            placeholder="e.g. Kiran Gowda"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        {/* Violation Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-primary dark:text-gray-200">
            Violation Category & Statutory Rule
          </label>
          <select
            value={selectedViolationCode}
            onChange={(e) => setSelectedViolationCode(e.target.value)}
            className="w-full bg-white dark:bg-surface border border-primary dark:border-gray-600 px-3.5 py-2.5 text-sm font-sans font-medium outline-none focus:ring-2 focus:ring-accent shadow-brutal-sm"
          >
            {VIOLATION_TYPES.map((v) => (
              <option key={v.code} value={v.code}>
                {v.title} — {v.section} (₹{v.fine})
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Penalty Details Box */}
        <div className="p-4 bg-surface dark:bg-surface-dark border border-primary flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primary dark:text-white uppercase block">
              {selectedViolation.title}
            </span>
            <span className="text-[11px] font-mono text-secondary dark:text-gray-400">
              {selectedViolation.section}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-mono block">FINE AMOUNT</span>
            <span className="font-heading text-2xl text-danger font-bold">
              ₹{selectedViolation.fine}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Checkpoint / Violation Location"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />

          <Input
            label="Issuing Officer Credential"
            value={`${officer?.name || 'Sub-Inspector Ramesh Kumar'} (${officer?.badge_number || 'KA-POL-1001'})`}
            disabled
            className="bg-gray-100 dark:bg-gray-800"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-primary dark:text-gray-200">
            Field Officer Observations (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add descriptive observations, road conditions, or offender response..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white dark:bg-surface border border-primary dark:border-gray-600 p-3 text-sm font-sans outline-none focus:ring-2 focus:ring-accent shadow-brutal-sm"
          />
        </div>

        <div className="pt-4 border-t border-primary/20 flex justify-end gap-3">
          <Link to="/challans">
            <Button variant="outline" size="md">CANCEL</Button>
          </Link>
          <Button
            type="submit"
            variant="accent"
            size="md"
            loading={loading}
            icon={Receipt}
          >
            CONFIRM & DISPATCH CHALLAN
          </Button>
        </div>
      </form>
    </div>
  );
}
