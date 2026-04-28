"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CRITERIA } from "@/lib/criteria";
import { fadeUp, stagger } from "@/lib/motion";

type InterrogatorProps = {
  active: Set<string>;
};

type Lang = "en" | "fr";

export function Interrogator({ active }: InterrogatorProps) {
  const [lang, setLang] = useState<Lang>("en");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleCriteria = CRITERIA.filter((c) => active.has(c.id));

  if (visibleCriteria.length === 0) {
    return null;
  }

  const handleCopy = async (id: string, text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="py-24 md:py-32">
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-foreground/70">
          Interrogator
        </h2>
        <div
          role="tablist"
          aria-label="Script language"
          className="inline-flex border border-border"
        >
          {(["en", "fr"] as const).map((value) => {
            const isActive = lang === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setLang(value)}
                className={
                  "px-4 py-2 text-xs uppercase tracking-[0.24em] transition-colors " +
                  (isActive
                    ? "bg-white text-black"
                    : "bg-transparent text-foreground/70 hover:text-foreground")
                }
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      <motion.ul
        key={lang}
        variants={stagger}
        initial="hidden"
        animate="show"
        className="border-y border-border"
      >
        <AnimatePresence initial={false}>
          {visibleCriteria.map((criterion) => {
            const script = criterion.script[lang];
            const isCopied = copiedId === criterion.id;
            return (
              <motion.li
                key={criterion.id}
                layout
                variants={fadeUp}
                exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
                className="border-b border-border py-6 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/60">
                      {criterion.label}
                    </p>
                    <p className="text-lg font-medium leading-snug tracking-tight">
                      {script}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleCopy(criterion.id, script)}
                    variant="outline"
                    className="h-10 shrink-0 rounded-none border-border px-4 text-[0.7rem] uppercase tracking-[0.24em] hover:bg-white hover:text-black"
                  >
                    {isCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      <p className="mt-6 text-[0.7rem] uppercase tracking-[0.24em] text-foreground/60">
        One-tap scripts. Hand to waitstaff, verify aloud, eat without doubt.
      </p>
    </section>
  );
}
