"use client";

import { motion } from "framer-motion";

export default function FeeSplitBar() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex justify-between font-mono text-xs text-deep/60">
        <span>creator · 80%</span>
        <span>memegrid · 20%</span>
      </div>
      <div className="flex h-10 w-full overflow-hidden rounded-sm border border-ink/15">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "80%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center justify-start bg-ink px-3"
        >
          <span className="font-mono text-xs text-paper/70">80</span>
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "20%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="flex flex-1 items-center justify-end bg-signal px-3"
        >
          <span className="font-mono text-xs text-paper/80">20</span>
        </motion.div>
      </div>
    </div>
  );
}
