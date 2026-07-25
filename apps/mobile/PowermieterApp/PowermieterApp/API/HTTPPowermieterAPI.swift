import Foundation

/// `URLSession`-Client gegen `/api/v1/app/*`.
///
/// Noch nie gegen einen laufenden Server getestet — WP-APP-2 existiert nicht.
/// Die Pfade, Query-Parameter und der Fehler-Envelope folgen dem Plan
/// `docs/superpowers/plans/2026-07-22-wp-app-2-aggregation-app-api.md`.
struct HTTPPowermieterAPI: PowermieterAPI {
    let baseURL: URL
    var session: URLSession = .shared

    private var decoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let raw = try decoder.singleValueContainer().decode(String.self)
            // Der Vertrag schreibt ISO 8601 UTC vor; Bruchteilssekunden sind
            // je nach Serializer mal da, mal nicht.
            let withFraction = ISO8601DateFormatter()
            withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = withFraction.date(from: raw) { return date }

            let plain = ISO8601DateFormatter()
            plain.formatOptions = [.withInternetDateTime]
            if let date = plain.date(from: raw) { return date }

            throw DecodingError.dataCorrupted(
                .init(codingPath: decoder.codingPath,
                      debugDescription: "Kein ISO-8601-UTC-Zeitstempel: \(raw)")
            )
        }
        return decoder
    }

    // MARK: Endpunkte

    func config() async throws -> ConfigResponse {
        try await get("/api/v1/app/config")
    }

    func me() async throws -> MeContracts.Response {
        try await get("/api/v1/app/me")
    }

    func summary(contextID: String) async throws -> ConsumptionContracts.Summary {
        try await get("/api/v1/app/contexts/\(contextID)/summary")
    }

    func consumption(contextID: String,
                     resolution: ConsumptionContracts.Resolution,
                     from: Date,
                     to: Date) async throws -> ConsumptionContracts.Series {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return try await get("/api/v1/app/contexts/\(contextID)/consumption",
                             query: [
                                "resolution": resolution.rawValue,
                                "from": formatter.string(from: from),
                                "to": formatter.string(from: to),
                             ])
    }

    func dataStatus(contextID: String) async throws -> ConsumptionContracts.DataStatus {
        try await get("/api/v1/app/contexts/\(contextID)/data-status")
    }

    func invoices(contextID: String,
                  cursor: String?,
                  limit: Int) async throws -> BillingContracts.InvoiceList {
        var query = ["limit": String(limit)]
        if let cursor { query["cursor"] = cursor }
        return try await get("/api/v1/app/contexts/\(contextID)/invoices", query: query)
    }

    func invoice(contextID: String, invoiceID: String) async throws -> BillingContracts.InvoiceDetail {
        try await get("/api/v1/app/contexts/\(contextID)/invoices/\(invoiceID)")
    }

    func contract(contextID: String) async throws -> BillingContracts.Contract {
        try await get("/api/v1/app/contexts/\(contextID)/contract")
    }

    func documentDownload(documentID: String) async throws -> BillingContracts.DocumentDownload {
        try await get("/api/v1/app/documents/\(documentID)/download")
    }

    func notificationPreferences() async throws -> SettingsContracts.NotificationPreferences {
        try await get("/api/v1/app/notification-preferences")
    }

    func updateNotificationPreference(_ update: SettingsContracts.NotificationPreferenceUpdate) async throws {
        try await send("/api/v1/app/notification-preferences", method: "PUT", body: update)
    }

    func registerPushDevice(_ registration: SettingsContracts.PushDeviceRegistration) async throws {
        try await send("/api/v1/app/push-devices", method: "POST", body: registration)
    }

    func removePushDevice(token: String) async throws {
        struct Body: Encodable { let expoPushToken: String }
        try await send("/api/v1/app/push-devices", method: "DELETE", body: Body(expoPushToken: token))
    }

    func sendSupportMessage(_ message: SettingsContracts.SupportMessage) async throws {
        try await send("/api/v1/app/support/messages", method: "POST", body: message)
    }

    // MARK: Transport

    private func get<Response: Decodable>(_ path: String,
                                          query: [String: String] = [:]) async throws -> Response {
        var components = URLComponents(url: baseURL.appendingPathComponent(path),
                                       resolvingAgainstBaseURL: false)
        if !query.isEmpty {
            components?.queryItems = query
                .sorted { $0.key < $1.key }
                .map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components?.url else { throw APIError.notConfigured }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let data = try await perform(request)
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func send(_ path: String, method: String, body: some Encodable) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(body)
        _ = try await perform(request)
    }

    @discardableResult
    private func perform(_ request: URLRequest) async throws -> Data {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.unexpectedStatus(-1)
        }

        switch http.statusCode {
        case 200..<300:
            return data
        case 401:
            throw APIError.unauthorized
        default:
            if let envelope = try? decoder.decode(APIError.Envelope.self, from: data) {
                throw APIError.server(status: http.statusCode,
                                      code: envelope.error.code,
                                      message: envelope.error.message,
                                      requestId: envelope.error.requestId)
            }
            throw APIError.unexpectedStatus(http.statusCode)
        }
    }
}
