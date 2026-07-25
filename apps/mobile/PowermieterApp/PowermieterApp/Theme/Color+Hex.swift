import SwiftUI

/// Builds a `Color` that automatically resolves to the light or dark value
/// depending on the current interface style — mirroring the CSS custom
/// properties in `design-reference/design-tokens.css` (`:root` vs
/// `[data-theme="dark"]`).
extension Color {
    /// Solid tokens: `0xRRGGBB` for both appearances.
    init(light: UInt32, dark: UInt32) {
        self.init(
            light: UIColor(rgb: light, alpha: 1),
            dark: UIColor(rgb: dark, alpha: 1)
        )
    }

    /// Tinted/soft tokens: `0xRRGGBB` plus an explicit alpha per appearance.
    init(light: UInt32, lightAlpha: CGFloat, dark: UInt32, darkAlpha: CGFloat) {
        self.init(
            light: UIColor(rgb: light, alpha: lightAlpha),
            dark: UIColor(rgb: dark, alpha: darkAlpha)
        )
    }

    private init(light: UIColor, dark: UIColor) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}

private extension UIColor {
    convenience init(rgb: UInt32, alpha: CGFloat) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255,
            alpha: alpha
        )
    }
}
