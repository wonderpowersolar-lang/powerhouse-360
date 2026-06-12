"use client";

import Image from "next/image";
import { LogoMark } from "./ui/Logo";

/**
 * Branded loading state for the 3D scene. Dark navy, logo mark, a subtle
 * stacked-building silhouette and a calm progress shimmer. Never a blank
 * screen. Fades out once the canvas is ready (controlled by parent).
 */
export default function SceneLoader({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none fixed inset-0 z-40 flex flex-col items-center justify-center bg-navy-900 transition-opacity duration-700 ${
        hidden ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(120% 80% at 50% 20%, #16243f 0%, #0d1626 60%, #090f1a 100%)",
      }}
    >
      {/* photoreal dusk render as dimmed backdrop (Higgsfield, REF-1 look) */}
      <Image
        src="/brand/hero-tower-wide.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover opacity-40"
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 30%, rgba(13,22,38,0.35) 0%, rgba(9,15,26,0.85) 100%)",
        }}
        aria-hidden
      />

      {/* stacked-building silhouette */}
      <svg
        width="120"
        height="150"
        viewBox="0 0 120 150"
        fill="none"
        className="mb-8 opacity-60"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={30 - i * 4}
            y={120 - i * 28}
            width={60 + i * 8}
            height={22}
            rx={2}
            fill={i % 2 ? "#2bb6b0" : "#3db36a"}
            opacity={0.18 + i * 0.06}
          >
            <animate
              attributeName="opacity"
              values={`${0.12 + i * 0.05};${0.4 + i * 0.06};${0.12 + i * 0.05}`}
              dur="2.4s"
              begin={`${i * 0.25}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </svg>

      <LogoMark size={44} className="mb-5 animate-pulse opacity-90" />

      <p className="text-sm font-medium tracking-wide text-ink-dim">
        Gebäude wird geladen…
      </p>

      <div className="mt-5 h-px w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[loader_1.4s_ease-in-out_infinite] bg-gradient-to-r from-brand-green to-brand-teal" />
      </div>

      <style>{`
        @keyframes loader {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  );
}
