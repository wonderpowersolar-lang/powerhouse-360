import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LOGO_ICON_DATA_URI } from "../../components/logo-icon-data";

export const metadata = { title: "Anmelden — Powerhouse 360" };

export default function LoginPage() {
  return (
    <main className="wrap" style={{ maxWidth: 460, paddingTop: "4.5rem" }}>
      <p className="app-logo" style={{ marginBottom: "1.5rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Data-URI; next/image hätte hier keinen Nutzen */}
        <img src={LOGO_ICON_DATA_URI} alt="" width={30} height={30} aria-hidden />
        <span>
          POWERHOUSE <span className="brand-gradient-text">360</span>
        </span>
      </p>
      <h1>Anmelden</h1>
      <p className="muted">Interne Plattform — Zugang für das Powerhouse-Team.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
