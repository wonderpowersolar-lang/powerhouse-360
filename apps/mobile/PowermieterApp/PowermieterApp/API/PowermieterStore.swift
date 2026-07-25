import SwiftUI

/// Hält die geladenen App-Daten und den Ladezustand.
///
/// Die Views lesen von hier statt aus fest eingetippten Werten. Welcher Client
/// darunter liegt — echter Server oder `MockPowermieterAPI` — entscheidet
/// `APIConfiguration`; der Store sieht nur das Protokoll.
@Observable
final class PowermieterStore {
    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    private(set) var state: LoadState = .idle
    private(set) var me: MeContracts.Response?
    private(set) var summary: ConsumptionContracts.Summary?
    private(set) var today: ConsumptionContracts.Series?

    /// Die aktuell gewählte Teilnahme. Mehrere Kontexte gibt es, wenn jemand
    /// mehr als eine Wohnung hat.
    private(set) var selectedContext: MeContracts.AppContext?

    private let api: any PowermieterAPI

    init(api: any PowermieterAPI = APIConfiguration.makeClient()) {
        self.api = api
    }

    /// Läuft die App gegen den echten Server oder gegen Mock-Daten?
    var usesLiveAPI: Bool { APIConfiguration.usesLiveAPI }

    @MainActor
    func load() async {
        guard state != .loading else { return }
        state = .loading

        do {
            let profile = try await api.me()
            me = profile
            // Erste nicht abgelaufene Teilnahme, sonst die erste überhaupt.
            let context = profile.contexts.first { !$0.expired } ?? profile.contexts.first
            selectedContext = context

            guard let context else {
                state = .loaded
                return
            }

            summary = try await api.summary(contextID: context.id)

            let dayStart = Calendar(identifier: .gregorian)
                .startOfDay(for: summary?.dataStatus.lastReceivedAt ?? Date())
            today = try await api.consumption(contextID: context.id,
                                              resolution: .hour,
                                              from: dayStart,
                                              to: dayStart.addingTimeInterval(24 * 3600))

            state = .loaded
        } catch {
            let message = (error as? APIError)?.errorDescription
                ?? error.localizedDescription
            state = .failed(message)
        }
    }

    @MainActor
    func select(_ context: MeContracts.AppContext) async {
        guard context.id != selectedContext?.id else { return }
        selectedContext = context
        summary = nil
        today = nil
        state = .idle
        await load()
    }

    // MARK: Abgeleitete Anzeigewerte

    /// Heutiger Verbrauch, z. B. „8,6".
    var todayKwhText: String? {
        summary.map { $0.today.kwh.formatted(fractionDigits: 1) }
    }

    /// Heutiger Solaranteil in kWh, aus der Stundenkurve summiert.
    var todaySolarKwh: Kwh? {
        guard let points = today?.points else { return nil }
        return points.reduce(Kwh(milli: 0)) { $0 + ($1.kwhPv ?? Kwh(milli: 0)) }
    }

    /// „vor 1 Min" für die Live-Zeile.
    func lastReceivedText(relativeTo reference: Date = Date()) -> String? {
        guard let lastReceivedAt = summary?.dataStatus.lastReceivedAt else { return nil }
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.unitsStyle = .short
        return formatter.localizedString(for: lastReceivedAt, relativeTo: reference)
    }
}

extension EnvironmentValues {
    @Entry var powermieterStore = PowermieterStore(api: MockPowermieterAPI())
}
