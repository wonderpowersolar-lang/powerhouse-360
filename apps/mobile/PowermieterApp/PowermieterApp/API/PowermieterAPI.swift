import Foundation

/// Die App-API (`/api/v1/app/*`) aus Sicht der App.
///
/// Ein Protokoll, damit die Oberfläche nicht weiß, ob die Werte vom Server
/// oder aus `MockPowermieterAPI` kommen. Solange WP-APP-2 nicht gebaut ist,
/// läuft die App gegen den Mock; danach genügt eine Basis-URL.
protocol PowermieterAPI: Sendable {
    /// Öffentlich, ohne Anmeldung — Mindestversion und Rechtstexte.
    func config() async throws -> ConfigResponse

    /// Profil samt aller Teilnahmen (Kontexte).
    func me() async throws -> MeContracts.Response

    func summary(contextID: String) async throws -> ConsumptionContracts.Summary

    func consumption(contextID: String,
                     resolution: ConsumptionContracts.Resolution,
                     from: Date,
                     to: Date) async throws -> ConsumptionContracts.Series

    func dataStatus(contextID: String) async throws -> ConsumptionContracts.DataStatus

    func invoices(contextID: String,
                  cursor: String?,
                  limit: Int) async throws -> BillingContracts.InvoiceList

    func invoice(contextID: String, invoiceID: String) async throws -> BillingContracts.InvoiceDetail

    func contract(contextID: String) async throws -> BillingContracts.Contract

    /// Liefert eine kurzlebige signierte URL; der Download selbst läuft direkt.
    func documentDownload(documentID: String) async throws -> BillingContracts.DocumentDownload

    func notificationPreferences() async throws -> SettingsContracts.NotificationPreferences

    func updateNotificationPreference(_ update: SettingsContracts.NotificationPreferenceUpdate) async throws

    func registerPushDevice(_ registration: SettingsContracts.PushDeviceRegistration) async throws

    func removePushDevice(token: String) async throws

    func sendSupportMessage(_ message: SettingsContracts.SupportMessage) async throws
}
