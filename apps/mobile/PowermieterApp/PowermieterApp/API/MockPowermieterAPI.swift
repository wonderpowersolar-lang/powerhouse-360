import Foundation

/// Liefert die Werte, die bisher fest in den Views standen — jetzt hinter
/// demselben Protokoll wie der echte Server. Damit läuft die App unverändert,
/// bis WP-APP-1/2 gebaut sind, und die Views müssen dafür nicht noch einmal
/// angefasst werden.
struct MockPowermieterAPI: PowermieterAPI {
    /// Fester Bezugszeitpunkt: 21. Juli 2026, 11:24 UTC — dieselbe Uhrzeit,
    /// die der Prototyp in „Stand 11:24 Uhr" zeigt.
    private var now: Date {
        DateComponents(calendar: .init(identifier: .gregorian),
                       timeZone: TimeZone(identifier: "UTC"),
                       year: 2026, month: 7, day: 21, hour: 11, minute: 24).date ?? .distantPast
    }

    private let contextID = "11111111-1111-4111-8111-111111111111"

    func config() async throws -> ConfigResponse {
        ConfigResponse(minAppVersion: "1.0.0",
                       privacyUrl: URL(string: "https://powerhouse360.de/datenschutz")!,
                       imprintUrl: URL(string: "https://powerhouse360.de/impressum")!,
                       features: .init(co2: true))
    }

    func me() async throws -> MeContracts.Response {
        MeContracts.Response(
            user: .init(id: "user-leon", email: "leon.berger@mail.de",
                        name: "Leon Berger", locale: "de-DE"),
            contexts: [
                .init(id: contextID,
                      unitLabel: "WE 12",
                      buildingName: "Friedrichsruher Str. 35",
                      contractNumber: "MS-2025-0012",
                      validFrom: date(2025, 3, 12),
                      validTo: nil,
                      expired: false)
            ]
        )
    }

    func summary(contextID: String) async throws -> ConsumptionContracts.Summary {
        ConsumptionContracts.Summary(
            lastReading: .init(valueKwh: Kwh(milli: 4_711_250), ts: now),
            recentPower: .init(watts: 3_200,
                               intervalEnd: Date().addingTimeInterval(-60),
                               intervalMinutes: 15),
            today: .init(kwh: Kwh(milli: 8_600),
                         hasGaps: true,
                         costCents: 234,
                         pvKwh: Kwh(milli: 6_500),
                         gridKwh: Kwh(milli: 2_100)),
            month: .init(kwh: Kwh(milli: 196_000),
                         costCents: 5_140,
                         projectedMonthEndCents: 6_810,
                         previousMonthKwh: Kwh(milli: 209_000),
                         deltaToPreviousMonthPct: -6.2),
            split: .init(available: true,
                         pvKwh: Kwh(milli: 149_000),
                         gridKwh: Kwh(milli: 47_000),
                         savingsCents: 1_845),
            // Der Empfangszeitpunkt ist ein Live-Wert und darf nicht am
            // Prototyp-Datum kleben — sonst meldet die App „vor 4 Tagen".
            dataStatus: .init(lastReceivedAt: Date().addingTimeInterval(-60),
                              hasOpenGaps: true,
                              isPreliminary: true)
        )
    }

    func consumption(contextID: String,
                     resolution: ConsumptionContracts.Resolution,
                     from: Date,
                     to: Date) async throws -> ConsumptionContracts.Series {
        // Dieselbe Tageskurve wie im Chart: Morgen- und Abendspitze, mittags PV.
        let points = (0..<24).map { hour -> ConsumptionContracts.Point in
            let h = Double(hour)
            let pv = 1.18 * gauss(h, 13, 3.1)
            let total = 0.16 + 0.52 * gauss(h, 7.5, 1.5) + 0.88 * gauss(h, 19.5, 2.1)
                + 0.14 * gauss(h, 13, 3.4)
            let solar = min(total, pv)
            // 05:00–07:00 ist im Prototyp die geschätzte Lücke.
            let estimated = (5...7).contains(hour)
            return .init(periodStart: date(2026, 7, 21, hour: hour),
                         kwhTotal: Kwh(milli: Int((total * 1000).rounded())),
                         kwhPv: Kwh(milli: Int((solar * 1000).rounded())),
                         kwhGrid: Kwh(milli: Int(((total - solar) * 1000).rounded())),
                         costCents: Int((total * 27.2).rounded()),
                         hasGaps: estimated,
                         isPreliminary: estimated)
        }

        return .init(resolution: resolution,
                     from: from,
                     to: to,
                     points: points,
                     previousPeriodKwh: Kwh(milli: 9_400),
                     deltaToPreviousPeriodPct: -8.5,
                     avgPriceCentsPerKwh: 27.2,
                     savingsCents: 234)
    }

