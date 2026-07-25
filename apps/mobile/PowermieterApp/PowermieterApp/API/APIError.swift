import Foundation

/// Fehler der App-API.
///
/// Der Server antwortet laut Vertrag mit `{ error: { code, message, requestId } }`.
/// `code` wird bewusst als String übernommen und nicht in ein Enum gezwungen —
/// ein neuer Server-Code darf die App nicht am Dekodieren hindern.
enum APIError: LocalizedError {
    /// Es ist keine Basis-URL konfiguriert; die App läuft gegen Mock-Daten.
    case notConfigured
    case unauthorized
    case server(status: Int, code: String, message: String, requestId: String?)
    case unexpectedStatus(Int)
    case transport(any Error)
    case decoding(any Error)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Keine Server-Adresse konfiguriert."
        case .unauthorized:
            "Bitte melde dich erneut an."
        case .server(_, _, let message, _):
            message
        case .unexpectedStatus(let status):
            "Der Server hat unerwartet mit Status \(status) geantwortet."
        case .transport:
            "Keine Verbindung zum Server."
        case .decoding:
            "Die Antwort des Servers war unlesbar."
        }
    }

    /// Envelope-Form für das Dekodieren einer Fehlerantwort.
    struct Envelope: Decodable {
        struct Payload: Decodable {
            let code: String
            let message: String
            let requestId: String?
        }

        let error: Payload
    }
}
