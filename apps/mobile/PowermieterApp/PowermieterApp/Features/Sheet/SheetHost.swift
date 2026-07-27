import SwiftUI

/// Hängt die Präsentations-Einstellungen an den Sheet-Inhalt.
///
/// Der Toast sitzt hier mit drin, obwohl die Hülle schon einen hat: Ein
/// `.sheet` ist eine eigene Präsentation und liegt über allem, was die
/// Elternansicht zeichnet. Der Toast wird aber genau aus dem Sheet heraus
/// ausgelöst („Download gestartet …") — ohne diese Kopie quittierte der Knopf
/// unsichtbar hinter dem Sheet. Die Hülle blendet ihren eigenen Toast
/// entsprechend aus, solange ein Sheet offen ist, damit er nie doppelt steht.
struct SheetHost: View {
    let sheet: AppSheet
    let toast: String?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        BottomSheetView(sheet: sheet)
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
            .presentationBackground(Theme.card)
            .presentationCornerRadius(24)
            .overlay(alignment: .top) {
                if let toast {
                    ToastView(message: toast)
                        .padding(.top, 8)
                        .transition(reduceMotion
                                    ? .opacity
                                    : .move(edge: .top).combined(with: .opacity))
                        .allowsHitTesting(false)
                }
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.22), value: toast)
    }
}
