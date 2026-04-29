"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, RotateCcw, Zap } from "lucide-react";

import { prepareScanImage } from "@/lib/image-prep";
import {
  createNoStandardsVerdict,
  createVerifyVerdict,
  type ScanVerdict,
} from "@/lib/scan";

import { VerdictCard } from "./verdict-card";

type ScannerTabProps = {
  active: Set<string>;
  onScanComplete?: (verdict: ScanVerdict) => void;
};

type ScanState = "idle" | "scanning" | "result";

const SCANNING_MESSAGES = [
  "Ingesting menu data",
  "Applying your exact standards",
  "Hunting for hidden non-compliances",
  "Verifying culinary integrity",
];

export function ScannerTab({ active, onScanComplete }: ScannerTabProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [ticks, setTicks] = useState(0);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<ScanVerdict | null>(null);
  
  const messageIndex = Math.floor(ticks / 5) % SCANNING_MESSAGES.length;
  const dotsCount = ticks % 4;

  const message = useMemo(() => {
    if (success) return "🎉 Analysis complete!";
    return SCANNING_MESSAGES[messageIndex];
  }, [messageIndex, success]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIdRef = useRef(0);

  const handleScanClick = () => {
    if (active.size === 0) {
      setResult(createNoStandardsVerdict());
      setState("result");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const scanId = scanIdRef.current + 1;
    scanIdRef.current = scanId;
    const criteriaIds = Array.from(active);

    setSuccess(false);
    setTicks(0);
    setResult(null);
    setState("scanning");
    e.target.value = "";

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

  if (state === "result" && result) {
    return (
      <div className="flex-1 bg-background p-6">
        <VerdictCard result={result} onScanAgain={() => setState("idle")} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#121212] flex flex-col relative overflow-hidden">
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 w-full h-full">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        
        {state === "idle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="absolute top-6 right-6">
              <button className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center text-white border border-white/20">
                <Zap className="h-5 w-5" />
              </button>
            </div>
            
            <div className="relative w-full max-w-sm aspect-[3/4] border-2 border-transparent">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
              
              {/* Scanning laser line (purely visual) */}
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-primary/80 shadow-[0_0_15px_rgba(0,107,77,0.8)]"></div>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center space-y-6">
              <div className="bg-black/60 backdrop-blur-md text-white text-sm font-medium py-2 px-6 rounded-full border border-white/10">
                Position menu within the frame
              </div>
              <div className="flex items-center gap-8">
                <button className="h-12 w-12 rounded-full bg-black/40 flex items-center justify-center text-white border border-white/20 hover:bg-black/60">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={handleScanClick}
                  className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-95 transition-transform"
                >
                  <div className="h-16 w-16 bg-white rounded-full"></div>
                </button>
                <button className="h-12 w-12 rounded-full bg-black/40 flex items-center justify-center text-white border border-white/20 hover:bg-black/60">
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
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
