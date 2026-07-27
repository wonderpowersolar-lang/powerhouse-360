import SwiftUI

/// Kopfbereich der Detailscreens — jetzt die Navigationsleiste des Systems.
///
/// Vorher war das ein eigener `OverlayHeader` mit Karten-Zurück-Knopf, und die
/// Systemleiste war ausgeblendet, damit nichts doppelt. Das kostete genau die
/// Geste, um die es beim Umbau ging: **Mit `.toolbar(.hidden, for:
/// .navigationBar)` ist der Kantenwisch zurück deaktiviert.** Im Simulator mit
/// zwei Wischvarianten geprüft — keine ging zurück, obwohl der Stack korrekt
/// geschoben war.
///
/// Titel und Untertitel behalten ihren Inhalt und wandern in ein
/// `principal`-Element; `navigationSubtitle` gäbe es erst ab iOS 26, das
/// Deployment-Target ist 18.
extension View {
    func pmOverlayChrome(title: String, subtitle: String? = nil) -> some View {
        navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    VStack(spacing: 2) {
                        Text(title)
                            .pmFont(16, weight: .heavy)
                            .tracking(-0.2)
                            .foregroundStyle(Theme.tx)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        if let subtitle {
                            Text(subtitle)
                                .pmFont(11)
                                .foregroundStyle(Theme.tx3)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.isHeader)
                }
            }
            .toolbarBackground(Theme.bg, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
    }
}
