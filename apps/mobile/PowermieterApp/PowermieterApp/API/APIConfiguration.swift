import Foundation

/// Wo die App ihre Daten herholt.
///
/// Ohne konfigurierte Basis-URL läuft die App gegen `MockPowermieterAPI` —
/// das ist der aktuelle Zustand, solange WP-APP-1/2 nicht gebaut sind.
/// Sobald die API steht, genügt `PM_API_BASE_URL` bzw. ein Eintrag in der
/// Info.plist, um auf den echten Server umzuschalten.
enum APIConfiguration {
    /// Basis-URL ohne abschließenden Schrägstrich, z. B.
    /// `https://app.powerhouse360.de`. Die Pfade `/api/v1/app/*` hängt der
    /// Client selbst an.
    static var baseURL: URL? {
        if let raw = ProcessInfo.processInfo.environment["PM_API_BASE_URL"],
           !raw.isEmpty,
           let url = URL(string: raw) {
            return url
        }
        if let raw = Bundle.main.object(forInfoDictionaryKey: "PMAPIBaseURL") as? String,
           !raw.isEmpty,
           let url = URL(string: raw) {
            return url
        }
        return nil
    }

    /// Die App läuft gegen echte Daten, sobald eine Basis-URL gesetzt ist.
    static var usesLiveAPI: Bool { baseURL != nil }

    /// Baut den passenden Client. Ein einziger Ort, an dem entschieden wird,
    /// ob echt oder Mock — Views und Store sehen nur das Protokoll.
    static func makeClient() -> any PowermieterAPI {
        guard let baseURL else { return MockPowermieterAPI() }
        return HTTPPowermieterAPI(baseURL: baseURL)
    }
}
