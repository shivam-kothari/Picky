"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { prepareScanImage } from "@/lib/image-prep";
import { fadeUp } from "@/lib/motion";
import {
  createNoStandardsVerdict,
  createVerifyVerdict,
  type ScanVerdict,
} from "@/lib/scan";

import { VerdictCard } from "./verdict-card";

type ScanPanelProps = {
  active: Set<string>;
};

type ScanState = "idle" | "scanning" | "result";

const MESSAGES = [
  "Ingesting menu data...",
  "Applying your exact standards...",
  "Hunting for hidden non-compliances...",
  "Verifying culinary integrity...",
  "Selection curated.",
] as const;

const STEP_MS = 600;

export function ScanPanel({ active }: ScanPanelProps) {
  const [state, setState] = useState<ScanState>("idle");
  const [messageIndex, setMessageIndex] = useState(0);
  const [result, setResult] = useState<ScanVerdict | null>(null);
  const message = useMemo(() => MESSAGES[messageIndex], [messageIndex]);
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
    const minimumScan = wait(STEP_MS * MESSAGES.length);

    setMessageIndex(0);
    setResult(null);
    setState("scanning");

    // Reset so same file can trigger again if needed
    e.target.value = "";

    try {
      const prepared = await prepareScanImage(file);
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error("Picky could not complete the scan.");
      }

      const verdict = (await response.json()) as ScanVerdict;
      await minimumScan;

      if (scanIdRef.current !== scanId) {
        return;
      }

      setResult(verdict);
      setState("result");
    } catch (error) {
      await minimumScan;

      if (scanIdRef.current !== scanId) {
        return;
      }

      setResult(
        createVerifyVerdict(
          criteriaIds,
          error instanceof Error
            ? error.message
            : "Picky could not complete the scan.",
          {
            summary:
              "The scan pipeline failed before a reliable verdict could be formed.",
          }
        )
      );
      setState("result");
    }
  };

  useEffect(() => {
    if (state !== "scanning") {
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, MESSAGES.length - 1));
    }, STEP_MS);

    return () => clearInterval(interval);
  }, [state]);

  return (
    <section className="py-24 md:py-32">
      <h2 className="mb-8 text-xs uppercase tracking-[0.2em] text-foreground/70">
        Scanner
      </h2>
      <div className="border border-border p-8 min-h-56 flex items-center justify-center">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              className="w-full"
            >
              <Button
                onClick={handleScanClick}
                className="h-20 w-full rounded-none bg-white text-black text-2xl tracking-[0.3em] uppercase hover:bg-white/90"
              >
                {active.size === 0 ? "Select Standards" : "Scan"}
              </Button>
            </motion.div>
          )}

          {state === "scanning" && (
            <motion.div
              key="scanning"
              className="w-full text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                  className="text-xl font-medium tracking-tight"
                >
                  {message}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {state === "result" && result && (
            <motion.div
              key="result"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
              className="w-full space-y-6"
            >
              <VerdictCard result={result} />
              <Button
                onClick={() => setState("idle")}
                variant="outline"
                className="h-12 w-full rounded-none border-border text-foreground hover:bg-transparent"
              >
                Scan Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
