"use client";

import Image from "next/image";
import { HERO_IMAGE } from "@/config/stage";

/**
 * Branded loading state for the cinematic stage. Off-black, the noir hero
 * render as a dimmed backdrop, brand claim and a calm gold energy line.
 * Never a blank screen. Fades out once the stage is ready.
 */
export default function SceneLoader({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center bg-navy-900 transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* noir hero render as dimmed backdrop */}
      <Image
        src={HERO_IMAGE}
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

      <p className="relative text-[11px] font-semibold uppercase tracking-[0.32em] text-gold">
        Powerhouse 360
      </p>
      <p className="relative mt-3 max-w-md px-6 text-center text-xl font-bold leading-snug text-ink sm:text-2xl">
        Das Betriebssystem deiner Immobilie.
      </p>

      {/* energy line — a travelling gold pulse along a hairline */}
      <div className="relative mt-7 h-px w-56 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[energy-line_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-gold to-gold-soft/60" />
      </div>
    </div>
  );
}
