import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden — Powerhouse 360" };

export default function LoginPage() {
  return (
    <main className="wrap">
      <h1>Anmelden</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
