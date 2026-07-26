import SwiftUI

/// Maps an `AppOverlay` case to its screen, so the tab shell only has to
/// keep one piece of state.
struct OverlayHost: View {
    let overlay: AppOverlay
    let onClose: () -> Void

    @ViewBuilder
    var body: some View {
        switch overlay {
        case .detailanalyse:
            DetailanalyseView(onBack: onClose)
        case .monatsreport:
            MonatsreportView(onBack: onClose)
        case .sonnenstrompreis:
            SonnenstrompreisView(onBack: onClose)
        case .assistent:
            AssistentView(onBack: onClose)
        case .energiebilanz:
            EnergiebilanzView(onBack: onClose)
        case .mitteilungen:
            MitteilungenView(onBack: onClose)
        case .rechnungen:
            RechnungenView(onBack: onClose)
        case .rechnungsdetail(let month):
            RechnungsdetailView(invoice: .named(month), onBack: onClose)
        case .messsystem:
            MesssystemView(onBack: onClose)
        case .stoerungsfall:
            StoerungsfallView(onBack: onClose)
        case .support:
            SupportView(onBack: onClose)
        }
    }
}
