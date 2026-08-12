# POWERHOUSE 360 — Konventionen für den Design-Agenten

Cinematic-Noir-Marke: Off-Black-Void, Graphit-Flächen, warmweiße Typo, Teal/Grün-Markenverlauf. Alles ist Tailwind-v4-utility-getrieben über Design-Tokens.

## Grund-Setup (kein Provider nötig)

Es gibt keinen Theme-Provider. Aber: **Alle Komponenten sind für dunklen Grund gebaut.** Jede Seite/Section startet auf dem Page-Void:

```tsx
<div className="min-h-screen bg-navy-900 text-ink">…</div>
```

Schrift ist Sora (mitgeliefert via `@font-face`); sie greift automatisch über `--font-sans`. Ohne dunklen Wrapper sind warmweiße Texte (`text-ink`) unsichtbar.

## Styling-Idiom: Token-Utilities — und NUR kompilierte Klassen

`styles.css` ist **kompiliertes** Tailwind: Es existieren nur Klassen, die die Website nutzt oder die Safelist deklariert. Eine nicht enthaltene Klasse (z. B. `p-14`, `bg-red-500`) rendert **stumm gar nichts**. Bleib in diesem Vokabular:

| Familie | Verfügbare Werte |
|---|---|
| Flächen | `bg-navy-900` (Void) · `bg-navy-800` (Graphit) · `bg-navy-700`/`600` (erhöht) · `bg-white/5`–`/20` (Glass) |
| Text | `text-ink` (warmweiß) · `text-ink-dim` · `text-ink-faint` · `text-navy-900` (auf hellen/Teal-Flächen) |
| Markenakzent | `bg-gold`/`text-gold` (= Teal #2bb6b0!) · `gold-soft` (Grün) · `gold-deep` (Blau) |
| Modul-Akzente (nur Orientierung, sparsam) | `mod-power` (Solar-Gold) · `mod-heat` (Rotorange) · `mod-charge` (Cyan) · `mod-smoke` (Amber) — als `bg-`/`text-`/`border-` |
| Borders | `border-white/10`–`/35`, `border-navy-600`–`800` |
| Spacing | `p/px/py/m/gap-{0,1,1.5,2,2.5,3,4,5,6,8,10,12,16}` |
| Layout | `flex`, `grid`, `grid-cols-{1,2,3,4,6,12}`, `items-*`, `justify-*`, `w-{…,64,80,96,full}`, `max-w-{sm…4xl}` |
| Typo | `text-{xs…5xl}`, `font-{light…extrabold}`, `tracking-{tight,wide,widest}`, `uppercase`, `tabular-nums` |
| Radius/Effekte | `rounded-{lg,xl,2xl,3xl,full}`, `shadow-*`, `backdrop-blur-sm`, `transition-all` |

Historie: Die `gold-*`-Tokennamen tragen die **Logo-Farben** (deep=Blau, gold=Teal, soft=Grün). Markenverlauf: `bg-gradient-to-r from-gold-deep via-gold to-gold-soft`; für Text gibt es die fertige Klasse `brand-gradient-text`. Kicker-Stil der Site: `text-gold uppercase tracking-widest text-sm`. CSS-Variablen (`var(--color-gold)`, `var(--color-mod-power)`, `var(--ease-calm)`) sind in `styles.css` definiert und in Inline-Styles nutzbar (z. B. `accent` der MetricCard).

## Komponenten (window.PH360)

- **`Button`** — `variant="primary"` (Teal-Pill, EIN CTA pro View) | `"secondary"` (Glass). Native button-Props (`disabled`, `onClick`, `type`).
- **`ButtonLink` NICHT verwenden** — Next-Router-gebunden, rendert außerhalb der Website nicht. Für Navigations-Optik: `Button` mit `onClick`.
- **`LogoLockup`** — Icon + Wortmarke; Größe über Höhenklasse: Nav `className="h-11 w-auto"`, Footer `h-8`. Nur auf dunklem Grund.
- **`LogoMark`** — Icon solo, `size={40|64}`.
- **`MetricCard`** — KPI-Chip (`label`, `value`, optional `bar` 0–1, `sub`, `accent`-Farbe, `tone="dark"|"light"`). Im 2er-Grid einsetzen wie unten.

## Wo die Wahrheit liegt

Vor dem Stylen lesen: `styles.css` (Tokens im `:root`/`@theme`-Block + alle existierenden Utilities), pro Komponente `components/general/<Name>/<Name>.prompt.md` und `<Name>.d.ts` (exakte Props).

## Idiomatischer Baustein

```tsx
<section className="min-h-screen bg-navy-900 text-ink p-16">
  <LogoLockup className="h-9 w-auto" />
  <p className="mt-12 text-gold uppercase tracking-widest text-sm">Chargemieter</p>
  <h2 className="mt-3 text-4xl font-bold">Laden im Mehrfamilienhaus</h2>
  <p className="mt-3 max-w-xl text-ink-dim">Planbar, steuerbar, abrechenbar.</p>
  <div className="mt-6 flex items-center gap-3">
    <Button variant="primary">Beratung anfragen</Button>
    <Button variant="secondary">Mehr erfahren</Button>
  </div>
  <div className="mt-10 grid grid-cols-2 gap-2.5 max-w-sm">
    <MetricCard label="Ladepunkte" value="14" tone="dark" />
    <MetricCard label="Auslastung" value="62 %" bar={0.62} accent="var(--color-mod-charge)" tone="dark" />
  </div>
</section>
```
