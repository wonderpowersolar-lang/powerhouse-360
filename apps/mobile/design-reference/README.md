# Design-Referenz — Powermieter App v2

Importiert aus dem **claude.ai/design**-Prototyp am 2026-07-23 (Option „nur als Referenz ablegen").

- **Projekt:** „Powermieter App Prototyp" (Owner: Leon)
- **Quelle:** https://claude.ai/design/p/2706e0a9-efe6-4fd1-af81-315342aa1a34
- **Ziel-Datei laut Auftrag:** `Powermieter App v2.dc.html`

## Was hier liegt

| Datei | Inhalt | Vollständig? |
|---|---|---|
| `design-tokens.css` | Farb-/Theme-System (Light + Dark), Schrift, Keyframes | ✅ vollständig |
| `Powermieter-App-v2.PARTIAL-256KiB.dc.html` | Der Prototyp-Quelltext (Design-Composer-Format `<x-dc>`) | ⚠️ **abgeschnitten bei 256 KiB** |

## ⚠️ Wichtige Einschränkung

Der `claude_design`-MCP (`DesignSync`) begrenzt `get_file` hart auf **256 KiB**. Die Prototyp-Datei ist größer, daher ist `…PARTIAL-256KiB.dc.html` **mitten im JavaScript abgeschnitten** (kein `</html>`) und **rendert nicht eigenständig**. Die enthaltenen Teile — komplettes Token-/Farbsystem, Onboarding- und obere Screen-Struktur, CSS — sind aber als Design-Referenz lesbar.

**Nicht importiert** (Auth zur Design-Session zwischenzeitlich abgelaufen; `/design-login` in nicht-interaktiver Session nicht möglich):
`support.js`, `ios-frame.jsx`, `Powermieter App.dc.html` (v1), sowie die Assets
`assets/{building-day.jpg, building-night.jpg, logo-icon.svg, src-day.png, src-night.png}` und `uploads/*`.

### Vollständigen Prototyp holen
1. In Claude Design **„Send to Claude Code Web"** — seedet das komplette Projekt in den Workspace, **oder**
2. Projektdateien direkt bereitstellen (Export/Download), **oder**
3. In einer **interaktiven** Session `/design-login` ausführen; danach lässt sich alles außer der 256-KiB-Kappung erneut abrufen (die große HTML muss stückweise/anders geholt werden).

## Bezug zur Roadmap

Diese Referenz gehört zu **WP-APP-3** (Mobile-Grundgerüst, `docs/superpowers/plans/2026-07-22-wp-app-3-mobile-grundgeruest.md`).
Dort wird das UI in **Expo/React Native** umgesetzt — dieser HTML-Prototyp ist die visuelle Vorlage, nicht der Auslieferungscode.
`design-tokens.css` liefert die Farbwerte für das dortige Theme-System (Abgleich Marketing- vs. App-Palette mit dem PO offen, siehe Kommentar in der CSS).
