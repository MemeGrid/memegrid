"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const COLS = 6;
const ROWS = 6;
// posisi 4 kotak inti (persis komposisi logo: baris 1-2, kolom 1-2 & 3-4 dst dipusatkan)
const CORE = new Set(["1-1", "1-2", "2-1", "2-2"]);
const SYMBOLS = ["GRDN", "PXRT", "BLOK", "MRSH", "TIDE", "GLTC", "NOOR", "VLTG", "ZAP", "KRO"];

export default function HeroGrid() {
  const cells = useMemo(() => {
    const arr: { key: string; row: number; col: number; core: boolean; delay: number; symbol: string }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${r}-${c}`;
        arr.push({
          key,
          row: r,
          col: c,
          core: CORE.has(key),
          delay: Math.random() * 4,
          symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        });
      }
    }
    return arr;
  }, []);

  return (
    <div
      className="grid aspect-square w-full max-w-md gap-2"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      aria-hidden="true"
    >
      {cells.map((cell) => (
        <motion.div
          key={cell.key}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={
            cell.core
              ? { opacity: 1, scale: 1 }
              : { opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.7] }
          }
          transition={
            cell.core
              ? { duration: 0.6, delay: cell.row * 0.08 + cell.col * 0.08 }
              : {
                  duration: 3.2,
                  delay: 1 + cell.delay,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3,
                  ease: "easeInOut",
                }
          }
          className={`flex items-center justify-center rounded-sm text-[9px] font-mono font-medium ${
            cell.core ? "bg-ink" : "bg-ink/80 text-paper"
          }`}
        >
          {!cell.core && <span className="text-paper/80">{cell.symbol}</span>}
        </motion.div>
      ))}
    </div>
  );
}
