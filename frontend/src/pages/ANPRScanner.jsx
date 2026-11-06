import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Play,
  Square,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Edit3,
  Check
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import { anprService } from '../services/anprService';

export default function ANPRScanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [editablePlate, setEditablePlate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Computes pixel-perfect percentage coordinates bounded to the actual plate
  const boxStyle = React.useMemo(() => {
    if (!result?.detected || !result?.bounding_box) return null;
    const { x1, y1, x2, y2, img_width, img_height } = result.bounding_box;
    if (!img_width || !img_height) return null;
    const left = (x1 / img_width) * 100;
    const top = (y1 / img_height) * 100;
    const width = ((x2 - x1) / img_width) * 100;
    const height = ((y2 - y1) / img_height) * 100;
    return {
      left: `${Math.max(0, left)}%`,
      top: `${Math.max(0, top)}%`,
      width: `${Math.min(100, width)}%`,
      height: `${Math.min(100, height)}%`,
    };
  }, [result]);

  const pipelineStages = [
    { id: 1, name: "Plate Localization (YOLOv8)", desc: "Locates bounding box coordinates of number plate.", statusText: "01/05: YOLOv8 LOCALIZING NUMBER PLATE..." },
    { id: 2, name: "OpenCV Deskewing & Threshold", desc: "Corrects perspective slant and optimizes contrast.", statusText: "02/05: OPENCV DESKEWING & ENHANCEMENT..." },
    { id: 3, name: "Character Recognition (EasyOCR)", desc: "Reads alphanumeric character sequences.", statusText: "03/05: EASYOCR EXTRACTING CHARACTERS..." },
    { id: 4, name: "Indian Plate Regex Correction", desc: "Fuzzy substitution fixes optical misreads (O vs 0).", statusText: "04/05: CMVR REGEX CORRECTION & FUZZY REPAIR..." },
    { id: 5, name: "Database Verification (FastAPI)", desc: "Retrieves complete vehicle & compliance records.", statusText: "05/05: FASTAPI DATABASE VERIFICATION..." }
  ];

  useEffect(() => {
    let stream = null;
    if (cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error("Camera access failed", err);
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const runPipelineAnimation = async (file) => {
    setProcessing(true);
    setResult(null);

    // Fire neural vision inference immediately in parallel with UI stage tracker
    const detectPromise = anprService.detectPlate(file);

    // Step through visual telemetry stages concurrently
    for (let i = 1; i <= 4; i++) {
      setActiveStep(i);
      await new Promise((res) => setTimeout(res, 180));
    }

    const res = await detectPromise;
    setActiveStep(5);
    setResult(res);
    if (res?.registration_number) {
      setEditablePlate(res.registration_number);
      setIsEditing(false);
    }
    setProcessing(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
      setUploadedPreview(URL.createObjectURL(blob));
      runPipelineAnimation(file);
      setCameraActive(false);
    }, 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedPreview(URL.createObjectURL(file));
    runPipelineAnimation(file);
    setCameraActive(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="ANPR SCANNING WORKSPACE"
        subtitle="Automatic Number Plate Recognition pipeline powered by YOLOv8 and EasyOCR."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Camera / Upload Viewport (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
            <div className="flex items-center justify-between pb-4 border-b border-primary/20 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent" />
                <h3 className="font-heading text-lg text-primary dark:text-white">
                  OPTICAL SENSOR VIEWPORT
                </h3>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="px-3 py-1.5 border border-primary bg-surface dark:bg-surface-dark hover:bg-black hover:text-white text-xs font-bold font-sans uppercase transition-colors shadow-brutal-sm flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> UPLOAD IMAGE
                </span>
              </label>
            </div>

            {/* Video Viewport Frame */}
            <div className="relative aspect-video bg-black border-2 border-primary overflow-hidden flex items-center justify-center p-1">
              {cameraActive ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Live Viewfinder Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-1/3 border-2 border-dashed border-accent/80 relative flex items-center justify-center">
                      <div className="scanner-line w-full h-1 animate-pulse"></div>
                      <span className="absolute -bottom-6 bg-black/85 text-accent text-[9px] font-mono font-bold px-2 py-0.5 border border-accent/40 uppercase">
                        ALIGN LICENSE PLATE INSIDE BOX
                      </span>
                    </div>
                  </div>
                </div>
              ) : uploadedPreview ? (
                <div className="relative inline-flex items-center justify-center max-h-full max-w-full">
                  <img
                    src={uploadedPreview}
                    alt="Captured vehicle plate"
                    className="max-h-[440px] max-w-full object-contain block border border-primary/20"
                  />

                  {/* Scanning Laser Beam & Dynamic Stage Status */}
                  {processing && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-accent/5 backdrop-blur-[0.5px]">
                      <div className="animate-scan-sweep bg-accent shadow-[0_0_15px_#FFE17C]"></div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <span className="inline-block bg-primary text-accent text-[10px] font-mono font-black px-2.5 py-1 border border-accent uppercase tracking-widest shadow-brutal-sm animate-pulse">
                          {pipelineStages.find((s) => s.id === activeStep)?.statusText || "PROCESSING PIPELINE..."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bounding Box Overlay Bounded Exactly to YOLO Coordinates */}
                  {!processing && boxStyle && (
                    <div
                      className="absolute border-2 sm:border-[3px] border-accent shadow-[0_0_16px_rgba(255,225,124,0.85)] pointer-events-none transition-all duration-300 z-10"
                      style={boxStyle}
                    >
                      {/* Brutalist Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-primary bg-accent"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-primary bg-accent"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-primary bg-accent"></div>
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-primary bg-accent"></div>

                      {/* Floating Badge Pin */}
                      <span className="absolute -top-6 left-0 bg-accent text-primary text-[10px] font-mono font-black px-1.5 py-0.5 tracking-wider uppercase whitespace-nowrap shadow-brutal-sm flex items-center gap-1 border border-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        {result.registration_number || "PLATE"} • {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sage p-8">
                  <Camera className="w-16 h-16 mx-auto mb-3 text-accent" />
                  <p className="font-sans text-xs">Camera is offline. Start camera or upload a plate photo.</p>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-wrap gap-4 justify-between items-center">
              {!cameraActive ? (
                <Button
                  onClick={() => { setUploadedPreview(null); setCameraActive(true); }}
                  variant="accent"
                  size="md"
                  icon={Play}
                >
                  ACTIVATE CAMERA FEED
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={handleCapture}
                    variant="accent"
                    size="md"
                    loading={processing}
                    icon={Camera}
                  >
                    CAPTURE & PROCESS
                  </Button>
                  <Button
                    onClick={() => setCameraActive(false)}
                    variant="outline"
                    size="md"
                    icon={Square}
                  >
                    STOP
                  </Button>
                </div>
              )}

              {uploadedPreview && !cameraActive && (
                <Button
                  onClick={() => setCameraActive(true)}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                >
                  NEW SCAN
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Pipeline Stage Monitor & Detection Result (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prominent Charcoal Result Card with Yellow Accents or No Plate Warning */}
          {result && (
            result.detected && result.registration_number ? (
              <div className="bg-primary text-white border-2 border-primary shadow-brutal p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-block bg-accent text-primary px-2.5 py-0.5 text-[10px] font-mono font-black uppercase">
                    ANPR DETECTION SUCCEEDED
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 hover:bg-accent hover:text-primary text-accent border border-accent/40 transition-colors uppercase"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? "LOCK NUMBER" : "OFFICER EDIT"}</span>
                  </button>
                </div>

                <div className="text-xs font-mono text-sage uppercase flex items-center justify-between">
                  <span>CONFIRMED REGISTRATION PLATE</span>
                  {editablePlate !== result.registration_number && (
                    <span className="text-[10px] text-accent font-bold">MANUALLY ADJUSTED</span>
                  )}
                </div>

                {isEditing ? (
                  <div className="my-2">
                    <input
                      type="text"
                      value={editablePlate}
                      onChange={(e) => setEditablePlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      className="w-full bg-black/70 border-2 border-accent text-accent font-heading text-3xl sm:text-4xl px-3 py-2 font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-accent"
                      autoFocus
                      placeholder="e.g. HR71H0003"
                    />
                    <div className="text-[10px] font-mono text-sage/80 mt-1 flex items-center gap-1">
                      <span>Tip: Press Tab or click Lock when done.</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditing(true)}
                    className="font-heading text-4xl sm:text-5xl text-accent font-mono tracking-widest my-2 cursor-pointer hover:opacity-90 flex items-center justify-between group"
                    title="Click to edit plate characters"
                  >
                    <span>{editablePlate || result.registration_number}</span>
                    <Edit3 className="w-5 h-5 text-accent/40 group-hover:text-accent transition-colors" />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono text-sage border-t border-gray-800 pt-3 mb-4">
                  <span>MODEL CONFIDENCE:</span>
                  <strong className="text-white">{(result.confidence * 100).toFixed(1)}%</strong>
                </div>

                {/* YOLOv8 Isolated Plate Crop Preview */}
                {result.plate_crop_base64 && (
                  <div className="mb-4 p-2.5 bg-black/50 border border-accent/40 shadow-inner">
                    <div className="text-[10px] font-mono text-sage uppercase mb-1.5 flex items-center justify-between">
                      <span>ISOLATED REGION OF INTEREST:</span>
                      <span className="text-accent font-bold">YOLOv8 CROPPED</span>
                    </div>
                    <img
                      src={result.plate_crop_base64}
                      alt="Cropped License Plate"
                      className="max-h-16 w-auto max-w-full object-contain mx-auto border border-accent shadow-sm"
                    />
                    <div className="mt-1.5 text-[10px] font-mono text-center text-sage/70">
                      Cross-reference visual crop with detected text above.
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => navigate(`/vehicle-verification?reg=${(editablePlate || result.registration_number).trim().toUpperCase()}`)}
                  variant="accent"
                  size="md"
                  className="w-full font-black text-sm"
                >
                  OPEN COMPLETE VERIFICATION <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : result.is_network_error ? (
              <div className="bg-white dark:bg-surface border-2 border-warning shadow-brutal p-6 relative overflow-hidden">
                <div className="inline-block bg-warning text-black px-2.5 py-0.5 text-[10px] font-mono font-black uppercase mb-3">
                  BACKEND OFFLINE
                </div>

                <div className="text-xs font-mono text-warning uppercase font-bold">STATUS: CONNECTION FAILED</div>
                <div className="font-heading text-2xl text-primary dark:text-white my-2">
                  COULD NOT REACH BACKEND (PORT 8000)
                </div>

                <p className="text-xs text-sage font-sans mb-4 leading-relaxed">
                  The frontend client could not reach the FastAPI neural vision server at <code>http://localhost:8000</code>.
                </p>

                <div className="p-3 bg-gray-50 dark:bg-surface-dark border border-dashed border-gray-300 dark:border-gray-700 text-[11px] font-mono text-sage space-y-1 mb-4">
                  <div>• Ensure the backend process is active: <code>uvicorn main:app --port 8000</code></div>
                  <div>• Verify http://localhost:8000/docs loads in your browser.</div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-sage border-t border-gray-200 dark:border-gray-800 pt-3">
                  <span>NETWORK STATUS:</span>
                  <strong className="text-warning">ERR_CONNECTION_REFUSED</strong>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-surface border-2 border-red-500 shadow-brutal p-6 relative overflow-hidden">
                <div className="inline-block bg-red-500 text-white px-2.5 py-0.5 text-[10px] font-mono font-black uppercase mb-3">
                  NO LICENSE PLATE DETECTED
                </div>

                <div className="text-xs font-mono text-red-500 uppercase font-bold">STATUS: ZERO PLATE CANDIDATES</div>
                <div className="font-heading text-2xl text-primary dark:text-white my-2">
                  NO VALID REGISTRATION PLATE FOUND
                </div>

                <p className="text-xs text-sage font-sans mb-4 leading-relaxed">
                  The optical neural vision pipeline could not identify a valid Indian vehicle registration plate in this image.
                </p>

                <div className="p-3 bg-gray-50 dark:bg-surface-dark border border-dashed border-gray-300 dark:border-gray-700 text-[11px] font-mono text-sage space-y-1 mb-4">
                  <div>• Ensure the front or rear number plate is clearly visible.</div>
                  <div>• Check that the plate is not obstructed, tilted, or blurry.</div>
                  <div>• Avoid uploading personal photos or non-vehicle scenes.</div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-sage border-t border-gray-200 dark:border-gray-800 pt-3">
                  <span>DETECTION CONFIDENCE:</span>
                  <strong className="text-red-500">0.0%</strong>
                </div>
              </div>
            )
          )}

          {/* AI Pipeline Stages Tracker */}
          <div className="bg-white dark:bg-surface border-2 border-primary shadow-brutal p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-primary/20 mb-4">
              <Cpu className="w-5 h-5 text-accent" />
              <h3 className="font-heading text-lg text-primary dark:text-white">
                PIPELINE EXECUTION TELEMETRY
              </h3>
            </div>

            <div className="space-y-4">
              {pipelineStages.map((stg) => {
                const isDone = activeStep >= stg.id || (result && !processing);
                const isCurrent = activeStep === stg.id && processing;

                return (
                  <div
                    key={stg.id}
                    className={`p-3 border transition-colors ${
                      isCurrent
                        ? 'bg-accent/20 border-primary font-bold'
                        : isDone
                        ? 'bg-surface dark:bg-surface-dark border-sage/60'
                        : 'opacity-40 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-primary dark:text-white">
                        0{stg.id}. {stg.name}
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-success" />}
                    </div>
                    <p className="text-[11px] font-sans text-secondary dark:text-gray-400">
                      {stg.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

