import SwiftUI

/// Full-screen detail screens that slide in over the tab shell
/// (prototype `overlay` state, `z-index:7`, `pmSlide`).
///
/// Die gebäudebezogenen Overlays (Wohneinheiten, Verbrauchsaufteilung) sind
/// mit ADR-011 entfallen — sie waren nur aus den Vermieter- und
/// Verwaltungsansichten erreichbar.
enum AppOverlay: Identifiable, Equatable {
    case detailanalyse
    case monatsreport
    case sonnenstrompreis
    case assistent
    case energiebilanz
    case mitteilungen
    case rechnungen
    case rechnungsdetail(month: String)
    case messsystem
    case stoerungsfall
    case support

    var id: String {
        switch self {
        case .detailanalyse: "detailanalyse"
        case .monatsreport: "monatsreport"
        case .sonnenstrompreis: "sonnenstrompreis"
        case .assistent: "assistent"
        case .energiebilanz: "energiebilanz"
        case .mitteilungen: "mitteilungen"
        case .rechnungen: "rechnungen"
        case .rechnungsdetail(let month): "rechnungsdetail-\(month)"
        case .messsystem: "messsystem"
        case .stoerungsfall: "stoerungsfall"
        case .support: "support"
        }
    }
}
