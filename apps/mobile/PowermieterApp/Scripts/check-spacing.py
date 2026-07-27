#!/usr/bin/env python3
"""Prüft, dass Abstände auf dem Raster liegen.

Raster: 4 pt, mit 2-pt-Halbschritten unter 8 pt — also 0, 2, 4, 6 und dann
Vielfache von 4.

Ohne diese Prüfung verfällt das Raster beim nächsten Screen: Die krummen Werte
der App stammten ursprünglich 1:1 aus den Pixelwerten des HTML-Prototyps, und
genau so schleichen sie sich wieder ein.

Feste Größen aus `.frame(...)` werden bewusst **nicht** geprüft. Sie sind keine
Abstände, und per Regex lassen sie sich nicht auseinanderhalten: Darunter fallen
Symbolkacheln, Punktdurchmesser, Chart-Zeichenflächen (146, 210, 250) und
Haarlinien. Eine Haarlinie muss 1 pt hoch sein — eine Prüfung, die daraus 2
machen will, wäre schädlich statt nützlich. Die Knopfhöhen sind einmalig von
Hand auf 44 / 48 / 56 vereinheitlicht worden.

    python3 Scripts/check-spacing.py          # prüfen, Exitcode 1 bei Fund
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "PowermieterApp"

CHECKS = [
    ("padding", re.compile(r"\.padding\((?:\.\w+, )?(\d+)\)")),
    ("spacing", re.compile(r"spacing: (\d+)")),
    ("horizontalPadding", re.compile(r"[Pp]adding: (\d+)")),
    ("minLength", re.compile(r"minLength: (\d+)")),
]


def on_grid(value: int) -> bool:
    return value in (0, 2, 4, 6) or (value >= 8 and value % 4 == 0)


def nearest(value: int) -> int:
    grid = [0, 2, 4, 6] if value <= 6 else list(range(8, 1000, 4))
    return min(grid, key=lambda g: (abs(g - value), -g))


def main() -> int:
    findings = []
    for path in sorted(ROOT.rglob("*.swift")):
        for line_number, line in enumerate(path.read_text().split("\n"), 1):
            for label, pattern in CHECKS:
                for match in pattern.finditer(line):
                    value = int(match.group(1))
                    if not on_grid(value):
                        findings.append(
                            f"{path.relative_to(ROOT.parent)}:{line_number}  "
                            f"{label} {value} → {nearest(value)}"
                        )

    if findings:
        print(f"{len(findings)} Abstände außerhalb des Rasters:\n")
        for finding in findings:
            print("  " + finding)
        print("\nRaster: 0, 2, 4, 6, dann Vielfache von 4.")
        return 1

    print("Alle Abstände liegen auf dem Raster.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
