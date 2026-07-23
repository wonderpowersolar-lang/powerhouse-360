import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@ph360/auth";
import { getReadablePropertyTree } from "../../../lib/objects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = { title: "Objekte — Powerhouse 360" };

export default async function ObjectsPage() {
  const ctx = await getAuthContext(await headers());
  if (!ctx) redirect(`/login?next=${encodeURIComponent("/admin/objects")}`);

  const properties = await getReadablePropertyTree(ctx);

  return (
    <main className="wrap">
      <h1>Objekte</h1>
      <p className="muted">
        Immobilien-Objektbaum (Property → Gebäude → Einheit) · Lesesicht
      </p>

      {properties.length === 0 ? (
        <div className="empty">
          Keine Objekte sichtbar. Entweder existieren noch keine Immobilien in
          deinen Organisationen oder deine Rolle hat die Berechtigung
          „object.read" nicht.
        </div>
      ) : (
        properties.map((property) => (
          <section key={property.id}>
            <h2>
              {property.name}{" "}
              <span className="muted">({property.organization.name})</span>
            </h2>
            {property.buildings.map((building) => (
              <div key={building.id}>
                <h3>
                  {building.name}
                  <span className="muted">
                    {" "}
                    — {building.address.street} {building.address.houseNumber},{" "}
                    {building.address.postalCode} {building.address.city} ·{" "}
                    {building.units.length}{" "}
                    {building.units.length === 1 ? "Einheit" : "Einheiten"}
                  </span>
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Einheit</th>
                      <th>Etage</th>
                      <th>Eingang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {building.units.map((unit) => (
                      <tr key={unit.id}>
                        <td>{unit.label}</td>
                        <td>{unit.floor === null ? "—" : unit.floor === 0 ? "EG" : `${unit.floor}. OG`}</td>
                        <td>
                          {building.entrances.find((e) => e.id === unit.entranceId)
                            ?.label ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  );
}
