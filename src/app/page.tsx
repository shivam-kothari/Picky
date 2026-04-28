"use client";

import { motion, useScroll } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { CriteriaList } from "@/components/picky/criteria-list";
import { Interrogator } from "@/components/picky/interrogator";
import { PickyHeader } from "@/components/picky/picky-header";
import { ScanPanel } from "@/components/picky/scan-panel";

export default function Home() {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("picky:active-criteria");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setActive(new Set(parsed));
          }
        }
      } catch (e) {
        console.error("Failed to parse stored criteria", e);
      }
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        "picky:active-criteria",
        JSON.stringify(Array.from(active))
      );
    }
  }, [active, isLoaded]);

  const handleToggle = useCallback((id: string) => {
    setActive((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <motion.div
        className="fixed left-0 top-0 z-50 h-px origin-left bg-white"
        style={{ scaleX: scrollYProgress, width: "100%" }}
        aria-hidden
      />
      <div className="mx-auto w-full max-w-3xl px-6 md:px-10">
        <PickyHeader />
        <CriteriaList active={active} onToggle={handleToggle} />
        <ScanPanel active={active} />
        <Interrogator active={active} />
        <footer className="py-16 text-center">
          <p className="text-[0.7rem] uppercase tracking-[0.32em] text-foreground/60">
            Picky &mdash; Precision over palate
          </p>
        </footer>
      </div>
    </main>
  );
}
