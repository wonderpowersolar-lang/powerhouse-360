import Foundation

/// Spiegel von `packages/api-contracts/src/app/me.ts`.
///
/// Die DTOs sind bewusst nach Vertragsdatei gruppiert statt ein Typ je Datei —
/// so bleibt die Zuordnung zum Backend-Contract auf einen Blick erkennbar.
enum MeContracts {
    /// Ein Context = eine PowerParticipant-Teilnahme. Grundlage des
    /// Kontext-Umschalters, wenn jemand mehrere Wohnungen hat.
    struct AppContext: Decodable, Identifiable, Hashable {
        let id: String
        let unitLabel: String
        let buildingName: String
        let contractNumber: String?
        let validFrom: Date
        let validTo: Date?
        /// Teilnahme beendet — Daten bleiben lesbar, aber zeitlich beschnitten.
        let expired: Bool
    }

    struct AppUser: Decodable, Hashable {
        let id: String
        let email: String
        let name: String
        let locale: String
    }

    struct Response: Decodable {
        let user: AppUser
        let contexts: [AppContext]
    }
}
