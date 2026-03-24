"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClear: () => void;
  captured: boolean;
}

export function CameraCapture({ onCapture, onClear, captured }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStreaming && !preview && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isStreaming, preview]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, // Use default camera, don't force 'environment' (rear) since desktops don't have one
        audio: false,
      });
      streamRef.current = stream;
      // Tell React to render the video element. The useEffect will attach the stream.
      setIsStreaming(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob → File
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `product_${Date.now()}.jpg`, { type: "image/jpeg" });
        setPreview(canvas.toDataURL("image/jpeg", 0.85));
        onCapture(file);
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  }, [onCapture, stopCamera]);

  const retake = useCallback(() => {
    setPreview(null);
    onClear();
    startCamera();
  }, [onClear, startCamera]);

  const discard = useCallback(() => {
    setPreview(null);
    onClear();
    stopCamera();
  }, [onClear, stopCamera]);

  // ─── Not started ───
  if (!isStreaming && !preview) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={startCamera}
          className="w-full h-32 border-dashed border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 flex flex-col gap-2 items-center justify-center"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm font-medium">Open Camera to Capture Product Photo</span>
          <span className="text-xs text-gray-500">Live capture only — no gallery uploads</span>
        </Button>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>
    );
  }

  // ─── Preview (captured) ───
  if (preview) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden border border-emerald-500/30">
          <img src={preview} alt="Captured" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <Button type="button" size="sm" onClick={retake} className="h-7 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Retake
            </Button>
            <Button type="button" size="sm" onClick={discard} className="h-7 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-300 border-0 text-xs">
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Check className="h-3 w-3" /> Photo Captured
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Live video stream ───
  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-amber-500/30 bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
        {/* Capture overlay */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          <Button
            type="button"
            onClick={capturePhoto}
            className="h-14 w-14 rounded-full bg-white/90 hover:bg-white text-black shadow-lg shadow-black/50 flex items-center justify-center"
          >
            <Camera className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute top-2 right-2">
          <Button type="button" size="sm" onClick={discard} className="h-7 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-300 border-0 text-xs">
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
        {/* Recording indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-white/80 backdrop-blur-sm">LIVE</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
