#!/usr/bin/env bash
# design-sync Vorbereitung (cfg.buildCmd) — vor jedem Converter-Lauf ausführen.
#
# @ph360/website ist ein App-Workspace ohne dist und ohne Selbst-Installation;
# der Converter erwartet das Package unter <node-modules>/@ph360/website.
# Das Shim ist bewusst ein MINIMAL-Verzeichnis (package.json-Kopie + Symlinks
# auf src/ und tsconfig.json) statt eines Links auf apps/website:
#  - Link auf apps/website selbst → ts-morph läuft in apps/website/node_modules
#    und .next hinein (riesig; mit Selbst-Link sogar zyklisch → ENAMETOOLONG).
#  - cssEntry ist sicherheitsbedingt auf das Package-Root begrenzt → das
#    Tailwind-Kompilat liegt deshalb IM Shim (styles/tailwind.css).
set -euo pipefail
cd "$(dirname "$0")/.."

SHIM=".design-sync/.cache/nm/node_modules/@ph360/website"
NM=".design-sync/.cache/nm/node_modules"
mkdir -p "$SHIM/styles" "$NM/@types"

cp apps/website/package.json "$SHIM/package.json"

# Process-Shim (cfg.extraEntries[0]): Nexts kompilierte Module (next/link via
# ButtonLink) lesen process.env.__NEXT_* auf MODULEBENE; außerhalb der
# Next-Runtime existiert process nicht → die IIFE stirbt beim Laden.
# extraEntries werden im Wrapper-Entry VOR dem Haupt-Entry exportiert und
# damit zuerst evaluiert — der Shim läuft garantiert vor next/link.
cat > "$SHIM/ds-process-shim.mjs" << 'SHIM_EOF'
// design-sync: process-Stub für Next-Module in der Browser-/Design-Runtime.
if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: {} };
}
export {};
SHIM_EOF
ln -sfn "$PWD/apps/website/src" "$SHIM/src"
ln -sfn "$PWD/apps/website/tsconfig.json" "$SHIM/tsconfig.json"
ln -sfn "$PWD/.design-sync/fonts" "$SHIM/fonts"

# Abhängigkeiten, die Converter/esbuild vom Shim aus auflösen müssen.
for p in react react-dom next; do
  ln -sfn "$PWD/apps/website/node_modules/$p" "$NM/$p"
done
ln -sfn "$PWD/apps/website/node_modules/@types/react" "$NM/@types/react"

# Tailwind v4: Website-Tokens + Utilities aus globals.css kompilieren.
# Wrapper-Entry statt globals.css direkt: Tailwind emittiert nur Klassen, die
# in den gescannten Quellen vorkommen — Designs des claude.ai/design-Agenten
# (und die Preview-Wrapper) brauchen aber ein verlässliches Grundvokabular
# über den App-Bestand hinaus → kuratierte @source-inline-Safelist
# (.design-sync/tailwind-safelist.css, token-treu, committed).
# --font-sora setzt sonst next/font zur Laufzeit → statisch anhängen.
TW_ENTRY="$SHIM/styles/tw-entry.css"
{
  echo '@import "../src/app/globals.css";'
  cat .design-sync/tailwind-safelist.css
} > "$TW_ENTRY"
(cd apps/website && npx --yes @tailwindcss/cli@4 -i "../../$TW_ENTRY" -o "../../$SHIM/styles/tailwind.css")
printf '\n:root{--font-sora:"Sora",ui-sans-serif,system-ui,sans-serif;}\n' >> "$SHIM/styles/tailwind.css"
echo "prep ok: Shim + $SHIM/styles/tailwind.css"
