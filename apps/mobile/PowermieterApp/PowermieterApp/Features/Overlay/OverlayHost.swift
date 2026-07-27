import SwiftUI

/// Bildet einen `AppOverlay`-Fall auf seinen Screen ab.
///
/// Zurück gehört seit dem Umbau der Navigationsleiste des Systems: Die Screens
/// haben keinen eigenen Zurück-Knopf und kein `onBack` mehr. Wer selbst
/// schließen muss (`StoerungsfallView` hat einen „Fertig"-Knopf), nimmt
/// `\.dismiss`.
struct OverlayHost: View {
    let overlay: AppOverlay

    @ViewBuilder
    var body: some View {
        switch overlay {
        case .detailanalyse:
            DetailanalyseView()
        case .monatsreport:
            MonatsreportView()
        case .sonnenstrompreis:
            SonnenstrompreisView()
        case .assistent:
            AssistentView()
        case .energiebilanz:
            EnergiebilanzView()
        case .mitteilungen:
            MitteilungenView()
        case .rechnungen:
            RechnungenView()
        case .rechnungsdetail(let month):
            RechnungsdetailView(invoice: .named(month))
        case .messsystem:
            MesssystemView()
        case .stoerungsfall:
            StoerungsfallView()
        case .support:
            SupportView()
        }
    }
}
