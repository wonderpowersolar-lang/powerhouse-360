"use client";

import { useActionState } from "react";
import { acceptAction, type AcceptState } from "./actions";

export function AcceptForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState<AcceptState | null, FormData>(
    acceptAction.bind(null, token),
    null,
  );

  return (
    <form action={formAction} className="card">
      <label>
        E-Mail
        <input type="email" value={email} readOnly autoComplete="username" />
      </label>
      <label>
        Name
        <input
          type="text"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          placeholder="Vor- und Nachname"
        />
      </label>
      <label>
        Passwort
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="mindestens 8 Zeichen"
        />
      </label>
      {state?.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Zugang wird eingerichtet…" : "Zugang einrichten"}
      </button>
    </form>
  );
}
