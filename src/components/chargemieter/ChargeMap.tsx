"use client";

import { useEffect } from "react";
import {
  cmSceneFloat,
  cmRawFloat,
  cmHoldWeight,
  cmGetReduced,
  cmFrameLoop,
} from "@/lib/chargeProgress";
import { CM_SCENE_STAGE, CM_SCENES } from "@/content/chargemieter";

/**
 * ChargeMap — der digitale Lageplan des Mehrfamilienhauses.
 *
 * Ein SVG-Blueprint (Gebäude, Stellplätze, Tiefgarage, Netzanschluss,
 * Zählerschrank, Lastmanagement, Wohnungen, Abrechnung), der die gesamte
 * Scroll-Story als räumliche Ebene begleitet. Eine virtuelle Kamera fährt
 * pro Szene auf einen Fokuspunkt; Ebenen aktivieren sich entlang des
 * Scene-Floats:
 *
 *   grau → Wallboxen erscheinen → Routen laden → Nutzer werden zugeordnet →
 *   Lasten balancieren → Abrechnungsfluss → Projektpfad → Komplettzustand.
 *
 * Imperativ animiert (ein rAF, nur opacity/transform/dashoffset) — kein
 * React-State pro Frame.
 */

/* Kamera-Keyframes pro Szene: Fokuspunkt (fx, fy) in viewBox-Einheiten + Zoom. */
const CAM: { fx: number; fy: number; s: number }[] = [
  { fx: 620, fy: 380, s: 1.06 }, // 0 hero
  { fx: 600, fy: 390, s: 1.0 }, // 1 komplexität
  { fx: 640, fy: 460, s: 1.26 }, // 2 lösung — garage + stellplätze
  { fx: 590, fy: 400, s: 1.1 }, // 3 eigentümer — phasen
  { fx: 700, fy: 330, s: 1.12 }, // 4 verwaltung (karte tritt zurück)
  { fx: 420, fy: 480, s: 1.7 }, // 5 mieter — stellplatz 14
  { fx: 400, fy: 520, s: 1.4 }, // 6 lastmanagement — garage + netz
  { fx: 620, fy: 330, s: 1.32 }, // 7 abrechnung — controller → abrechnung
  { fx: 600, fy: 410, s: 1.08 }, // 8 förderung
  { fx: 600, fy: 400, s: 1.05 }, // 9 ablauf
  { fx: 600, fy: 380, s: 1.03 }, // 10 plattform
  { fx: 600, fy: 380, s: 1.06 }, // 11 cta
];

const INK = "rgba(244,240,232,";
const CYAN = "#56c8e8";
const GOLD = "#e6b94e";

