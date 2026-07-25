import Foundation

/// Spiegel von `packages/api-contracts/src/app/settings.ts`.
enum SettingsContracts {
    enum NotificationCategory: String, Codable, CaseIterable, Identifiable {
        case billing = "BILLING"
        case dataQuality = "DATA_QUALITY"
        case incident = "INCIDENT"
        case service = "SERVICE"
        case contract = "CONTRACT"

        var id: String { rawValue }

        var title: String {
            switch self {
            case .billing: "Rechnungen & Dokumente"
            case .dataQuality: "Messwerte"
            case .incident: "Störungen"
            case .service: "Service"
            case .contract: "Vertrag"
            }
        }
    }

    struct NotificationPreference: Decodable, Identifiable {
        let category: NotificationCategory
        let enabled: Bool
        /// `true` bei INCIDENT — vom Server erzwungen, darf nicht abwählbar sein.
        let locked: Bool

        var id: String { category.rawValue }
    }

    struct NotificationPreferences: Decodable {
        let categories: [NotificationPreference]
    }

    struct NotificationPreferenceUpdate: Encodable {
        let category: NotificationCategory
        let enabled: Bool
    }

    struct PushDeviceRegistration: Encodable {
        let expoPushToken: String
        let platform: String
        let appVersion: String
    }

    struct SupportMessage: Encodable {
        let subject: String
        let body: String
        let contextId: String?
    }
}
