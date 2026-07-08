"use client";

import Image from "next/image";
import { HM_IMAGE } from "@/content/heatmieter";

/**
 * Lade-Zustand der HeatMieter-Bühne: Off-Black, die Winter-Fassade als
 * gedimmter Hintergrund, Claim + ruhige Heat-Energielinie. Nie ein leerer
 * Bildschirm; blendet aus, sobald die Bühne steht. Port von ChargeLoader.
 */
export default function HeatLoader({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center bg-navy-900 transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      <Image
        src={HM_IMAGE.winter}
        alt=""
        fill
        priority
        sizes="100vw"
        unoptimized
        className="absolute inset-0 object-cover opacity-30"
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 35%, rgba(10,11,13,0.5) 0%, rgba(10,11,13,0.92) 100%)",
        }}
        aria-hidden
      />

      <p
        className="relative text-[11px] font-semibold uppercase tracking-[0.32em]"
        style={{ color: "var(--color-mod-heat)" }}
      >
        HeatMieter
      </p>
      <p className="relative mt-3 max-w-xs text-center text-sm text-ink-dim">
        Heizkosten im Mehrfamilienhaus — erfasst, transparent, nachvollziehbar.
      </p>
      <span className="relative mt-6 block h-px w-40 overflow-hidden bg-white/10">
        <span
          className="absolute left-0 top-0 h-full w-16"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-mod-heat), transparent)",
            animation: "energy-line 1.6s var(--ease-calm) infinite",
          }}
        />
      </span>
    </div>
  );
}
