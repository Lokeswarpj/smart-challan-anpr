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
  Cpu
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const pipelineStages = [
    { id: 1, name: "Plate Localization (YOLOv8)", desc: "Locates bounding box coordinates of number plate." },
    { id: 2, name: "OpenCV Deskewing & Threshold", desc: "Corrects perspective slant and optimizes contrast." },
    { id: 3, name: "Character Recognition (EasyOCR)", desc: "Reads alphanumeric character sequences." },
    { id: 4, name: "Indian Plate Regex Correction", desc: "Fuzzy substitution fixes optical misreads (O vs 0)." },
    { id: 5, name: "Database Verification (FastAPI)", desc: "Retrieves complete vehicle & compliance records." }
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

    // Animate through pipeline stages for transparency and visual clarity
    for (let i = 1; i <= 5; i++) {
      setActiveStep(i);
      await new Promise((res) => setTimeout(res, 250));
    }

    const res = await anprService.detectPlate(file);
    setResult(res);
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
            <div className="relative aspect-video bg-black border-2 border-primary overflow-hidden flex items-center justify-center">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : uploadedPreview ? (
                <img
                  src={uploadedPreview}
                  alt="Captured vehicle plate"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-sage p-8">
                  <Camera className="w-16 h-16 mx-auto mb-3 text-accent" />
                  <p className="font-sans text-xs">Camera is offline. Start camera or upload a plate photo.</p>
                </div>
              )}

              {/* Reticle Scanner Line */}
              {(cameraActive || processing) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-2/5 border-2 border-accent relative">
                    <div className="scanner-line w-full h-1 animate-pulse"></div>
                  </div>
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
                <div className="inline-block bg-accent text-primary px-2.5 py-0.5 text-[10px] font-mono font-black uppercase mb-3">
                  ANPR DETECTION SUCCEEDED
                </div>

                <div className="text-xs font-mono text-sage uppercase">EXTRACTED REGISTRATION PLATE</div>
                <div className="font-heading text-4xl sm:text-5xl text-accent font-mono tracking-widest my-2">
                  {result.registration_number}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-sage border-t border-gray-800 pt-3 mb-6">
                  <span>MODEL CONFIDENCE:</span>
                  <strong className="text-white">{(result.confidence * 100).toFixed(1)}%</strong>
                </div>

                <Button
                  onClick={() => navigate(`/vehicle-verification?reg=${result.registration_number}`)}
                  variant="accent"
                  size="md"
                  className="w-full font-black text-sm"
                >
                  OPEN COMPLETE VERIFICATION <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
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

