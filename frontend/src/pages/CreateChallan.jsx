import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Lock
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

  const currentEligibility = getViolationEligibility(selectedViolation, vehicle);

  // Check if all 4 core documents are completely compliant
  const isAllDocumentsCompliant = Boolean(
    vehicle &&
    vehicle.documents &&
    vehicle.documents.rc?.status === 'valid' &&
    vehicle.documents.insurance?.status === 'valid' &&
    vehicle.documents.puc?.status === 'valid' &&
    vehicle.documents.road_tax?.status === 'paid'
  );

  // Handle vehicle lookup and auto-select appropriate violation
  const fetchVehicleAndAudit = async (plateNumber, requestedViolation) => {
    const clean = (plateNumber || '').replace(/[\s-]/g, '').toUpperCase();
    if (!clean) return;

    setLookupLoading(true);
    try {
      const v = await vehicleService.lookupVehicle(clean);
      setVehicle(v);
      if (v?.owner_name) {
        setOwnerName(v.owner_name);
      }

      // If a specific violation was requested from the URL, check if it's allowed
      if (requestedViolation) {
        const targetVio = VIOLATION_TYPES.find((item) => item.code === requestedViolation);
        if (targetVio) {
          const elig = getViolationEligibility(targetVio, v);
          if (elig.allowed) {
            setSelectedViolationCode(requestedViolation);
            return;
          }
        }
      }

      // Check if the currently selected violation is locked/disallowed for this vehicle
      const currentElig = getViolationEligibility(selectedViolation, v);
      if (!currentElig.allowed) {
        // Find an expired document violation if one exists, otherwise default to first moving violation
        let newCode = null;
        if (v.documents?.puc?.status === 'expired') newCode = 'VIO-PUC-EXP';
        else if (v.documents?.insurance?.status === 'expired') newCode = 'VIO-INS-EXP';
        else if (v.documents?.rc?.status === 'expired') newCode = 'VIO-RC-EXP';
        else if (v.documents?.road_tax?.status === 'pending') newCode = 'VIO-TAX-PENDING';

        if (!newCode) {
          // All documents are clean, select first moving violation
          const firstMoving = VIOLATION_TYPES.find((item) => item.category === 'moving');
          newCode = firstMoving ? firstMoving.code : VIOLATION_TYPES[0].code;
        }
        setSelectedViolationCode(newCode);
      }
    } catch {
      setVehicle(null);
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reg = params.get('reg');
    const vio = params.get('violation');
    if (reg) {
      setRegistrationNumber(reg);
      fetchVehicleAndAudit(reg, vio);
    }
  }, [location.search]);

  // When registration number is typed manually, auto-query on blur or valid format length
  const handlePlateBlur = () => {
    if (registrationNumber.trim().length >= 5) {
      fetchVehicleAndAudit(registrationNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registrationNumber.trim()) {
      setError('Vehicle Registration Number is mandatory.');
      return;
    }

    // Statutory audit check
    const eligibility = getViolationEligibility(selectedViolation, vehicle);
    if (!eligibility.allowed) {
      setError(`ACTION PROHIBITED: ${eligibility.reason} Central traffic policy strictly forbids issuing false document non-compliance penalties on compliant vehicles.`);
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
              Central RTO records verify that Registration (RC), Insurance, Pollution (PUC), and Road Tax for <strong className="font-mono text-emerald-900 dark:text-emerald-200">{registrationNumber}</strong> are all active and up to date. Document non-compliance fines are <strong>strictly locked</strong> to prevent false citations. You may only record on-road moving violations (e.g. Signal Jumping, Speeding, Seatbelt) witnessed on duty.
            </p>
          </div>
        </div>
      )}

      {vehicle && !isAllDocumentsCompliant && (
        <div className="p-4 bg-amber-50 dark:bg-[#251b10] border-2 border-amber-600 dark:border-amber-500 shadow-brutal-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-heading text-sm font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              STATUTORY DOCUMENT NON-COMPLIANCE DETECTED
            </div>
            <p className="text-xs font-sans text-amber-800 dark:text-amber-300/90 leading-relaxed">
              Central RTO records indicate expired or pending statutory documents for vehicle <strong className="font-mono">{registrationNumber}</strong>. Eligible document non-compliance violations have been unlocked below.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. KA01AB1234"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            onBlur={handlePlateBlur}
            className="font-mono font-bold tracking-wider"
            required
          />

          <Input
            label="Registered Owner Name"
            placeholder="e.g. Aryan Maharaj"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </div>

        {/* Violation Selection with Audit Grouping */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-primary dark:text-gray-200">
              Violation Category & Statutory Rule
            </label>
            {lookupLoading && (
              <span className="text-[10px] font-mono text-secondary animate-pulse">
                Auditing RTO registry...
              </span>
            )}
          </div>

          <select
            value={selectedViolationCode}
            onChange={(e) => setSelectedViolationCode(e.target.value)}
            className="w-full bg-white dark:bg-surface border-2 border-primary dark:border-gray-600 px-3.5 py-2.5 text-sm font-sans font-medium outline-none focus:ring-2 focus:ring-accent shadow-brutal-sm"
          >
            <optgroup label="─── ON-ROAD MOVING VIOLATIONS (WITNESSED IN TRAFFIC) ───">
              {movingViolations.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.title} — {v.section} (₹{v.fine})
                </option>
              ))}
            </optgroup>

            <optgroup label="─── STATUTORY DOCUMENT VIOLATIONS (CENTRAL RTO AUDITED) ───">
              {statutoryViolations.map((v) => {
                const elig = getViolationEligibility(v, vehicle);
                return (
                  <option
                    key={v.code}
                    value={v.code}
                    disabled={!elig.allowed}
                    className={!elig.allowed ? 'text-gray-400 bg-gray-100 dark:bg-gray-800' : 'font-bold text-danger'}
                  >
                    {!elig.allowed
                      ? `🔒 [LOCKED: DOCUMENT VALID IN RTO] ${v.title}`
                      : `⚠️ ${v.title} — ${v.section} (₹${v.fine})`}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        {/* Dynamic Penalty Details Box with Audit Warning */}
        <div className={`p-4 border-2 ${currentEligibility.allowed ? 'bg-surface dark:bg-surface-dark border-primary' : 'bg-red-50 dark:bg-[#201010] border-danger'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-primary dark:text-white uppercase flex items-center gap-1.5">
                {!currentEligibility.allowed && <Lock className="w-3.5 h-3.5 text-danger" />}
                {selectedViolation.title}
              </span>
              <span className="text-[11px] font-mono text-secondary dark:text-gray-400 block mt-0.5">
                {selectedViolation.section}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-mono block">FINE AMOUNT</span>
              <span className={`font-heading text-2xl font-bold ${currentEligibility.allowed ? 'text-danger' : 'text-gray-400 line-through'}`}>
                ₹{selectedViolation.fine}
              </span>
            </div>
          </div>

          {!currentEligibility.allowed && (
            <div className="mt-3 pt-3 border-t border-danger/30 text-xs font-mono font-bold text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>CITATION BLOCKED: {currentEligibility.reason}</span>
            </div>
          )}
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
            value={`${officer?.name || 'Inspector Lokeshwar P J'} (${officer?.badge_number || 'KA-POL-2026'})`}
            disabled
            className="bg-gray-100 dark:bg-gray-800 font-mono font-bold"
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
            className="w-full bg-white dark:bg-surface border-2 border-primary dark:border-gray-600 p-3 text-sm font-sans outline-none focus:ring-2 focus:ring-accent shadow-brutal-sm"
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
            disabled={!currentEligibility.allowed}
            icon={Receipt}
            className={!currentEligibility.allowed ? 'opacity-50 cursor-not-allowed' : ''}
          >
            CONFIRM & DISPATCH CHALLAN
          </Button>
        </div>
      </form>
    </div>
  );
}
