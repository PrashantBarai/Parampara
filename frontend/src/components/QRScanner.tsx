"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, X, Loader2, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (productId: string, sig: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScan, onError, onClose, className = "" }: QRScannerProps) {
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const readerId = "qr-reader-" + useRef(Math.random().toString(36).slice(2)).current;

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.platform && data.platform !== "ParamparaChain") {
          onError?.("Invalid QR code: not a ParamparaChain product");
          return;
        }
        if (data.productId) {
          stopScanner();
          onScan(data.productId, data.sig || "");
        } else {
          onError?.("Invalid QR code: missing product ID");
        }
      } catch {
        // Try as plain product ID string
        if (decodedText.startsWith("PROD-")) {
          stopScanner();
          onScan(decodedText, "");
        } else {
          onError?.("Invalid QR code format");
        }
      }
    },
    [onScan, onError, stopScanner]
  );

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScanSuccess,
          () => {} // ignore scan failures (no match yet)
        );

        if (mounted) {
          setIsScanning(true);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setLoading(false);
          onError?.(err?.message || "Failed to start QR scanner");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black" style={{ minHeight: 300 }}>
        <div id={readerId} className="w-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Starting scanner...</span>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">Scanning</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">Point your camera at a ParamparaChain QR code</p>

      {onClose && (
        <Button
          onClick={() => { stopScanner(); onClose(); }}
          variant="outline"
          className="border-white/10 text-gray-300 hover:bg-gray-800"
        >
          <X className="mr-2 h-4 w-4" /> Close Scanner
        </Button>
      )}
    </div>
  );
}
