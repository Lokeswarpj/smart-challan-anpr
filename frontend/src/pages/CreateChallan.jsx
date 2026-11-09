import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { VIOLATION_TYPES } from '../mocks/challans';
import { challanService } from '../services/challanService';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from '../context/AuthContext';

/**
 * Evaluates whether a given violation can legally be issued against a vehicle
 * based on its real-time central RTO document records.
 */
function getViolationEligibility(violation, vehicle) {
  if (!vehicle || !vehicle.documents || !violation) {
    return { allowed: true, reason: null };
  }

  // Moving traffic violations (speeding, seatbelt, signal jumping) can be issued
  // by an officer regardless of vehicle document validity.
  if (violation.category === 'moving') {
    return { allowed: true, reason: null };
  }

  // Statutory document violations are strictly checked against registry status
  if (violation.category === 'statutory') {
    // 1. PUC Certificate
    if (violation.code === 'VIO-PUC-EXP' || violation.documentKey === 'puc') {
      const puc = vehicle.documents.puc;
      if (puc && (puc.status === 'valid' || (puc.days_left !== undefined && puc.days_left > 0))) {
        return {
          allowed: false,
          reason: `PUC Certificate is currently VALID in central RTO records until ${puc.expiry_date || 'future date'}.`
        };
      }
    }

    // 2. Insurance
    if (violation.code === 'VIO-INS-EXP' || violation.documentKey === 'insurance') {
      const ins = vehicle.documents.insurance;
      if (ins && (ins.status === 'valid' || (ins.days_left !== undefined && ins.days_left > 0))) {
        return {
          allowed: false,
          reason: `Vehicle Insurance is currently VALID in central RTO records until ${ins.expiry_date || 'future date'}.`
        };
      }
    }

    // 3. RC (Registration Certificate)
    if (violation.code === 'VIO-RC-EXP' || violation.documentKey === 'rc') {
      const rc = vehicle.documents.rc;
      if (rc && (rc.status === 'valid' || (rc.days_left !== undefined && rc.days_left > 0))) {
        return {
          allowed: false,
          reason: `Registration Certificate (RC) is currently VALID in central RTO records until ${rc.expiry_date || 'future date'}.`
        };
      }
    }

    // 4. Road Tax
    if (violation.code === 'VIO-TAX-PENDING' || violation.documentKey === 'road_tax') {
      const tax = vehicle.documents.road_tax;
      if (tax && (tax.status === 'paid' || (tax.days_left !== undefined && tax.days_left > 0))) {
        return {
          allowed: false,
          reason: `Road Tax is currently PAID in central RTO records until ${tax.valid_until || 'future date'}.`
        };
      }
    }
  }

  return { allowed: true, reason: null };
}

