import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  Receipt,
  FileText,
  Printer,
  Upload,
  RefreshCw,
  ShieldAlert,
  Car
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import StatusIndicator from '../components/common/StatusIndicator';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';
import { vehicleService } from '../services/vehicleService';
import { anprService } from '../services/anprService';
import { speechUtil } from '../utils/speech';
import { useLanguage } from '../context/LanguageContext';

export default function VehicleVerification() {
  const [queryPlate, setQueryPlate] = useState('');
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('manual'); // 'manual' or 'camera'

  // Camera & ANPR states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if plate was passed via query params (e.g. from ANPR scanner or search)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reg = params.get('reg');
    if (reg) {
      setQueryPlate(reg);
      handleVerify(reg);
    }
  }, [location.search]);

  // Handle Clean Camera Stream Lifecycle
  useEffect(() => {
    let stream = null;
    if (cameraActive && mode === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          setError("Unable to access camera feed. Please check permissions or upload an image.");
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject;
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive, mode]);

  const handleVerify = async (plateToLookup) => {
    const target = (plateToLookup || queryPlate).trim().toUpperCase();
    if (!target) {
      setError('Please enter an Indian registration plate number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await vehicleService.lookupVehicle(target);
      setVehicle(data);
      // Auto voice announcement
      speechUtil.announceVehicle(data, currentLanguage);
    } catch (err) {
      setError(err.message || `No records found for ${target}.`);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      try {
        const file = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
        const result = await anprService.detectPlate(file);
        setScanResult(result);
        setQueryPlate(result.registration_number);
        await handleVerify(result.registration_number);
      } catch (e) {
        setError("Plate recognition failed. Please realign the camera.");
      } finally {
        setScanning(false);
        setCameraActive(false);
      }
    }, 'image/jpeg');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError('');
    try {
      const result = await anprService.detectPlate(file);
      setScanResult(result);
      setQueryPlate(result.registration_number);
      await handleVerify(result.registration_number);
    } catch (err) {
      setError("Failed to extract plate from uploaded image.");
    } finally {
      setScanning(false);
    }
  };

  const demoPlates = [
    { plate: "KA01AB1234", desc: "100% Compliant (Green)" },
    { plate: "KA03MG4567", desc: "Expiring PUC (Amber)" },
    { plate: "MH12DE7890", desc: "Expiring Insurance (Amber)" },
    { plate: "DL04CC9999", desc: "Expired Insurance (Red)" },
    { plate: "KA05NB3321", desc: "Expired PUC + Fine (Red)" },
    { plate: "KA04EF1122", desc: "Road Tax Pending (Red)" },
    { plate: "22BH9988AA", desc: "Bharat (BH) Series (Green)" },
    { plate: "KA53Z9000", desc: "Chronic Violator (3 Fines)" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="VEHICLE VERIFICATION"
        subtitle="KNOW THE VEHICLE. VERIFY THE DOCUMENTS."
        action={
          <div className="flex gap-2 bg-white dark:bg-surface border-2 border-primary p-1 shadow-brutal-sm">
            <button
              onClick={() => { setMode('manual'); setCameraActive(false); }}
              className={`px-4 py-1.5 text-xs font-bold uppercase font-sans transition-colors ${
                mode === 'manual' ? 'bg-primary text-white' : 'text-secondary hover:text-black'
              }`}
            >
              MANUAL SEARCH
            </button>
            <button
              onClick={() => { setMode('camera'); setCameraActive(true); }}
              className={`px-4 py-1.5 text-xs font-bold uppercase font-sans transition-colors flex items-center gap-1.5 ${
                mode === 'camera' ? 'bg-accent text-primary font-black' : 'text-secondary hover:text-black'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              CAMERA ANPR
            </button>
          </div>
        }
      />

      {/* Mode 1: Manual Alphanumeric Search */}
      {mode === 'manual' && (
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <div className="flex-1 w-full">
              <Input
                label="Indian Registration Plate Number"
                placeholder="e.g. KA01AB1234 or 22BH9988AA"
                value={queryPlate}
                onChange={(e) => setQueryPlate(e.target.value.toUpperCase().replace(/[\s-]/g, ''))}
                icon={Search}
                className="text-lg font-mono font-bold tracking-widest uppercase"
              />
            </div>
            <div className="sm:self-end w-full sm:w-auto">
              <Button
                type="submit"
                variant="accent"
                size="lg"
                loading={loading}
                className="w-full sm:w-auto shadow-brutal-sm"
              >
                VERIFY VEHICLE
              </Button>
            </div>
          </form>

          {/* Quick Clickable Demo Plates */}
          <div className="mt-6 pt-4 border-t border-primary/20 dark:border-[#2D3931]">
            <span className="text-[11px] font-mono text-secondary dark:text-gray-400 uppercase font-bold block mb-2">
              SAMPLE TEST VEHICLES:
            </span>
            <div className="flex flex-wrap gap-2">
              {demoPlates.map((d) => (
                <button
                  key={d.plate}
                  type="button"
                  onClick={() => {
                    setQueryPlate(d.plate);
                    handleVerify(d.plate);
                  }}
                  className="px-2.5 py-1 text-xs font-mono font-bold border border-primary dark:border-[#2D3931] bg-surface dark:bg-[#101512] hover:bg-accent dark:hover:bg-accent text-primary dark:text-[#FFE17C] hover:text-[#171E19] dark:hover:text-[#171E19] transition-all shadow-brutal-sm flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className="font-mono font-bold tracking-wider group-hover:text-[#171E19] text-primary dark:text-[#FFE17C]">
                    {d.plate}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans group-hover:text-[#171E19]">
                    ({d.desc})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Camera-Based ANPR Workspace */}
      {mode === 'camera' && (
        <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-primary/20">
            <div>
              <h3 className="font-heading text-xl text-primary dark:text-white">
                ROADSIDE OPTICAL CAMERA SCANNER
              </h3>
              <p className="text-xs text-secondary dark:text-gray-400 font-sans">
                Point device camera at registration plate or upload an existing image.
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-sans uppercase border border-primary bg-surface hover:bg-black hover:text-white transition-colors shadow-brutal-sm">
                <Upload className="w-3.5 h-3.5" /> UPLOAD IMAGE
              </span>
            </label>
          </div>

          {/* Video Preview Canvas */}
          <div className="relative aspect-video max-w-2xl mx-auto bg-black border-2 border-primary overflow-hidden flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-sage p-6">
                <Camera className="w-12 h-12 mx-auto mb-3 text-accent" />
                <p className="font-sans text-xs">Camera stream paused or inactive.</p>
                <Button
                  onClick={() => setCameraActive(true)}
                  variant="accent"
                  size="sm"
                  className="mt-4"
                >
                  START CAMERA FEED
                </Button>
              </div>
            )}

            {/* Target Reticle & Scanning Animation */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-1/3 border-2 border-accent/80 relative shadow-2xl">
                  {/* Corner accents */}
                  <span className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-accent"></span>
                  <span className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-accent"></span>
                  <span className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-accent"></span>
                  <span className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-accent"></span>
                  <div className="scanner-line w-full h-1 animate-pulse"></div>
                  <div className="absolute -top-7 left-0 bg-primary text-accent px-2 py-0.5 text-[10px] font-mono font-bold">
                    ALIGN NUMBER PLATE WITHIN FRAME
                  </div>
                </div>
              </div>
            )}

            {/* Hidden canvas for image grab */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          {cameraActive && (
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleCaptureSnapshot}
                variant="accent"
                size="lg"
                loading={scanning}
                icon={Camera}
                className="shadow-brutal"
              >
                CAPTURE & RECOGNIZE PLATE
              </Button>
              <Button
                onClick={() => setCameraActive(false)}
                variant="outline"
                size="lg"
              >
                STOP CAMERA
              </Button>
            </div>
          )}

          {scanResult && (
            <div className="p-4 bg-accent/20 border-2 border-primary font-mono text-xs flex items-center justify-between">
              <span>DETECTED PLATE: <strong>{scanResult.registration_number}</strong></span>
              <span>CONFIDENCE: {(scanResult.confidence * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && <Loader message="QUERYING CENTRAL RTO COMPLIANCE RECORDS..." />}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-danger text-danger text-sm font-bold flex items-center justify-between shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleVerify()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> RETRY
          </Button>
        </div>
      )}

      {/* Verification Results Display */}
      {vehicle && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner with Voice Announce & Quick Actions */}
          <div className="bg-primary text-white border-2 border-primary p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent text-primary flex items-center justify-center font-heading text-2xl font-black border border-primary">
                {vehicle.registration_number.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-3xl sm:text-4xl text-white tracking-widest font-mono">
                    {vehicle.registration_number}
                  </h2>
                  {vehicle.is_mock && (
                    <span className="bg-accent text-primary text-[10px] font-mono px-2 py-0.5 font-bold">
                      DEMO RECORD
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-sage">
                  {vehicle.maker_model} • {vehicle.vehicle_class} • {vehicle.fuel_type}
                </p>
              </div>
            </div>

            {/* Compliance Badge & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => speechUtil.announceVehicle(vehicle, currentLanguage)}
                variant="accent"
                size="sm"
                icon={Volume2}
              >
                VOICE ALERT
              </Button>

              {/* Strict Statutory Document Audit Display */}
              {vehicle.documents && (
                (() => {
                  const hasExpired =
                    vehicle.documents.rc?.status === 'expired' ||
                    vehicle.documents.insurance?.status === 'expired' ||
                    vehicle.documents.puc?.status === 'expired' ||
                    vehicle.documents.road_tax?.status === 'pending';

                  const is100PercentCompliant =
                    !hasExpired &&
                    vehicle.documents.rc?.status === 'valid' &&
                    vehicle.documents.insurance?.status === 'valid' &&
                    vehicle.documents.puc?.status === 'valid' &&
                    vehicle.documents.road_tax?.status === 'paid';

                  const expiredCodes = [];
                  if (vehicle.documents.puc?.status === 'expired') expiredCodes.push('VIO-PUC-EXP');
                  if (vehicle.documents.insurance?.status === 'expired') expiredCodes.push('VIO-INS-EXP');
                  if (vehicle.documents.rc?.status === 'expired') expiredCodes.push('VIO-RC-EXP');
                  if (vehicle.documents.road_tax?.status === 'pending') expiredCodes.push('VIO-TAX-PENDING');

                  const targetViolationParam = expiredCodes.length > 0 ? `&violations=${expiredCodes.join(',')}` : '';

                  if (is100PercentCompliant) {
                    return (
                      <>
                        <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500 font-mono text-xs font-bold uppercase flex items-center gap-1.5 shadow-brutal-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ALL DOCUMENTS VALID (100% COMPLIANT)
                        </span>
                        <Link to={`/challans/new?reg=${vehicle.registration_number}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Receipt}
                            className="border-accent text-accent hover:bg-accent hover:text-primary text-xs font-bold shadow-brutal-sm"
                          >
                            REPORT ON-ROAD OFFENSE
                          </Button>
                        </Link>
                      </>
                    );
                  }

                  return (
                    <Link to={`/challans/new?reg=${vehicle.registration_number}${targetViolationParam}`}>
                      <Button variant="danger" size="sm" icon={Receipt} className="animate-pulse shadow-brutal-sm font-bold">
                        {expiredCodes.length > 1
                          ? `ISSUE COMBINED CHALLAN (${expiredCodes.length} VIOLATIONS)`
                          : 'ISSUE NON-COMPLIANCE CHALLAN'}
                      </Button>
                    </Link>
                  );
                })()
              )}
            </div>
          </div>

          {/* 4 Core Document Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Registration Certificate (RC) */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-5 shadow-brutal flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-sans uppercase text-secondary dark:text-gray-300">
                    Registration (RC)
                  </span>
                  <StatusIndicator status={vehicle.documents.rc.status} size="sm" />
                </div>
                <div className="font-heading text-2xl text-primary dark:text-white mt-1">
                  RC #{vehicle.documents.rc.rc_number.slice(-8)}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-mono text-secondary dark:text-gray-400 space-y-1">
                <div>Chassis: {vehicle.documents.rc.chassis_number}</div>
                <div>Expiry: <strong>{vehicle.documents.rc.expiry_date}</strong></div>
              </div>
            </div>

            {/* 2. Insurance Record */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-5 shadow-brutal flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-sans uppercase text-secondary dark:text-gray-300">
                    Vehicle Insurance
                  </span>
                  <StatusIndicator status={vehicle.documents.insurance.status} size="sm" />
                </div>
                <div className="font-heading text-xl text-primary dark:text-white truncate mt-1">
                  {vehicle.documents.insurance.insurer_name}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-mono text-secondary dark:text-gray-400 space-y-1">
                <div>Policy: {vehicle.documents.insurance.policy_number}</div>
                <div>Expiry: <strong>{vehicle.documents.insurance.expiry_date}</strong></div>
              </div>
            </div>

            {/* 3. Pollution Under Control (PUC) */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-5 shadow-brutal flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-sans uppercase text-secondary dark:text-gray-300">
                    Pollution (PUC)
                  </span>
                  <StatusIndicator status={vehicle.documents.puc.status} size="sm" />
                </div>
                <div className="font-heading text-2xl text-primary dark:text-white mt-1">
                  {vehicle.documents.puc.emission_norm}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-mono text-secondary dark:text-gray-400 space-y-1">
                <div>Value: {vehicle.documents.puc.tested_value}</div>
                <div>Expiry: <strong>{vehicle.documents.puc.expiry_date}</strong></div>
              </div>
            </div>

            {/* 4. Road Tax */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-5 shadow-brutal flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-sans uppercase text-secondary dark:text-gray-300">
                    Road Tax
                  </span>
                  <StatusIndicator status={vehicle.documents.road_tax.status} size="sm" />
                </div>
                <div className="font-heading text-xl text-primary dark:text-white mt-1">
                  {vehicle.documents.road_tax.tax_type}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs font-mono text-secondary dark:text-gray-400 space-y-1">
                <div>Valid Until: <strong>{vehicle.documents.road_tax.valid_until}</strong></div>
                <div>Paid: ₹{vehicle.documents.road_tax.amount_paid}</div>
              </div>
            </div>
          </div>

          {/* Vehicle Metadata & Owner Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner & Registration Info */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-6 shadow-brutal">
              <h3 className="font-heading text-xl text-primary dark:text-white pb-3 border-b border-primary/20 mb-4">
                OWNER & RTO REGISTRATION
              </h3>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-secondary dark:text-gray-400 font-bold">REGISTERED OWNER:</span>
                  <span className="font-bold text-primary dark:text-white">{vehicle.owner_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-secondary dark:text-gray-400 font-bold">CONTACT PHONE:</span>
                  <span className="font-mono text-primary dark:text-white">{vehicle.owner_phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-secondary dark:text-gray-400 font-bold">REGISTERED EMAIL:</span>
                  <span className="font-mono text-primary dark:text-white">{vehicle.owner_email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-secondary dark:text-gray-400 font-bold">REGISTERED RTO:</span>
                  <span className="font-bold text-primary dark:text-white">{vehicle.registered_rto}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondary dark:text-gray-400 font-bold">INITIAL REG DATE:</span>
                  <span className="font-mono text-primary dark:text-white">{vehicle.registration_date}</span>
                </div>
              </div>
            </div>

            {/* Past Violations & History Rail */}
            <div className="bg-white dark:bg-surface border-2 border-primary p-6 shadow-brutal">
              <div className="flex items-center justify-between pb-3 border-b border-primary/20 mb-4">
                <h3 className="font-heading text-xl text-primary dark:text-white">
                  PREVIOUS VIOLATION RECORD
                </h3>
                <span className="text-xs font-mono font-bold bg-accent text-primary px-2 py-0.5 border border-primary">
                  {vehicle.previous_challans?.length || 0} RECORDED
                </span>
              </div>

              {vehicle.previous_challans && vehicle.previous_challans.length > 0 ? (
                <div className="space-y-3">
                  {vehicle.previous_challans.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 bg-surface dark:bg-surface-dark border border-primary flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-primary dark:text-white">{ch.violation_title}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">{ch.rule_section} • {ch.issued_at}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-sm text-primary dark:text-accent font-bold">₹{ch.fine_amount}</div>
                        <Badge variant={ch.payment_status} size="sm">{ch.payment_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-secondary dark:text-gray-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-bold">CLEAN RECORD</p>
                  <p>No prior traffic violations recorded for this vehicle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

