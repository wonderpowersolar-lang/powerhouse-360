import SwiftUI

/// Design tokens ported 1:1 from `apps/mobile/design-reference/design-tokens.css`.
/// Light = default, Dark = the `[data-theme="dark"]` overrides.
enum Theme {
    // Surfaces
    static let bg = Color(light: 0xEFF2F3, dark: 0x0A1117)
    static let bg2 = Color(light: 0xFFFFFF, dark: 0x0F171E)
    static let card = Color(light: 0xFFFFFF, dark: 0x121C24)
    static let card2 = Color(light: 0xF3F6F6, dark: 0x192631)
    static let elev = Color(light: 0xE4EAEB, dark: 0x25353F)

    // Hairlines
    static let line = Color(light: 0x172B43, lightAlpha: 0.08, dark: 0x94D2C4, darkAlpha: 0.09)
    static let line2 = Color(light: 0x172B43, lightAlpha: 0.16, dark: 0x94D2C4, darkAlpha: 0.18)

    // Text
    //
    // `tx2` and `tx3` weichen bewusst von `design-tokens.css` ab. Die
    // CSS-Werte (#5E6D82 / #97A4B4) erreichen auf Kartenweiß nur 5,3:1 und
    // 2,5:1 — `tx3` verfehlt WCAG AA (4,5:1) deutlich, und es trägt quer durch
    // die App Zeitstempel, Bildunterschriften und Metazeilen. `tx3` allein
    // abzudunkeln hätte es mit `tx2` verschmelzen lassen, deshalb sind beide
    // Stufen nachgezogen. Dunkelmodus analog gegen `card` gerechnet.
    //
    // Gerechnet gegen die jeweils ungünstigere der beiden Flächen, auf denen
    // Text steht — `card`/`bg2` und `bg`. Nur gegen Kartenweiß zu prüfen hätte
    // die Abschnittstitel übersehen, die direkt auf `bg` liegen.
    //
    //         hell: Karte / bg     dunkel: Karte / bg
    // tx      15,6  / 13,9         15,4  / 16,9
    // tx2      7,9  /  7,0          6,9  /  7,6
    // tx3      5,1  /  4,5          4,5  /  5,0
    static let tx = Color(light: 0x16243A, dark: 0xEAF4F0)
    static let tx2 = Color(light: 0x475262, dark: 0x93A8A6)
    static let tx3 = Color(light: 0x676F7A, dark: 0x6E8885)

    // Accent (brand green)
    static let acc = Color(light: 0x39954C, dark: 0x4ED584)
    static let accT = Color(light: 0xFFFFFF, dark: 0x05180E)
    static let accS = Color(light: 0x39954C, lightAlpha: 0.12, dark: 0x4ED584, darkAlpha: 0.14)

    // Primary button (navy in light, green in dark — per token system)
    static let btn = Color(light: 0x172B43, dark: 0x3FC873)
    static let btnT = Color(light: 0xFFFFFF, dark: 0x06220F)

    // Energy domain colors
    static let pv = Color(light: 0xD89710, dark: 0xF2B441)
    static let pvS = Color(light: 0xD89710, lightAlpha: 0.13, dark: 0xF2B441, darkAlpha: 0.14)
    static let grid = Color(light: 0x3E6FB8, dark: 0x5F9EE8)
    static let gridS = Color(light: 0x3E6FB8, lightAlpha: 0.11, dark: 0x5F9EE8, darkAlpha: 0.14)
    static let home = Color(light: 0x3B5473, dark: 0xD9E7E2)
    static let homeS = Color(light: 0x3B5473, lightAlpha: 0.12, dark: 0xD9E7E2, darkAlpha: 0.10)
    static let wp = Color(light: 0xCE7226, dark: 0xE08A47)
    static let wpS = Color(light: 0xCE7226, lightAlpha: 0.12, dark: 0xE08A47, darkAlpha: 0.15)
    static let bat = Color(light: 0x258E89, dark: 0x39C2B4)
    static let batS = Color(light: 0x258E89, lightAlpha: 0.13, dark: 0x39C2B4, darkAlpha: 0.15)
    static let feed = Color(light: 0x45B7A6, dark: 0x6FE3CD)
    static let feedS = Color(light: 0x45B7A6, lightAlpha: 0.14, dark: 0x6FE3CD, darkAlpha: 0.15)

    // Status
    static let ok = Color(light: 0x39954C, dark: 0x4ED584)
    static let okS = Color(light: 0x39954C, lightAlpha: 0.13, dark: 0x4ED584, darkAlpha: 0.15)
    static let warn = Color(light: 0xD8890F, dark: 0xEBAE3F)
    static let warnS = Color(light: 0xD8890F, lightAlpha: 0.15, dark: 0xEBAE3F, darkAlpha: 0.16)
    static let info = Color(light: 0x4A7DBF, dark: 0x7FB4E8)
    static let infoS = Color(light: 0x4A7DBF, lightAlpha: 0.12, dark: 0x7FB4E8, darkAlpha: 0.14)
    static let crit = Color(light: 0xD6544A, dark: 0xF07064)
    static let critS = Color(light: 0xD6544A, lightAlpha: 0.12, dark: 0xF07064, darkAlpha: 0.15)

    // Layout constants
    static let radiusCard: CGFloat = 20
    static let radiusTile: CGFloat = 18
    static let radiusButton: CGFloat = 16
}

extension View {
    /// Soft elevation matching the `--shadow` token.
    func pmCardShadow() -> some View {
        shadow(color: Color(light: 0x172B43, lightAlpha: 0.07, dark: 0x00060A, darkAlpha: 0.5),
               radius: 13, x: 0, y: 8)
    }
}
