import SwiftUI

/// Maps an `AppOverlay` case to its screen, so the tab shell only has to
/// keep one piece of state.
struct OverlayHost: View {
    let overlay: AppOverlay
    let role: OnboardingRole
    let onClose: () -> Void

    @ViewBuilder
    var body: some View {
        switch overlay {
        case .detailanalyse:
            DetailanalyseView(role: role, onBack: onClose)
        case .verbrauchsaufteilung:
            VerbrauchsaufteilungView(onBack: onClose)
        case .wohneinheiten:
            WohneinheitenView(onBack: onClose)
        case .monatsreport:
            MonatsreportView(role: role, onBack: onClose)
        case .sonnenstrompreis:
            SonnenstrompreisView(onBack: onClose)
        case .assistent:
            AssistentView(role: role, onBack: onClose)
        case .energiebilanz:
            EnergiebilanzView(role: role, onBack: onClose)
        case .mitteilungen:
            MitteilungenView(role: role, onBack: onClose)
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
