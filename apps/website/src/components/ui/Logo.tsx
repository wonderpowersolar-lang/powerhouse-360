/**
 * Brand lockup for the launch site's off-black ground: the official stacked
 * mark + a typeset wordmark (warm white / gold). The original full-color
 * lockup asset carries dark navy type that disappears on the noir ground,
 * so the wordmark is set live in the brand font instead.
 *
 * Das Icon ist als Data-URI eingebettet (statt next/image + `/brand/…`-Pfad),
 * damit die Logo-Komponenten auch außerhalb der Next-Runtime standalone
 * rendern (z. B. im claude.ai/design-Bundle). Quelle unverändert:
 * public/brand/logo-icon.svg → src/components/ui/logo-icon-data.ts.
 */
import { LOGO_ICON_DATA_URI } from "./logo-icon-data";

export function LogoLockup({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Data-URI; next/image hätte hier keinen Nutzen */}
      <img
        src={LOGO_ICON_DATA_URI}
        alt=""
        width={64}
        height={64}
        fetchPriority={priority ? "high" : undefined}
        className="h-full w-auto drop-shadow-[0_2px_10px_rgba(43,182,176,0.25)]"
        aria-hidden
      />
      <span className="whitespace-nowrap text-lg font-bold leading-none tracking-tight text-ink sm:text-xl">
        POWERHOUSE
        <span className="brand-gradient-text"> 360</span>
      </span>
    </span>
  );
}

export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Data-URI; next/image hätte hier keinen Nutzen
    <img
      src={LOGO_ICON_DATA_URI}
      alt="POWERHOUSE 360"
      width={size}
      height={size}
      className={className}
    />
  );
}
