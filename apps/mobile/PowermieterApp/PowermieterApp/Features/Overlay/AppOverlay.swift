import SwiftUI

/// Die Detailscreens. Werden auf den `NavigationStack` der Tab-Hülle
/// geschoben (im Prototyp waren es `z-index:7`-Overlays mit `pmSlide`).
///
/// `Hashable`, weil der Typ als Element des Navigationspfads dient.
///
/// Die gebäudebezogenen Overlays (Wohneinheiten, Verbrauchsaufteilung) sind
/// mit ADR-011 entfallen — sie waren nur aus den Vermieter- und
/// Verwaltungsansichten erreichbar.
enum AppOverlay: Identifiable, Hashable {
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