    func dataStatus(contextID: String) async throws -> ConsumptionContracts.DataStatus {
        .init(lastReceivedAt: Date().addingTimeInterval(-60),
              openGaps: [.init(firstAt: date(2026, 7, 21, hour: 5),
                               lastAt: date(2026, 7, 21, hour: 7))],
              disturbance: false)
    }

    func invoices(contextID: String, cursor: String?, limit: Int) async throws -> BillingContracts.InvoiceList {
        .init(items: [
            invoice(number: "2026-06", month: 6, cents: 6_410),
            invoice(number: "2026-05", month: 5, cents: 6_845),
            invoice(number: "2026-04", month: 4, cents: 7_118),
            invoice(number: "2026-03", month: 3, cents: 7_690),
        ], nextCursor: nil)
    }

    func invoice(contextID: String, invoiceID: String) async throws -> BillingContracts.InvoiceDetail {
        .init(id: invoiceID, number: "2026-06",
              periodStart: date(2026, 6, 1), periodEnd: date(2026, 6, 30),
              totalCents: 6_410, status: .paid,
              documentId: "doc-2026-06")
    }

    func contract(contextID: String) async throws -> BillingContracts.Contract {
        .init(contractNumber: "MS-2025-0012",
              status: .active,
              startAt: date(2025, 3, 12),
              endAt: nil,
              tariff: .init(name: "Mieterstrom Basis 2026",
                            validFrom: date(2026, 1, 1),
                            workPricePvCents: 25,
                            workPriceGridCents: 34,
                            basePriceCents: 990))
    }

    func documentDownload(documentID: String) async throws -> BillingContracts.DocumentDownload {
        .init(url: URL(string: "https://example.invalid/demo.pdf")!,
              expiresAt: now.addingTimeInterval(300),
              fileName: "rechnung.pdf",
              mimeType: "application/pdf")
    }

    func notificationPreferences() async throws -> SettingsContracts.NotificationPreferences {
        .init(categories: [
            .init(category: .billing, enabled: true, locked: false),
            .init(category: .dataQuality, enabled: true, locked: false),
            .init(category: .incident, enabled: true, locked: true),
            .init(category: .service, enabled: false, locked: false),
            .init(category: .contract, enabled: true, locked: false),
        ])
    }

    func updateNotificationPreference(_ update: SettingsContracts.NotificationPreferenceUpdate) async throws {}
    func registerPushDevice(_ registration: SettingsContracts.PushDeviceRegistration) async throws {}
    func removePushDevice(token: String) async throws {}
    func sendSupportMessage(_ message: SettingsContracts.SupportMessage) async throws {}

    // MARK: Hilfen

    private func gauss(_ value: Double, _ mean: Double, _ spread: Double) -> Double {
        exp(-pow((value - mean) / spread, 2))
    }

    private func date(_ year: Int, _ month: Int, _ day: Int, hour: Int = 0) -> Date {
        DateComponents(calendar: .init(identifier: .gregorian),
                       timeZone: TimeZone(identifier: "UTC"),
                       year: year, month: month, day: day, hour: hour).date ?? .distantPast
    }

    private func invoice(number: String, month: Int, cents: Int) -> BillingContracts.InvoiceSummary {
        .init(id: "invoice-\(number)",
              number: number,
              periodStart: date(2026, month, 1),
              periodEnd: date(2026, month, 28),
              totalCents: cents,
              status: .paid)
    }
}
