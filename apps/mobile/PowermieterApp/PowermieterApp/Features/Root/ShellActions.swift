import SwiftUI

/// Die drei Aktionen der Tab-Hülle: Detailscreen öffnen, Sheet öffnen, Toast
/// zeigen.
///
/// Warum das ein eigener Modifier ist und nicht einfach drei
/// `.environment`-Aufrufe an der Hülle:
///
/// **Die Ziele eines `navigationDestination` erben Environment-Werte nicht,
/// die außerhalb des `NavigationStack` gesetzt wurden.**
///
/// Im Simulator per A/B geprüft, weil der Fehler sich sonst als „Knopf kaputt"
/// tarnt: In den Mitteilungen setzt eine Zeile erst `readIDs` und ruft dann
/// `openOverlay`. **Ohne** diesen Modifier am Ziel verschwindet der
/// Ungelesen-Punkt — der Knopf feuert also —, aber es wird nichts geschoben:
/// `openOverlay` ist dort der `noop`-Standardwert. **Mit** ihm pusht es.
///
/// Der native Zurück-Knopf funktioniert in beiden Fällen, weil `\.dismiss` ein
/// Systemwert ist und einem anderen Weg folgt. Genau diese Mischung macht den
/// Fehler unangenehm: Es sieht aus, als funktioniere die Navigation, und nur
/// die eine Richtung tut es.
///
/// Deshalb werden die Aktionen an jeder Präsentationsgrenze neu gesetzt:
/// Wurzelinhalt, jedes Navigationsziel, Sheet-Inhalt.
struct ShellActions: ViewModifier {
    let openOverlay: (AppOverlay) -> Void
    let openSheet: (AppSheet) -> Void
    let showToast: (String) -> Void

    func body(content: Content) -> some View {
        content
            .environment(\.openOverlay, OverlayAction(openOverlay))
            .environment(\.openSheet, SheetAction(openSheet))
            .environment(\.showToast, ToastAction(showToast))
    }
}
