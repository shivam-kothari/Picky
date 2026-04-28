"use client";

import { motion } from "framer-motion";

import { Switch } from "@/components/ui/switch";
import { CRITERIA } from "@/lib/criteria";
import { fadeUp, stagger } from "@/lib/motion";

type CriteriaListProps = {
  active: Set<string>;
  onToggle: (id: string) => void;
};

export function CriteriaList({ active, onToggle }: CriteriaListProps) {
  return (
    <section className="py-24 md:py-32">
      <h2 className="mb-8 text-xs uppercase tracking-[0.2em] text-foreground/70">
        Standards
      </h2>
      <motion.ul
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="border-y border-border"
      >
        {CRITERIA.map((criterion) => (
          <motion.li
            key={criterion.id}
            variants={fadeUp}
            className="flex items-center justify-between border-b border-border py-6 last:border-b-0"
          >
            <span className="text-xl font-medium tracking-tight">
              {criterion.label}
            </span>
            <Switch
              checked={active.has(criterion.id)}
              onCheckedChange={() => onToggle(criterion.id)}
              aria-label={`Toggle ${criterion.label}`}
            />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
