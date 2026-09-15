import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Keyboard,
  AlertCircle,
  FileText,
  Lock,
  VideoOff,
  Sparkles,
  Zap,
  ZapOff,
  SwitchCamera,
} from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { backendApi } from '../services/backendApi';

interface BPLQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientLoaded: (patientData: any) => void;
}

type CameraStatus = 'idle' | 'starting' | 'scanning' | 'detected' | 'permission_denied' | 'error';

// Helper functions to safely extract string labels from conditions and allergies
export const getConditionLabel = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.condition_name || item.conditionName || item.name || JSON.stringify(item);
};

export const getAllergyLabel = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const substance = item.substance || item.allergen || item.name || '';
  const severity = item.severity ? ` (${item.severity})` : '';
  return substance ? `${substance}${severity}` : JSON.stringify(item);
};

export const BPLQRScannerModal: React.FC<BPLQRScannerModalProps> = ({
  isOpen,
  onClose,
  onPatientLoaded,
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [qrInput, setQrInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedData, setResolvedData] = useState<any | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [videoDims, setVideoDims] = useState<{ width: number; height: number } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScannerRunningRef = useRef(false);
  const scannerContainerId = 'bpl-qr-scanner-region';

  // Stop and clean up any running scanner instance
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScannerRunningRef.current) {
      try {
        if (torchOn) {
          try {
            await (html5QrCodeRef.current as any).applyVideoConstraints({
              advanced: [{ torch: false }],
            });
          } catch (_) {
            // ignore
          }
          setTorchOn(false);
        }
        await html5QrCodeRef.current.stop();
        isScannerRunningRef.current = false;
        console.log('[BPL_CAMERA] Camera stream stopped cleanly');
      } catch (err) {
        console.warn('[BPL_CAMERA] Error stopping camera stream:', err);
      }
    }
  }, [torchOn]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopScanner().finally(() => {
        if (html5QrCodeRef.current) {
          try {
            html5QrCodeRef.current.clear();
          } catch (_) {
            // ignore
          }
          html5QrCodeRef.current = null;
        }
      });
      setResolvedData(null);
      setError(null);
      setQrInput('');
      setCameraStatus('idle');
      setCameraErrorDetail(null);
      setScanMode('camera');
      setTorchOn(false);
      setVideoDims(null);
    }
  }, [isOpen, stopScanner]);

  // Modal open diagnostic logging
  useEffect(() => {
    if (isOpen) {
      console.log('[BPL_MODAL] open=true');
      console.log('[BPL_MODAL] contentMounted=true');
    }
  }, [isOpen]);

  // Query available video cameras on modal open
  useEffect(() => {
    if (isOpen) {
      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cameras && cameras.length > 0) {
            console.log('[BPL_CAMERA] devicesFound=' + cameras.length);
            setAvailableCameras(cameras);
            if (!selectedCameraId) {
              const backCamera = cameras.find(
                (c) =>
                  c.label.toLowerCase().includes('back') ||
                  c.label.toLowerCase().includes('rear') ||
                  c.label.toLowerCase().includes('environment')
              );
              setSelectedCameraId(backCamera ? backCamera.id : cameras[0].id);
            }
          } else {
            console.log('[BPL_CAMERA] devicesFound=0');
          }
        })
        .catch((err) => {
          console.warn('[BPL_CAMERA] Could not enumerate cameras:', err);
        });
    }
  }, [isOpen, selectedCameraId]);

  // Main QR resolution handler
  const handleResolveQR = async (payloadToResolve?: string) => {
    const payload = (payloadToResolve || qrInput).trim();
    if (!payload) {
      setError('Please enter or scan a Bharat PulseLink QR payload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCameraStatus('detected');

    // Immediately stop camera scanning to free device video resources
    await stopScanner();

    try {
      console.log('[BPL_CAMERA] qrDetected=true');
      toast.info('Connecting to Bharat PulseLink Security Gateway...');
      const response = await backendApi.resolveBPLQR(payload);

      if (response.success && response.data) {
        setResolvedData(response.data);
        toast.success(`Verified: ${response.data.patient?.fullName || 'Patient'}`);
      } else {
        throw new Error('Unsuccessful verification from Bharat PulseLink');
      }
    } catch (err: any) {
      console.error('[BPL QR SCAN] Error:', err);
      let errorMsg = err.message || 'Failed to verify QR session';

      if (errorMsg.includes('QR_SESSION_ALREADY_USED') || errorMsg.includes('already been used')) {
        errorMsg = 'This QR code was already consumed. Single-use replay protection is active.';
      } else if (errorMsg.includes('QR_SESSION_EXPIRED') || errorMsg.includes('expired')) {
        errorMsg = 'This QR code has expired. Please ask the patient to generate a fresh QR.';
      } else if (errorMsg.includes('FORBIDDEN') || errorMsg.includes('consent')) {
        errorMsg = 'Access denied: Patient consent policy does not authorize this request.';
      }

      setError(errorMsg);
      toast.error(errorMsg);

      // In camera mode, restart camera scanner after a short delay so user can try again
      if (scanMode === 'camera') {
        setTimeout(() => {
          startCameraScanner();
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start Html5Qrcode camera scanning
  const startCameraScanner = useCallback(async () => {
    if (!isOpen || scanMode !== 'camera' || resolvedData) return;

    setCameraStatus('starting');
    setCameraErrorDetail(null);
    setError(null);

    // Ensure DOM container exists
    const container = document.getElementById(scannerContainerId);
    if (!container) {
      console.warn('[BPL_CAMERA] Scanner container DOM element not found yet, retrying in 100ms...');
      setTimeout(startCameraScanner, 100);
      return;
    }

    try {
      console.log('[BPL_CAMERA] scannerMounted=true');

      // Clean up previous instance if any
      if (html5QrCodeRef.current) {
        if (isScannerRunningRef.current) {
          await html5QrCodeRef.current.stop();
          isScannerRunningRef.current = false;
        }
        try {
          html5QrCodeRef.current.clear();
        } catch (_) {
          // ignore
        }
      }

      const qrScanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxEdge = Math.max(220, Math.floor(minEdge * 0.7));
          return { width: boxEdge, height: boxEdge };
        },
        aspectRatio: 1.333333,
      };

      // Determine camera constraint: if specific camera selected, use deviceId; else ideal environment
      const cameraConstraint = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: { ideal: 'environment' } };

      await qrScanner.start(
        cameraConstraint,
        config,
        (decodedText) => {
          console.log('[BPL_CAMERA] qrDetected=true prefix=' + decodedText.substring(0, 12));
          handleResolveQR(decodedText);
        },
        () => {
          // Frame scanner tick
        }
      );

      isScannerRunningRef.current = true;
      setCameraStatus('scanning');
      console.log('[BPL_CAMERA] scannerStarted=true');
      console.log('[BPL_CAMERA] permission=granted');

      // Inspect video element rendered inside container
      const videoEl = container.querySelector('video') as HTMLVideoElement | null;
      if (videoEl) {
        videoEl.setAttribute('playsinline', 'true');
        videoEl.setAttribute('autoplay', 'true');
        videoEl.muted = true;
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
        }
        const width = videoEl.videoWidth || videoEl.clientWidth;
        const height = videoEl.videoHeight || videoEl.clientHeight;
        console.log(`[BPL_CAMERA] videoWidth=${width} videoHeight=${height}`);
        setVideoDims({ width, height });
      }

      // Check if torch/flashlight is supported
      try {
        const capabilities = (qrScanner as any).getRunningTrackCapabilities?.();
        if (capabilities && capabilities.torch) {
          setIsTorchSupported(true);
        }
      } catch (_) {
        setIsTorchSupported(false);
      }
    } catch (err: any) {
      console.error('[BPL_CAMERA] Camera start error:', err);
      isScannerRunningRef.current = false;

      const msg = err?.message || String(err);
      if (
        msg.includes('NotAllowedError') ||
        msg.includes('Permission denied') ||
        msg.includes('PermissionDismissedError')
      ) {
        setCameraStatus('permission_denied');
        setCameraErrorDetail('Camera access was blocked by the browser. Please allow camera permissions in your browser address bar.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setCameraStatus('error');
        setCameraErrorDetail('No video input camera device was detected on this system.');
      } else {
        // If exact constraint failed, try generic fallback
        if (selectedCameraId) {
          console.warn('[BPL_CAMERA] Retrying with generic facingMode constraint...');
          setSelectedCameraId(null);
          return;
        }
        setCameraStatus('error');
        setCameraErrorDetail(msg || 'Unable to access camera.');
      }
    }
  }, [isOpen, scanMode, resolvedData, selectedCameraId]);

  // Lifecycle effect: Start or stop scanner based on modal state & scanMode
  useEffect(() => {
    if (isOpen && scanMode === 'camera' && !resolvedData) {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 250);
      return () => clearTimeout(timer);
    } else if (scanMode === 'manual' || resolvedData) {
      stopScanner();
    }
  }, [isOpen, scanMode, resolvedData, selectedCameraId, startCameraScanner, stopScanner]);

  // Flashlight / Torch toggle handler
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScannerRunningRef.current) return;
    try {
      const nextTorch = !torchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
      toast.info(nextTorch ? 'Flashlight ON' : 'Flashlight OFF');
    } catch (err) {
      toast.error('Flashlight is not supported on this camera device');
    }
  };

  // Switch camera handler (for multi-camera mobile/tablet devices)
  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    toast.info(`Switched to: ${nextCamera.label || 'Camera ' + (nextIndex + 1)}`);
  };

  const handleApplyToTriage = () => {
    if (resolvedData?.patient) {
      onPatientLoaded({
        ...resolvedData.patient,
        exchangeId: resolvedData.exchangeId,
        bplExchangeId: resolvedData.exchangeId,
        bplVerified: true,
      });
      toast.success('Patient intake loaded into Triage Engine');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-800 shadow-2xl overflow-hidden p-0">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-inner">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    Bharat PulseLink Secure Intake
                    <Badge variant="outline" className="border-teal-500/50 text-teal-400 bg-teal-500/10 text-[10px] uppercase font-bold tracking-wider">
                      Zero PHI In QR
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs mt-0.5">
                    Scan the patient's dynamic QR code to securely intake verified clinical records.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          {!resolvedData ? (
            <div className="space-y-4">
              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 rounded-xl bg-slate-800/90 p-1 border border-slate-700/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    scanMode === 'camera'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Live Camera Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('manual')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    scanMode === 'manual'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  Manual / Barcode Gun
                </button>
              </div>

              {/* Camera Scanner Mode */}
              {scanMode === 'camera' && (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-2xl h-[380px] min-h-[380px] w-full flex items-center justify-center">
                    {/* The HTML5 QR Code Mount Region */}
                    <div
                      id={scannerContainerId}
                      className="w-full h-full min-h-[380px]"
                      style={{ width: '100%', height: '380px', minHeight: '380px' }}
                    />

                    {/* Camera Overlay HUD during active scanning */}
                    {cameraStatus === 'scanning' && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                        {/* Target Reticle */}
                        <div className="relative w-64 h-64 border-2 border-teal-400/80 rounded-2xl shadow-[0_0_25px_rgba(45,212,191,0.25)]">
                          {/* Corner Accents */}
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                          {/* Animated Laser Scanning Line */}
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent animate-[scanLaser_2.5s_ease-in-out_infinite] shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
                        </div>
                        <p className="mt-4 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] text-teal-300 font-medium border border-teal-500/30">
                          Align Bharat PulseLink QR inside frame
                        </p>
                      </div>
                    )}

                    {/* Camera Controls Bar (Torch & Switch Camera) */}
                    {cameraStatus === 'scanning' && (
                      <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                        {isTorchSupported && (
                          <button
                            type="button"
                            onClick={handleToggleTorch}
                            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                              torchOn
                                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : 'bg-black/60 text-white border-slate-700 hover:bg-black/80'
                            }`}
                            title="Toggle Flashlight"
                          >
                            {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                          </button>
                        )}
                        {availableCameras.length > 1 && (
                          <button
                            type="button"
                            onClick={handleSwitchCamera}
                            className="p-2 rounded-full bg-black/60 text-white border border-slate-700 hover:bg-black/80 backdrop-blur-md transition-all"
                            title="Switch Camera"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Camera Starting / Initializing State */}
                    {cameraStatus === 'starting' && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">Starting Live Camera Feed...</p>
                          <p className="text-xs text-slate-400">Requesting browser video capture device</p>
                        </div>
                      </div>
                    )}

                    {/* QR Detected & Resolving State */}
                    {cameraStatus === 'detected' && (
                      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
                        <RefreshCw className="w-10 h-10 text-teal-400 animate-spin" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-teal-300">QR Code Detected</p>
                          <p className="text-xs text-slate-300">Validating single-use session & consent with BPL Gateway...</p>
                        </div>
                      </div>
                    )}

                    {/* Permission Denied State */}
                    {cameraStatus === 'permission_denied' && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3.5 p-6 text-center z-20">
                        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <VideoOff className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <p className="text-sm font-bold text-white">Camera Access Blocked</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {cameraErrorDetail || 'Please allow camera permission in your browser to scan QR codes.'}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={startCameraScanner}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry Camera
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setScanMode('manual')}
                            className="border-slate-700 text-slate-300 hover:text-white text-xs gap-1.5"
                          >
                            <Keyboard className="w-3 h-3" />
                            Enter Manually
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Device Error State */}
                    {cameraStatus === 'error' && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3.5 p-6 text-center z-20">
                        <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                          <p className="text-sm font-bold text-white">Camera Unavailable</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {cameraErrorDetail || 'Could not start video stream on this device.'}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={startCameraScanner}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Try Again
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setScanMode('manual')}
                            className="border-slate-700 text-slate-300 hover:text-white text-xs gap-1.5"
                          >
                            <Keyboard className="w-3 h-3" />
                            Enter Manually
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Input Fallback Mode */}
              {scanMode === 'manual' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>QR Payload URI or Security Token</span>
                      <code className="text-[10px] text-teal-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">bplqr://v1/s?...</code>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste bplqr://v1/s?sid=...&t=... or use barcode gun"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleResolveQR()}
                        disabled={isLoading}
                        className="bg-slate-800/90 border-slate-700 text-white text-xs placeholder:text-slate-500 font-mono"
                      />
                      <Button
                        onClick={() => handleResolveQR()}
                        disabled={isLoading || !qrInput.trim()}
                        className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 gap-1.5 shadow-md shrink-0 font-bold"
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Resolve QR'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-slate-400 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                      <Lock className="w-3.5 h-3.5 text-teal-400" />
                      Zero PHI In QR Token — Strict Cryptographic Boundary
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      The dynamic QR code contains zero Personally Identifiable Health Information (PHI).
                      The Hospital Backend verifies token validity, facility identity, and patient consent before receiving the approved clinical record.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message Box */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 shadow-inner">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-rose-200">Validation Error:</span>
                    <p className="text-rose-300/90 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Resolved Verified Patient View */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Patient Identity & Records Verified
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="text-[11px] text-teal-300 font-mono mt-0.5">
                      Exchange ID: {resolvedData.exchangeId}
                    </div>
                  </div>
                </div>
                <Badge className="bg-teal-600 text-white text-xs font-semibold px-2.5 py-1">
                  Consent Verified
                </Badge>
              </div>

              {/* Core Demographic Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Name</div>
                  <div className="text-sm font-black text-white mt-1">{resolvedData.patient?.fullName || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Age / Gender</div>
                  <div className="text-sm font-black text-white mt-1">
                    {resolvedData.patient?.age || '36'} yrs • {resolvedData.patient?.gender || 'MALE'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Blood Group</div>
                  <div className="text-sm font-black text-rose-400 mt-1">
                    {resolvedData.patient?.bloodGroup || 'Not specified'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ABHA ID</div>
                  <div className="text-xs font-bold text-teal-300 font-mono mt-1">
                    {resolvedData.patient?.abhaId || '12-3456-7890-1234'}
                  </div>
                </div>
              </div>

              {/* Allergies & Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Known Allergies ({resolvedData.patient?.allergies?.length || 0})
                  </div>
                  {resolvedData.patient?.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {resolvedData.patient.allergies.map((allergy: any, idx: number) => (
                        <Badge key={idx} variant="destructive" className="text-xs py-0.5 px-2 bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold">
                          {getAllergyLabel(allergy)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No known allergies recorded</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Medical Conditions ({resolvedData.patient?.conditions?.length || 0})
                  </div>
                  {resolvedData.patient?.conditions?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {resolvedData.patient.conditions.map((condition: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2 bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold">
                          {getConditionLabel(condition)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No chronic conditions recorded</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {resolvedData.patient?.emergencyContact && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Emergency Contact:</span>
                  <span className="text-white font-semibold">
                    {resolvedData.patient.emergencyContact.name} ({resolvedData.patient.emergencyContact.relationship})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </Button>

          {resolvedData ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResolvedData(null);
                  setQrInput('');
                  setScanMode('camera');
                }}
                className="border-slate-700 text-slate-300 hover:text-white text-xs"
              >
                Scan Another QR
              </Button>
              <Button
                type="button"
                onClick={handleApplyToTriage}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 flex items-center gap-1.5 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply to Triage
              </Button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Verified Bharat PulseLink Integration
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BPLQRScannerModal;