/** clamp + linear ramp helper */
function ramp(v: number, a: number, b: number): number {
  if (b <= a) return v >= b ? 1 : 0;
  return Math.min(1, Math.max(0, (v - a) / (b - a)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* Wallbox-Positionen: 8 Tiefgaragen-Plätze (2 Reihen) + 6 Außenstellplätze. */
const GARAGE_BAYS = Array.from({ length: 8 }, (_, k) => {
  const row = k < 4 ? 0 : 1;
  const col = k % 4;
  return {
    x: 220 + col * 100,
    y: row === 0 ? 470 : 580,
    /** Wallbox-Punkt sitzt an der Fahrgassen-Seite der Bucht */
    wx: 220 + col * 100 + 35,
    wy: row === 0 ? 462 : 572,
  };
});
const OUTDOOR_BAYS = Array.from({ length: 6 }, (_, k) => ({
  x: 790,
  y: 150 + k * 62,
  wx: 782,
  wy: 150 + k * 62 + 20,
}));
/** »Stellplatz 14« — die Mieter-Szene fokussiert die zweite Garagenbucht. */
const BAY14 = GARAGE_BAYS[1];

/* Infrastruktur-Knoten */
const GRID = { x: 150, y: 690 }; // Netzanschluss an der Straße
const METER = { x: 560, y: 360 }; // Zählerschrank im Gebäudesockel
const CTRL = { x: 640, y: 360 }; // Lastmanagement-Controller
const BILLING = { x: 900, y: 300 }; // Abrechnungsebene (digital)

/* Trunk-Routen (Pfad-Strings) */
const ROUTE_GRID_METER = `M ${GRID.x} ${GRID.y} L ${GRID.x} 620 L 190 620 L 190 400 L 520 400 L 520 372 L ${METER.x - 14} ${METER.y}`;
const ROUTE_METER_CTRL = `M ${METER.x + 14} ${METER.y} L ${CTRL.x - 14} ${CTRL.y}`;
const ROUTE_CTRL_GARAGE = `M ${CTRL.x} ${CTRL.y + 12} L ${CTRL.x} 440 L 610 440 L 610 455 L 220 455 L 220 565 L 540 565`;
const ROUTE_CTRL_OUTDOOR = `M ${CTRL.x + 12} ${CTRL.y} L 760 360 L 760 170 L ${OUTDOOR_BAYS[0].wx} ${OUTDOOR_BAYS[0].wy}`;
const ROUTE_CTRL_BILLING = `M ${CTRL.x + 10} ${CTRL.y - 10} L 720 300 L ${BILLING.x - 46} ${BILLING.y}`;

/* Projektpfad (Szene 9): eine ruhige Route durch den Plan. */
const JOURNEY_PATH = `M 150 690 L 190 620 L 190 400 L 520 400 L 560 372 L 640 372 L 640 440 L 400 455 L 220 455 L 220 565 L 540 565 L 640 520 L 760 440 L 760 170 L 900 170 L ${BILLING.x} ${BILLING.y - 30}`;

/** Wohnungs-Raster im Gebäude (4×3 Einheiten). */
const UNITS = Array.from({ length: 12 }, (_, k) => ({
  x: 200 + (k % 4) * 95,
  y: 165 + Math.floor(k / 4) * 62,
}));

export default function ChargeMap() {
  /*
   * Der Treiber arbeitet bewusst OHNE React-Refs: alle animierten Knoten
   * werden einmalig per data-mk aus dem DOM gegriffen (StrictMode-/Fast-
   * Refresh-sicher — Ref-Lebenszyklen können hier nichts mehr verlieren).
   */
  useEffect(() => {
    const svg = document.getElementById("cm-map") as SVGSVGElement | null;
    if (!svg) return;
    const q = <T extends SVGElement>(key: string) =>
      svg.querySelector(`[data-mk="${key}"]`) as T | null;

    const cam = q<SVGGElement>("cam");
    const KEYS = [
      "base",
      "ticks",
      "routes",
      "flow",
      "nodes",
      "phase1",
      "phase2",
      "phase3",
      "users",
      "assign",
      "bay14",
      "load",
      "billing",
      "bill-flow",
      "funding",
      "sweep",
      "journey",
      "complete",
    ] as const;
    const R: Record<string, SVGElement | null> = {};
    KEYS.forEach((k) => {
      R[k] = q(k);
    });
    const boxes = Array.from({ length: 14 }, (_, k) =>
      q<SVGGElement>(`box-${k}`)
    );
    const bars = Array.from({ length: 8 }, (_, k) =>
      q<SVGRectElement>(`bar-${k}`)
    );
    const journeyPath = q<SVGPathElement>("journey-path");
    const car = q<SVGGElement>("car");

    /* Draw-on-Pfade einmalig vermessen (dasharray = Gesamtlänge). */
    const measure = (el: SVGPathElement | null): number => {
      if (!el) return 0;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      return len;
    };
    const drawPaths = ["r-grid", "r-meter", "r-garage", "r-outdoor"].map((k) =>
      q<SVGPathElement>(k)
    );
    const drawLens = drawPaths.map(measure);
    const billPath = q<SVGPathElement>("r-billing");
    const billLen = measure(billPath);
    const assignPath = R["assign"] as SVGPathElement | null;
    const assignLen = measure(assignPath);
    const journeyLen = measure(journeyPath);

    /* Copy-Sichtbarkeitsfenster einer Szene (breiter als holdWeight). */
    const cmCopyVis = (sv: number, idx: number): number =>
      ramp(sv, idx - 0.35, idx - 0.08) * (1 - ramp(sv, idx + 0.62, idx + 0.95));

    const setOp = (key: string, v: number) => {
      const el = R[key];
      if (el) {
        el.style.opacity = v.toFixed(3);
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
      }
    };

    const tick = (now: number) => {
      const s = cmSceneFloat();
      const raw = cmRawFloat();
      const rm = cmGetReduced();

      /* ── Karten-Alpha: pro Szene definiert, weich interpoliert ── */
      const i0 = Math.min(CM_SCENES.length - 1, Math.floor(s));
      const i1 = Math.min(CM_SCENES.length - 1, i0 + 1);
      const f = s - i0;
      const a0 = CM_SCENE_STAGE[CM_SCENES[i0].id]?.map ?? 0.2;
      const a1 = CM_SCENE_STAGE[CM_SCENES[i1].id]?.map ?? 0.2;
      const alpha = lerp(a0, a1, f);
      svg.style.opacity = (0.92 * alpha).toFixed(3);
      svg.style.visibility = alpha < 0.02 ? "hidden" : "visible";

      /* ── virtuelle Kamera ── */
      if (cam) {
        const c0 = CAM[i0];
        const c1 = CAM[i1];
        const cs = lerp(c0.s, c1.s, f);
        const fx = lerp(c0.fx, c1.fx, f);
        const fy = lerp(c0.fy, c1.fy, f);
        const drift = rm ? 0 : Math.sin(now / 5200) * 3;
        const tx = 600 - cs * fx + drift;
        const ty = 380 - cs * fy - drift * 0.6;
        cam.setAttribute(
          "transform",
          `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${cs.toFixed(4)})`
        );
      }

      // Basisplan: ab Hero sichtbar, zieht während der Problem-Szene voll auf.
      setOp("base", 0.5 + 0.5 * ramp(s, 0.4, 1.0));
      // Vermessungs-Ticks etwas später.
      setOp("ticks", ramp(s, 0.55, 1.1) * 0.8);

      // Wallboxen erscheinen einzeln in der Lösungs-Szene. WICHTIG: am RAW-
      // Float — so läuft die Staffelung während des Holds weiter.
      boxes.forEach((g, k) => {
        if (!g) return;
        const t = ramp(raw, 1.75 + k * 0.055, 2.0 + k * 0.055);
        const done = ramp(raw, 10.4, 11);
        const v = Math.max(t, done);
        g.style.opacity = v.toFixed(3);
        g.setAttribute("data-active", v > 0.6 ? "1" : "0");
      });

      // Routen laden nach den Boxen (draw-on über dashoffset) — raw-getaktet.
      const routeT = ramp(raw, 2.05, 2.85);
      setOp("routes", Math.max(routeT, ramp(raw, 10.3, 10.9)));
      drawPaths.forEach((el, k) => {
        if (!el) return;
        const t = ramp(routeT, k * 0.18, k * 0.18 + 0.45);
        el.style.strokeDashoffset = String(drawLens[k] * (1 - t));
      });
      // Energiefluss-Punkte nur, wenn Routen stehen + nicht reduced.
      setOp("flow", rm ? 0 : routeT >= 1 ? 0.9 : 0);

      // Infrastruktur-Knoten (Netz, Zähler, Controller) mit den Routen.
      setOp("nodes", Math.max(ramp(raw, 1.95, 2.45), ramp(raw, 10.3, 10.9)));

      // Phasen-Zonen — nur Eigentümer-Szene.
      const w3 = cmHoldWeight(3);
      const phaseOut = 1 - ramp(s, 3.7, 4.2);
      setOp("phase1", ramp(w3, 0.1, 0.3) * ramp(s, 2.8, 3) * phaseOut);
      setOp("phase2", ramp(w3, 0.42, 0.62) * phaseOut);
      setOp("phase3", ramp(w3, 0.72, 0.92) * phaseOut);

      // Nutzer-Punkte in den Wohnungen + Zuordnung (Mieter-Szene).
      const w5 = cmHoldWeight(5);
      const usersOn = Math.max(
        ramp(raw, 4.6, 5.2) * 0.9,
        ramp(raw, 10.4, 11) * 0.7
      );
      setOp("users", usersOn);
      if (assignPath) {
        const t = Math.max(w5, ramp(raw, 10.5, 11) * 0.8);
        assignPath.style.strokeDashoffset = String(
          assignLen * (1 - Math.min(1, t * 1.15))
        );
        setOp("assign", Math.max(w5, ramp(raw, 10.5, 11) * 0.5));
      }
      setOp("bay14", w5 * (1 - ramp(s, 6.5, 7)));

      // Lastbalken — nur Lastmanagement-Szene; Höhe: chaotisch → balanciert.
      const w6 = cmHoldWeight(6);
      setOp("load", cmCopyVis(s, 6));
      bars.forEach((b, k) => {
        if (!b) return;
        const chaos = [30, 8, 44, 14, 38, 6, 26, 18][k];
        const calm = 22;
        const h = lerp(chaos, calm, w6);
        b.setAttribute("height", h.toFixed(1));
        b.setAttribute("y", String(438 - h));
        b.setAttribute(
          "fill",
          w6 > 0.75 ? "rgba(67,182,73,0.75)" : "rgba(86,200,232,0.7)"
        );
      });

      // Abrechnungsfluss — Route Controller → Abrechnung + Knoten.
      const w7 = cmHoldWeight(7);
      const billOn = Math.max(w7, ramp(raw, 10.4, 11) * 0.6);
      setOp("billing", Math.max(ramp(s, 6.6, 7.1) * 0.9, billOn));
      if (billPath) {
        billPath.style.strokeDashoffset = String(
          billLen * (1 - Math.min(1, billOn * 1.2))
        );
      }
      setOp("bill-flow", rm ? 0 : w7 > 0.5 ? 0.95 : 0);

      // Förderung — Prüfzonen + Scan-Sweep nur Szene 8.
      const w8 = cmHoldWeight(8);
      setOp("funding", cmCopyVis(s, 8) * 0.95);
      setOp("sweep", rm ? 0 : w8 > 0.25 ? 0.8 : 0);

      // Projektpfad — Szene 9: Pfad zeichnet sich, Auto-Punkt fährt mit.
      const vis9 = cmCopyVis(s, 9);
      setOp("journey", vis9);
      if (journeyPath && journeyLen) {
        const local = Math.min(1, Math.max(0, raw - 9 + 0.12));
        const t = Math.min(1, local * 1.25);
        journeyPath.style.strokeDashoffset = String(journeyLen * (1 - t));
        if (car) {
          const pt = journeyPath.getPointAtLength(journeyLen * t);
          car.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
          car.style.opacity = vis9 > 0.05 && t > 0.005 ? "1" : "0";
        }
      }

      // Komplettzustand (CTA): ruhiger »ready«-Ring um das Grundstück.
      setOp("complete", ramp(raw, 10.6, 11) * 0.9);
    };

    return cmFrameLoop(tick);
  }, []);

  return (
    <svg
      id="cm-map"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ opacity: 0 }}
    >
      <defs>
        <pattern id="cm-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={`${INK}0.05)`} />
        </pattern>
        <linearGradient id="cm-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="transparent" />
          <stop offset="0.5" stopColor="rgba(86,200,232,0.14)" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
        <radialGradient id="cm-nodeGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(86,200,232,0.5)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>

      <g data-mk="cam">
        {/* ═══════════ Basisplan ═══════════ */}
        <g data-mk="base" style={{ opacity: 0 }}>
          <rect x="60" y="40" width="1080" height="680" fill="url(#cm-grid)" />
          {/* Grundstücksgrenze */}
          <rect
            x="90"
            y="70"
            width="1020"
            height="620"
            fill="none"
            stroke={`${INK}0.14)`}
            strokeWidth="1.2"
            strokeDasharray="10 7"
          />
          {/* Straße */}
          <line x1="90" y1="690" x2="1110" y2="690" stroke={`${INK}0.2)`} strokeWidth="2" />
          <line
            x1="90"
            y1="712"
            x2="1110"
            y2="712"
            stroke={`${INK}0.1)`}
            strokeWidth="1"
            strokeDasharray="22 16"
          />
          <text x="96" y="736" className="cm-label">
            Straße · Netzanschlussebene
          </text>

          {/* Gebäude-Umriss */}
          <rect
            x="170"
            y="130"
            width="420"
            height="250"
            fill="rgba(244,240,232,0.025)"
            stroke={`${INK}0.4)`}
            strokeWidth="2"
          />
          <text x="176" y="118" className="cm-label">
            Mehrfamilienhaus · 12 WE
          </text>
          {/* Wohnungs-Raster */}
          {UNITS.map((u, k) => (
            <rect
              key={k}
              x={u.x}
              y={u.y}
              width="72"
              height="44"
              fill="none"
              stroke={`${INK}0.16)`}
              strokeWidth="1"
            />
          ))}
          {/* Technikraum */}
          <rect
            x="520"
            y="330"
            width="150"
            height="50"
            fill="rgba(86,200,232,0.04)"
            stroke={`${INK}0.3)`}
            strokeWidth="1.4"
          />
          <text x="524" y="322" className="cm-label">
            Technikraum
          </text>

          {/* Tiefgarage */}
          <rect
            x="180"
            y="430"
            width="440"
            height="210"
            fill="rgba(244,240,232,0.015)"
            stroke={`${INK}0.28)`}
            strokeWidth="1.4"
            strokeDasharray="7 6"
          />
          <text x="186" y="656" className="cm-label">
            Tiefgarage · 8 Stellplätze
          </text>
          {/* Rampe */}
          <path
            d="M 620 640 L 680 640 L 700 690"
            fill="none"
            stroke={`${INK}0.22)`}
            strokeWidth="1.4"
          />
          {/* Garagen-Buchten */}
          {GARAGE_BAYS.map((b, k) => (
            <g key={k}>
              <rect
                x={b.x}
                y={b.y}
                width="70"
                height="46"
                fill="none"
                stroke={`${INK}0.2)`}
                strokeWidth="1"
              />
              <text x={b.x + 6} y={b.y + 30} className="cm-bay">
                {String(k + 13).padStart(2, "0")}
              </text>
            </g>
          ))}

          {/* Außenstellplätze */}
          <text x="790" y="138" className="cm-label">
            Außenstellplätze
          </text>
          {OUTDOOR_BAYS.map((b, k) => (
            <g key={k}>
              <rect
                x={b.x}
                y={b.y}
                width="96"
                height="42"
                fill="none"
                stroke={`${INK}0.2)`}
                strokeWidth="1"
              />
              <text x={b.x + 8} y={b.y + 27} className="cm-bay">
                {String(k + 1).padStart(2, "0")}
              </text>
            </g>
          ))}
        </g>

        {/* Vermessungs-Ticks */}
        <g data-mk="ticks" style={{ opacity: 0 }}>
          {Array.from({ length: 17 }, (_, k) => (
            <line
              key={k}
              x1={90 + k * 60}
              y1="64"
              x2={90 + k * 60}
              y2="70"
              stroke={`${INK}0.3)`}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }, (_, k) => (
            <line
              key={`v${k}`}
              x1="84"
              y1={70 + k * 62}
              x2="90"
              y2={70 + k * 62}
              stroke={`${INK}0.3)`}
              strokeWidth="1"
            />
          ))}
        </g>

        {/* ═══════════ Routen (Netz → Zähler → Controller → Ladepunkte) ═══ */}
        <g data-mk="routes" style={{ opacity: 0 }}>
          {[
            { key: "r-grid", d: ROUTE_GRID_METER },
            { key: "r-meter", d: ROUTE_METER_CTRL },
            { key: "r-garage", d: ROUTE_CTRL_GARAGE },
            { key: "r-outdoor", d: ROUTE_CTRL_OUTDOOR },
          ].map((r) => (
            <g key={r.key}>
              <path d={r.d} fill="none" stroke="rgba(86,200,232,0.1)" strokeWidth="6" />
              <path
                data-mk={r.key}
                d={r.d}
                fill="none"
                stroke="rgba(86,200,232,0.65)"
                strokeWidth="1.6"
              />
            </g>
          ))}
        </g>

        {/* Energiefluss auf den Trunks */}
        <g data-mk="flow" style={{ opacity: 0 }}>
          {[ROUTE_GRID_METER, ROUTE_CTRL_GARAGE, ROUTE_CTRL_OUTDOOR].map((d, k) => (
            <circle key={k} r="2.6" fill={CYAN}>
              <animateMotion dur={`${5 + k * 1.4}s`} repeatCount="indefinite" path={d} />
            </circle>
          ))}
        </g>

        {/* ═══════════ Infrastruktur-Knoten ═══════════ */}
        <g data-mk="nodes" style={{ opacity: 0 }}>
          {/* Netzanschluss */}
          <circle cx={GRID.x} cy={GRID.y} r="16" fill="url(#cm-nodeGlow)" />
          <circle cx={GRID.x} cy={GRID.y} r="7" fill="#0a0b0d" stroke={CYAN} strokeWidth="1.6" />
          <text x={GRID.x + 16} y={GRID.y - 10} className="cm-label cm-cyan">
            Netzanschluss
          </text>
          {/* Zählerschrank */}
          <rect x={METER.x - 14} y={METER.y - 12} width="28" height="24" fill="#0a0b0d" stroke={GOLD} strokeWidth="1.4" />
          <line x1={METER.x - 7} y1={METER.y - 4} x2={METER.x + 7} y2={METER.y - 4} stroke={GOLD} strokeWidth="1.2" />
          <line x1={METER.x - 7} y1={METER.y + 2} x2={METER.x + 7} y2={METER.y + 2} stroke={GOLD} strokeWidth="1.2" />
          <text x={METER.x - 14} y={METER.y + 34} className="cm-label cm-gold">
            Zählerschrank
          </text>
          {/* Lastmanagement-Controller */}
          <rect x={CTRL.x - 12} y={CTRL.y - 12} width="24" height="24" rx="4" fill="#0a0b0d" stroke={CYAN} strokeWidth="1.6" />
          <circle cx={CTRL.x} cy={CTRL.y} r="3.5" fill={CYAN} />
          <text x={CTRL.x - 12} y={CTRL.y - 20} className="cm-label cm-cyan">
            Lastmanagement
          </text>
        </g>

        {/* ═══════════ Wallbox-Punkte ═══════════ */}
        <g>
          {[...GARAGE_BAYS, ...OUTDOOR_BAYS].map((b, k) => (
            <g
              key={k}
              data-mk={`box-${k}`}
              style={{ opacity: 0 }}
              className="cm-box"
            >
              <circle cx={b.wx} cy={b.wy} r="10" fill="url(#cm-nodeGlow)" />
              <circle
                cx={b.wx}
                cy={b.wy}
                r="4.5"
                fill="#0a0b0d"
                stroke={CYAN}
                strokeWidth="1.6"
                className="cm-box-ring"
              />
              <circle cx={b.wx} cy={b.wy} r="1.6" fill={CYAN} className="cm-box-dot" />
            </g>
          ))}
        </g>

        {/* ═══════════ Phasen-Zonen (Eigentümer) ═══════════ */}
        <g data-mk="phase1" style={{ opacity: 0 }}>
          <rect x="206" y="452" width="390" height="82" rx="6" fill="rgba(86,200,232,0.05)" stroke="rgba(86,200,232,0.5)" strokeWidth="1.3" strokeDasharray="6 5" />
          <text x="214" y="446" className="cm-label cm-cyan">
            Phase 1 · Tiefgarage Reihe A
          </text>
        </g>
        <g data-mk="phase2" style={{ opacity: 0 }}>
          <rect x="206" y="562" width="390" height="82" rx="6" fill="rgba(86,200,232,0.04)" stroke="rgba(86,200,232,0.38)" strokeWidth="1.3" strokeDasharray="6 5" />
          <text x="214" y="556" className="cm-label cm-cyan">
            Phase 2 · Reihe B
          </text>
        </g>
        <g data-mk="phase3" style={{ opacity: 0 }}>
          <rect x="772" y="136" width="130" height="384" rx="6" fill="rgba(230,185,78,0.04)" stroke="rgba(230,185,78,0.4)" strokeWidth="1.3" strokeDasharray="6 5" />
          <text x="772" y="540" className="cm-label cm-gold">
            Phase 3 · Außenanlage
          </text>
        </g>

        {/* ═══════════ Nutzer + Zuordnung ═══════════ */}
        <g data-mk="users" style={{ opacity: 0 }}>
          {UNITS.map((u, k) => (
            <circle
              key={k}
              cx={u.x + 60}
              cy={u.y + 10}
              r="3"
              fill="none"
              stroke={`${INK}0.55)`}
              strokeWidth="1.2"
            />
          ))}
          <text x="200" y="404" className="cm-label">
            Nutzer · Wohnungen
          </text>
        </g>
        <g data-mk="assign-wrap">
          <path
            data-mk="assign"
            d={`M ${UNITS[9].x + 60} ${UNITS[9].y + 12} C 380 340, 300 380, ${BAY14.wx} ${BAY14.wy - 6}`}
            fill="none"
            stroke="rgba(86,200,232,0.8)"
            strokeWidth="1.4"
            strokeDasharray="4 3"
            style={{ opacity: 0 }}
          />
        </g>
        <g data-mk="bay14" style={{ opacity: 0 }}>
          <rect
            x={BAY14.x - 4}
            y={BAY14.y - 4}
            width="78"
            height="54"
            rx="5"
            fill="rgba(86,200,232,0.07)"
            stroke={CYAN}
            strokeWidth="1.6"
          />
          <text x={BAY14.x - 2} y={BAY14.y + 66} className="cm-label cm-cyan">
            Stellplatz 14 · Wohnung 3.2
          </text>
        </g>

        {/* ═══════════ Lastbalken (Lastmanagement) ═══════════ */}
        <g data-mk="load" style={{ opacity: 0 }}>
          <line x1="238" y1="394" x2="618" y2="394" stroke="rgba(230,185,78,0.55)" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x="238" y="386" className="cm-label cm-gold">
            Verfügbare Leistung
          </text>
          {GARAGE_BAYS.map((_, k) => (
            <rect
              key={k}
              data-mk={`bar-${k}`}
              x={244 + k * 48}
              y="414"
              width="9"
              height="24"
              rx="1.5"
              fill="rgba(86,200,232,0.7)"
            />
          ))}
        </g>

        {/* ═══════════ Abrechnungs-Ebene ═══════════ */}
        <g data-mk="billing" style={{ opacity: 0 }}>
          <path
            data-mk="r-billing"
            d={ROUTE_CTRL_BILLING}
            fill="none"
            stroke="rgba(230,185,78,0.6)"
            strokeWidth="1.5"
          />
          <rect x={BILLING.x - 46} y={BILLING.y - 30} width="120" height="66" rx="8" fill="rgba(10,11,13,0.85)" stroke="rgba(230,185,78,0.55)" strokeWidth="1.3" />
          <line x1={BILLING.x - 32} y1={BILLING.y - 12} x2={BILLING.x + 58} y2={BILLING.y - 12} stroke={`${INK}0.35)`} strokeWidth="1.1" />
          <line x1={BILLING.x - 32} y1={BILLING.y} x2={BILLING.x + 40} y2={BILLING.y} stroke={`${INK}0.25)`} strokeWidth="1.1" />
          <line x1={BILLING.x - 32} y1={BILLING.y + 12} x2={BILLING.x + 50} y2={BILLING.y + 12} stroke={`${INK}0.25)`} strokeWidth="1.1" />
          <text x={BILLING.x - 46} y={BILLING.y - 42} className="cm-label cm-gold">
            Abrechnung
          </text>
        </g>
        <g data-mk="bill-flow" style={{ opacity: 0 }}>
          {[0, 1].map((k) => (
            <rect key={k} x="-3" y="-2" width="6" height="4" rx="1" fill={GOLD}>
              <animateMotion
                dur={`${3.6 + k * 1.1}s`}
                repeatCount="indefinite"
                path={ROUTE_CTRL_BILLING}
              />
            </rect>
          ))}
        </g>

        {/* ═══════════ Förder-Prüfzonen ═══════════ */}
        <g data-mk="funding" style={{ opacity: 0 }}>
          <rect x="196" y="444" width="410" height="200" rx="8" fill="none" stroke="rgba(67,182,73,0.5)" strokeWidth="1.4" strokeDasharray="9 6" />
          <text x="204" y="438" className="cm-label cm-green">
            Prüfzone · Tiefgarage
          </text>
          <rect x="772" y="136" width="130" height="384" rx="8" fill="none" stroke="rgba(67,182,73,0.4)" strokeWidth="1.4" strokeDasharray="9 6" />
          <text x="772" y="128" className="cm-label cm-green">
            Prüfzone · Außen
          </text>
        </g>
        <g data-mk="sweep" style={{ opacity: 0 }}>
          <rect x="90" y="70" width="240" height="620" fill="url(#cm-sweep)" className="cm-sweep-anim" />
        </g>

        {/* ═══════════ Projektpfad + Auto (Ablauf) ═══════════ */}
        <g data-mk="journey" style={{ opacity: 0 }}>
          <path
            d={JOURNEY_PATH}
            fill="none"
            stroke="rgba(86,200,232,0.12)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            data-mk="journey-path"
            d={JOURNEY_PATH}
            fill="none"
            stroke="rgba(86,200,232,0.75)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <g data-mk="car" style={{ opacity: 0 }}>
            <circle r="11" fill="url(#cm-nodeGlow)" />
            <rect x="-7" y="-4" width="14" height="8" rx="2.5" fill="#0a0b0d" stroke={CYAN} strokeWidth="1.5" />
            <circle cx="-3.4" cy="4.4" r="1.7" fill={CYAN} />
            <circle cx="3.4" cy="4.4" r="1.7" fill={CYAN} />
          </g>
        </g>

        {/* ═══════════ Komplettzustand (CTA) ═══════════ */}
        <g data-mk="complete" style={{ opacity: 0 }}>
          <rect
            x="84"
            y="64"
            width="1032"
            height="632"
            rx="10"
            fill="none"
            stroke="rgba(67,182,73,0.35)"
            strokeWidth="1.6"
          />
          <text x="96" y="94" className="cm-label cm-green">
            Objekt ladefähig · Betrieb aktiv
          </text>
        </g>
      </g>

      <style jsx>{`
        .cm-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          fill: rgba(244, 240, 232, 0.42);
        }
        .cm-cyan {
          fill: rgba(86, 200, 232, 0.75);
        }
        .cm-gold {
          fill: rgba(230, 185, 78, 0.72);
        }
        .cm-green {
          fill: rgba(67, 182, 73, 0.75);
        }
        .cm-bay {
          font-size: 10px;
          letter-spacing: 0.1em;
          fill: rgba(244, 240, 232, 0.24);
        }
        .cm-box-ring {
          transition: stroke 0.5s var(--ease-calm);
        }
        :global(.cm-box[data-active="1"]) .cm-box-dot {
          animation: cm-pulse 2.6s var(--ease-calm) infinite;
        }
        @keyframes cm-pulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
        .cm-sweep-anim {
          animation: cm-sweep 4.5s linear infinite;
        }
        @keyframes cm-sweep {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(780px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.cm-box) .cm-box-dot,
          .cm-sweep-anim {
            animation: none !important;
          }
        }
      `}</style>
    </svg>
  );
}