export default function CreateChallan() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vehicle, setVehicle] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedViolationCodes, setSelectedViolationCodes] = useState([]);
  const [locationName, setLocationName] = useState('Indiranagar 100ft Road Signal, Bengaluru');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { officer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Selected violation objects
  const selectedViolations = VIOLATION_TYPES.filter((v) =>
    selectedViolationCodes.includes(v.code)
  );

  // Cumulative fine amount
  const totalFineAmount = selectedViolations.reduce((sum, v) => sum + (v.fine || 0), 0);

  // Check if all 4 core documents are completely compliant
  const isAllDocumentsCompliant = Boolean(
    vehicle &&
    vehicle.documents &&
    vehicle.documents.rc?.status === 'valid' &&
    vehicle.documents.insurance?.status === 'valid' &&
    vehicle.documents.puc?.status === 'valid' &&
    vehicle.documents.road_tax?.status === 'paid'
  );

  // Handle vehicle lookup and auto-select appropriate violation(s)
  const fetchVehicleAndAudit = async (plateNumber, requestedCodes = []) => {
    const clean = (plateNumber || '').replace(/[\s-]/g, '').toUpperCase();
    if (!clean) return;

    setLookupLoading(true);
    try {
      const v = await vehicleService.lookupVehicle(clean);
      setVehicle(v);
      if (v?.owner_name) {
        setOwnerName(v.owner_name);
      }

      // If specific violations were requested from URL (single or comma-separated)
      let initialCodes = [];
      if (requestedCodes && requestedCodes.length > 0) {
        requestedCodes.forEach((code) => {
          const targetVio = VIOLATION_TYPES.find((item) => item.code === code);
          if (targetVio) {
            const elig = getViolationEligibility(targetVio, v);
            if (elig.allowed) {
              initialCodes.push(code);
            }
          }
        });
      }

      // If no valid requested codes from URL, auto-detect eligible expired documents
      if (initialCodes.length === 0 && v && v.documents) {
        if (v.documents.puc?.status === 'expired') initialCodes.push('VIO-PUC-EXP');
        if (v.documents.insurance?.status === 'expired') initialCodes.push('VIO-INS-EXP');
        if (v.documents.rc?.status === 'expired') initialCodes.push('VIO-RC-EXP');
        if (v.documents.road_tax?.status === 'pending') initialCodes.push('VIO-TAX-PENDING');

        // If completely compliant, pre-select the first moving violation
        if (initialCodes.length === 0) {
          const firstMoving = VIOLATION_TYPES.find((item) => item.category === 'moving');
          if (firstMoving) initialCodes.push(firstMoving.code);
        }
      }

      setSelectedViolationCodes(initialCodes);
    } catch {
      setVehicle(null);
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reg = params.get('reg');
    const vioParam = params.get('violations') || params.get('violation') || '';
    const requested = vioParam ? vioParam.split(',').map((s) => s.trim()) : [];

    if (reg) {
      setRegistrationNumber(reg);
      fetchVehicleAndAudit(reg, requested);
    } else {
      // Default to first moving violation if no vehicle is loaded yet
      setSelectedViolationCodes(['VIO-SIGNAL-JUMP']);
    }
  }, [location.search]);

  // When registration number is typed manually, auto-query on blur
  const handlePlateBlur = () => {
    if (registrationNumber.trim().length >= 5) {
      fetchVehicleAndAudit(registrationNumber, selectedViolationCodes);
    }
  };

  // Toggle a violation on or off
  const toggleViolation = (code) => {
    setError('');
    const targetVio = VIOLATION_TYPES.find((v) => v.code === code);
    if (!targetVio) return;

    if (selectedViolationCodes.includes(code)) {
      setSelectedViolationCodes((prev) => prev.filter((c) => c !== code));
      return;
    }

    // Check if adding this violation is legally allowed
    const elig = getViolationEligibility(targetVio, vehicle);
    if (!elig.allowed) {
      setError(`ACTION PROHIBITED: ${elig.reason}`);
      return;
    }

    setSelectedViolationCodes((prev) => [...prev, code]);
  };

  const handleSelectAllExpired = () => {
    if (!vehicle || !vehicle.documents) return;
    const expired = [];
    if (vehicle.documents.puc?.status === 'expired') expired.push('VIO-PUC-EXP');
    if (vehicle.documents.insurance?.status === 'expired') expired.push('VIO-INS-EXP');
    if (vehicle.documents.rc?.status === 'expired') expired.push('VIO-RC-EXP');
    if (vehicle.documents.road_tax?.status === 'pending') expired.push('VIO-TAX-PENDING');

    setSelectedViolationCodes((prev) => Array.from(new Set([...prev, ...expired])));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registrationNumber.trim()) {
      setError('Vehicle Registration Number is mandatory.');
      return;
    }

    if (selectedViolationCodes.length === 0) {
      setError('Please select at least one violation offense to issue the challan.');
      return;
    }

    // Verify all selected violations are legally allowed
    for (const v of selectedViolations) {
      const eligibility = getViolationEligibility(v, vehicle);
      if (!eligibility.allowed) {
        setError(`ACTION PROHIBITED: ${eligibility.reason} Central traffic policy strictly forbids issuing false document non-compliance penalties on compliant vehicles.`);
        return;
      }
    }

    setLoading(true);
    try {
      const combinedCodes = selectedViolations.map((v) => v.code).join('+');
      const combinedTitles = selectedViolations.map((v) => v.title).join(' + ');
      const combinedSections = selectedViolations.map((v) => v.section).join(' + ');

      await challanService.createChallan({
        registration_number: registrationNumber.toUpperCase().trim(),
        owner_name: ownerName || 'Vehicle Owner on Record',
        violation_code: combinedCodes,
        violation_title: combinedTitles,
        rule_section: combinedSections,
        fine_amount: totalFineAmount,
        location: locationName,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        officer_name: officer?.name || 'Authorized Operator',
        officer_badge: officer?.badge_number || 'OP-01',
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

  const movingViolations = VIOLATION_TYPES.filter((v) => v.category === 'moving');
  const statutoryViolations = VIOLATION_TYPES.filter((v) => v.category === 'statutory');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/challans" className="p-2 border border-primary bg-white hover:bg-surface shadow-brutal-sm">
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <PageHeader
          title="ISSUE DIGITAL CHALLAN"
          subtitle="Generate an enforceable statutory traffic fine with multi-offense support and embedded payment QR code."
        />
      </div>

      {success && (
        <div className="p-4 bg-green-50 border-2 border-success text-success font-bold text-sm flex items-center gap-2 shadow-brutal-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Digital challan successfully created and logged to audit trail! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-[#251010] border-2 border-danger text-danger font-bold text-sm flex items-center gap-2 shadow-brutal-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time RTO Document Audit Status Banners */}
      {vehicle && isAllDocumentsCompliant && (
        <div className="p-4 bg-emerald-50 dark:bg-[#0e2417] border-2 border-emerald-600 dark:border-emerald-500 shadow-brutal-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-heading text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <span>VEHICLE DOCUMENTS ARE 100% COMPLIANT (CLEAN AUDIT)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-600 dark:border-emerald-500 font-bold">
                CENTRAL RTO VERIFIED
              </span>
            </div>
            <p className="text-xs font-sans text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
              Central RTO records verify that Registration (RC), Insurance, Pollution (PUC), and Road Tax for <strong className="font-mono text-emerald-900 dark:text-emerald-200">{registrationNumber}</strong> are all active and up to date. Document non-compliance fines are <strong>strictly locked</strong>. You may select one or more on-road moving violations observed on duty.
            </p>
          </div>
        </div>
      )}

      {vehicle && !isAllDocumentsCompliant && (
        <div className="p-4 bg-amber-50 dark:bg-[#251b10] border-2 border-amber-600 dark:border-amber-500 shadow-brutal-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="font-heading text-sm font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                STATUTORY DOCUMENT NON-COMPLIANCE DETECTED
              </div>
              <p className="text-xs font-sans text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Central RTO records indicate expired or pending statutory documents for vehicle <strong className="font-mono">{registrationNumber}</strong>. You can check multiple non-compliance offenses below to issue a single combined challan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSelectAllExpired}
            className="px-3 py-1 text-xs font-mono font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-600 dark:border-amber-400 hover:bg-amber-300 transition-colors shadow-brutal-sm flex-shrink-0"
          >
            SELECT ALL EXPIRED
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. KA05NB3321"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            onBlur={handlePlateBlur}
            className="font-mono font-bold tracking-wider"
            required
          />

          <Input
            label="Registered Owner Name"
            placeholder="e.g. Viraj Tiwari"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        {/* Multi-Violation Selection Container */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-primary/20">
            <div>
              <label className="text-sm font-heading font-black uppercase tracking-wider text-primary dark:text-white block">
                VIOLATION OFFENSES (SELECT ONE OR MULTIPLE)
              </label>
              <span className="text-xs text-secondary dark:text-gray-400 font-sans">
                Select all applicable moving or statutory offenses to generate a single consolidated challan.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-accent text-primary border border-primary shadow-brutal-sm">
                {selectedViolationCodes.length} SELECTED
              </span>
              {selectedViolationCodes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedViolationCodes([])}
                  className="text-xs font-mono text-danger underline hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Cumulative Total Fine Breakdown Card */}
          <div className="p-4 bg-surface dark:bg-surface-dark border-2 border-primary shadow-brutal-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-secondary dark:text-gray-400 uppercase block">
                  CONSOLIDATED PENALTY BREAKDOWN
                </span>
                <span className="text-sm font-bold text-primary dark:text-white">
                  {selectedViolationCodes.length === 0
                    ? 'No violations selected yet. Check boxes below.'
                    : `${selectedViolationCodes.length} Offense${selectedViolationCodes.length > 1 ? 's' : ''} Combined`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-mono block">TOTAL FINE AMOUNT</span>
                <span className="font-heading text-3xl text-danger font-black tracking-tight">
                  ₹{totalFineAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Selected Chips List */}
            {selectedViolations.length > 0 && (
              <div className="pt-2 border-t border-primary/10 flex flex-wrap gap-2">
                {selectedViolations.map((v) => (
                  <div
                    key={v.code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-surface border border-primary shadow-brutal-sm"
                  >
                    <span className="text-primary dark:text-white">{v.title}</span>
                    <span className="text-danger font-black">₹{v.fine}</span>
                    <button
                      type="button"
                      onClick={() => toggleViolation(v.code)}
                      className="text-gray-400 hover:text-danger ml-1"
                      title="Remove violation"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Group 1: Statutory Document Offenses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono font-black uppercase text-secondary dark:text-gray-300 tracking-wider">
                ─── STATUTORY DOCUMENT OFFENSES (CENTRAL RTO AUDITED) ───
              </span>
              {lookupLoading && (
                <span className="text-[10px] font-mono text-secondary animate-pulse">
                  Auditing RTO registry...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {statutoryViolations.map((v) => {
                const elig = getViolationEligibility(v, vehicle);
                const isChecked = selectedViolationCodes.includes(v.code);

                return (
                  <div
                    key={v.code}
                    onClick={() => elig.allowed && toggleViolation(v.code)}
                    className={`p-3.5 border-2 transition-all flex items-start justify-between gap-3 ${
                      !elig.allowed
                        ? 'opacity-50 bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                        : isChecked
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-primary dark:border-accent shadow-brutal-sm cursor-pointer'
                        : 'bg-white dark:bg-surface border-primary/40 hover:border-primary cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {!elig.allowed ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary dark:text-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-heading text-xs font-bold text-primary dark:text-white leading-tight">
                          {v.title}
                        </div>
                        <div className="text-[10px] font-mono text-secondary dark:text-gray-400 mt-0.5">
                          {v.section}
                        </div>
                        {!elig.allowed && (
                          <span className="inline-block mt-1 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-400">
                            VALID IN RTO — LOCKED
                          </span>
                        )}
                        {elig.allowed && vehicle && (
                          <span className="inline-block mt-1 text-[9px] font-mono font-bold text-danger bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 border border-danger">
                            NON-COMPLIANT IN RTO
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-heading text-base font-bold text-danger">
                        ₹{v.fine}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: On-Road Moving Offenses */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-black uppercase text-secondary dark:text-gray-300 tracking-wider">
              ─── ON-ROAD MOVING OFFENSES (WITNESSED IN TRAFFIC) ───
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {movingViolations.map((v) => {
                const isChecked = selectedViolationCodes.includes(v.code);

                return (
                  <div
                    key={v.code}
                    onClick={() => toggleViolation(v.code)}
                    className={`p-3.5 border-2 transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isChecked
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-primary dark:border-accent shadow-brutal-sm'
                        : 'bg-white dark:bg-surface border-primary/40 hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary dark:text-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-heading text-xs font-bold text-primary dark:text-white leading-tight">
                          {v.title}
                        </div>
                        <div className="text-[10px] font-mono text-secondary dark:text-gray-400 mt-0.5">
                          {v.section}
                        </div>
                        <span className="inline-block mt-1 text-[9px] font-mono font-bold text-secondary dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 border border-gray-300 dark:border-gray-700">
                          ROAD TRAFFIC
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-heading text-base font-bold text-danger">
                        ₹{v.fine}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <Input
            label="Checkpoint / Violation Location"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />

          <Input
            label="Issued By (Operator Session)"
            value={officer?.name || 'Authorized Operator'}
            disabled
            className="bg-gray-100 dark:bg-gray-800 font-mono font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-primary dark:text-gray-200">
            Incident Observations / Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add descriptive observations, road conditions, or offender response..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white dark:bg-surface border-2 border-primary dark:border-gray-600 p-3 text-sm font-sans outline-none focus:ring-2 focus:ring-accent shadow-brutal-sm"
          />
        </div>

        <div className="pt-4 border-t border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-secondary dark:text-gray-400">
            {selectedViolationCodes.length > 0 ? (
              <span>
                Consolidating <strong>{selectedViolationCodes.length}</strong> offense(s) into single legal challan.
              </span>
            ) : (
              <span className="text-danger font-bold">Please select at least one offense.</span>
            )}
          </div>

          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <Link to="/challans">
              <Button variant="outline" size="md">CANCEL</Button>
            </Link>
            <Button
              type="submit"
              variant="accent"
              size="md"
              loading={loading}
              disabled={selectedViolationCodes.length === 0}
              icon={Receipt}
              className={selectedViolationCodes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-brutal-sm'}
            >
              CONFIRM & DISPATCH CHALLAN (₹{totalFineAmount.toLocaleString('en-IN')})
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
