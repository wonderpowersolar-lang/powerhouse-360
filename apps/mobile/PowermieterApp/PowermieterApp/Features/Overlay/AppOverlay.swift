import SwiftUI

/// Full-screen detail screens that slide in over the tab shell
/// (prototype `overlay` state, `z-index:7`, `pmSlide`).
enum AppOverlay: Identifiable, Equatable {
    case detailanalyse
    case verbrauchsaufteilung
    case wohneinheiten
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
        case .verbrauchsaufteilung: "verbrauchsaufteilung"
        case .wohneinheiten: "wohneinheiten"
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
