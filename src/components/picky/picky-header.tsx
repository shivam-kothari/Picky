"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function PickyHeader() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0.35]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.92]);

  return (
    <section className="py-24 md:py-32">
      <motion.h1
        style={{ opacity, scale }}
        className="text-[18vw] leading-none tracking-tighter font-bold uppercase md:text-[11rem]"
      >
        Picky
      </motion.h1>
      <p className="mt-8 max-w-xl text-sm uppercase tracking-[0.24em] text-foreground/80">
        Precision-driven dining for the uncompromising.
      </p>
    </section>
  );
}
