import Link from "next/link";
import { LOGO_ICON_DATA_URI } from "./logo-icon-data";

/**
 * Marken-Lockup für die helle App-Welt: Icon (Data-URI, wie auf der Website)
 * + Wortmarke in Marken-Navy, die »360« im Logo-Verlauf. Verlinkt aufs
 * Dashboard.
 */
export function AppLogo() {
  return (
    <Link href="/admin" className="app-logo">
      {/* eslint-disable-next-line @next/next/no-img-element -- Data-URI; next/image hätte hier keinen Nutzen */}
      <img src={LOGO_ICON_DATA_URI} alt="" width={26} height={26} aria-hidden />
      <span>
        POWERHOUSE <span className="brand-gradient-text">360</span>
      </span>
    </Link>
  );
}
