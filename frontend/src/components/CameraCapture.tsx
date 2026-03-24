"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X, AlertTriangle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel?: () => void;
  className?: string;
}

export function CameraCapture({ onCapture, onCancel, className = "" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera. Please try again.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    canvas.toBlob(
      (blob) => {
        if (blob) setCapturedBlob(blob);
      },
      "image/jpeg",
      0.9
    );
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  const accept = useCallback(() => {
    if (capturedBlob) onCapture(capturedBlob);
  }, [capturedBlob, onCapture]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/5 p-8 ${className}`}>
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-sm text-red-400 text-center mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={startCamera} variant="outline" size="sm" className="border-white/10 text-gray-300">
            <RotateCcw className="mr-2 h-3 w-3" /> Retry
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline" size="sm" className="border-white/10 text-gray-300">
              <X className="mr-2 h-3 w-3" /> Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {capturedImage ? (
        <>
          <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
            <img src={capturedImage} alt="Captured" className="w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-xs text-gray-300 text-center">Review your capture</p>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <Button onClick={retake} variant="outline" className="flex-1 border-white/10 text-gray-300 hover:bg-gray-800">
              <RotateCcw className="mr-2 h-4 w-4" /> Retake
            </Button>
            <Button onClick={accept} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Check className="mr-2 h-4 w-4" /> Use Photo
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full object-cover"
              style={{ minHeight: 240 }}
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="flex items-center gap-2 text-gray-400">
                  <Camera className="h-5 w-5 animate-pulse" />
                  <span className="text-sm">Starting camera...</span>
                </div>
              </div>
            )}
            {isStreaming && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Live</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full">
            {onCancel && (
              <Button onClick={() => { stopCamera(); onCancel(); }} variant="outline" className="border-white/10 text-gray-300 hover:bg-gray-800">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
            <Button
              onClick={capture}
              disabled={!isStreaming}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
            >
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
