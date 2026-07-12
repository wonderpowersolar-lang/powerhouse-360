# ADR-004 — Mandantenisolation: Row-Level-Isolation über verpflichtende Organisationszuordnung

Status: **angenommen** (Vorgabe Masterprompt V2, 2026-07-12)

## Entscheidung
- **Jede mandantenbezogene Tabelle trägt `organizationId`** (verpflichtend; Tabellen ohne Mandantenbezug sind explizit als global registriert). **Keine Schema-pro-Mandant-Architektur.**
- Erzwingung erfolgt **serverseitig als Middleware-/Guard-Erzwingung**: `requirePermission(ctx, permission, { organizationId })` + `assertOrgScope` (deny-by-default; Stufen: keine Session → AuthnError, keine Membership → AuthzError + `authz.denied`-Audit, fehlende Permission → AuthzError + Audit). Tenant-Reads laufen immer mit `where: { organizationId }`; Umsetzung gemäß WP-1.2-Design-Spec (`docs/superpowers/specs/2026-07-11-wp-1.2-auth-rollen-mandanten-design.md`).
- **Postgres Row Level Security** bleibt als dokumentierte Härtungsoption vorgesehen (zweite Verteidigungslinie), Einführung frühestens nach WP-1.3, wenn das Scope-Modell (Teilbäume) steht.
- **Cross-Mandanten-Zugriffe** (z. B. Hausverwaltung über mehrere WEGs) laufen ausschließlich über explizite, auditierbare `AccessScope`-Zuweisungen — niemals über Sonderfälle in der Fachlogik.

## Konsequenzen
+ Ein Mechanismus für alle Oberflächen; auditierbar; testbar (F-02/F-20-Negativmatrix).
− Guard-Disziplin nötig (jede Route deklariert Permission + Scope-Quelle); RLS-Nachrüstung als Härtung eingeplant, nicht vergessen (offener Punkt in Kap. 13).
