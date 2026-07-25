import SwiftUI

/// Light/dark preference from the Einstellungen tab. Starts as `.system` so
/// the app follows iOS until the user picks a side (the prototype only offers
/// Hell and Dunkel, so the picker highlights whichever is currently effective).
enum AppAppearance {
    case system, light, dark

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
