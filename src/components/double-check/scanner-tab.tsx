"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, RotateCcw, Zap } from "lucide-react";

import { prepareScanImage } from "@/lib/image-prep";
import { createNoStandardsVerdict, createVerifyVerdict, type ScanVerdict } from "@/lib/scan";

import { VerdictCard } from "./verdict-card";
import { ImageCropper } from "./image-cropper";

type ScannerTabProps = {
  active: Set<string>;
  pendingFile?: File | null;
  clearPendingFile?: () => void;
  onScanComplete?: (verdict: ScanVerdict) => void;
};

type ScanState = "idle" | "scanning" | "result";

const SCANNING_MESSAGES = [
  "Ingesting menu data",
  "Applying your exact standards",
  "Hunting for hidden non-compliances",
  "Verifying culinary integrity",
];

export function ScannerTab({ active, pendingFile, clearPendingFile, onScanComplete }: ScannerTabProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [ticks, setTicks] = useState(0);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<ScanVerdict | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  
  const messageIndex = Math.floor(ticks / 5) % SCANNING_MESSAGES.length;
  const dotsCount = ticks % 4;

  const message = useMemo(() => {
    if (success) return "🎉 Analysis complete!";
    return SCANNING_MESSAGES[messageIndex];
  }, [messageIndex, success]);

  const scanIdRef = useRef(0);

  const processFile = async (file: File) => {

    const scanId = scanIdRef.current + 1;
    scanIdRef.current = scanId;
    const criteriaIds = Array.from(active);

    setSuccess(false);
    setTicks(0);
    setResult(null);
    setState("scanning");

    let prepared;
    try {
      prepared = await prepareScanImage(file);
    } catch (err) {
      if (scanIdRef.current !== scanId) return;
      setState("idle");
      return;
    }

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: prepared.imageBase64,
          mimeType: prepared.mimeType,
          criteriaIds,
          imageMeta: {
            width: prepared.width,
            height: prepared.height,
            bytes: prepared.bytes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Double Check could not complete the scan.");
      }

      const verdict = (await response.json()) as ScanVerdict;

      if (scanIdRef.current !== scanId) return;

      setSuccess(true);
      await wait(500);

      if (scanIdRef.current !== scanId) return;

      setResult(verdict);
      onScanComplete?.(verdict);
      setState("result");
    } catch (error) {
      if (scanIdRef.current !== scanId) return;

      setResult(
        createVerifyVerdict(
          criteriaIds,
          error instanceof Error ? error.message : "Double Check could not complete the scan."
        )
      );
      setState("result");
    }
  };

  useEffect(() => {
    if (state !== "scanning" || success) return;
    const interval = setInterval(() => {
      setTicks((current) => current + 1);
    }, 500);
    return () => clearInterval(interval);
  }, [state, success]);

  useEffect(() => {
    if (pendingFile && state === "idle") {
      const url = URL.createObjectURL(pendingFile);
      clearPendingFile?.();
      setTimeout(() => setCropImageSrc(url), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFile, state]);

  if (cropImageSrc) {
    return (
      <ImageCropper
        imageSrc={cropImageSrc}
        onCropComplete={(blob) => {
          setCropImageSrc(null);
          const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
          setTimeout(() => processFile(file).catch(console.error), 0);
        }}
        onCancel={() => {
          setCropImageSrc(null);
          setState("idle");
        }}
      />
    );
  }

  if (state === "result" && result) {
    return (
      <div className="flex-1 bg-background p-6">
        <VerdictCard result={result} onScanAgain={() => {
          setState("idle");
          document.getElementById("global-camera-input")?.click();
        }} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#121212] flex flex-col relative overflow-hidden">
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 w-full h-full">
        
        {state === "idle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <ImageIcon className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Ready to Scan</h3>
              <p className="text-muted-foreground mt-2">Use the Scanner button in the bottom menu to open your camera.</p>
            </div>
            <button 
              onClick={() => document.getElementById("global-camera-input")?.click()}
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-full"
            >
              Open Camera
            </button>
          </motion.div>
        )}

        {state === "scanning" && (
          <motion.div
            key="scanning"
            className="w-full text-center text-white z-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={success ? "success" : messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                className="text-xl font-medium tracking-tight flex justify-center"
              >
                <div className="relative inline-flex">
                  <span>{message}</span>
                  {!success && (
                    <span className="absolute left-full text-left w-8">
                      {'.'.repeat(dotsCount)}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
