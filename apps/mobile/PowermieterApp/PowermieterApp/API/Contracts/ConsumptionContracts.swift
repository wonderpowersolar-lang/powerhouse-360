import Foundation

/// Spiegel von `packages/api-contracts/src/app/consumption.ts`.
enum ConsumptionContracts {
    /// Auflösung der Zeitreihe — im Wire-Format kleingeschrieben.
    enum Resolution: String, Codable, CaseIterable {
        case hour, day, week, month, year
    }

    /// Dashboard-Aggregat. Alle Werte stammen aus `ConsumptionAggregate` bzw.
    /// `DeviceState`, nie aus Rohmesswerten.
    struct Summary: Decodable {
        struct LastReading: Decodable {
            let valueKwh: Kwh
            let ts: Date
        }

        /// Mittlere Wirkleistung über das letzte abgeschlossene Messintervall.
        /// Ausdrücklich kein Momentanwert — bei 15-Minuten-Messung gibt es
        /// keinen. `intervalMinutes` gehört ins Label.
        struct RecentPower: Decodable {
            let watts: Int
            let intervalEnd: Date
            let intervalMinutes: Int

            /// „3,2" für 3200 W.
            var kilowattsText: String {
                String(format: "%.1f", Double(watts) / 1000)
                    .replacingOccurrences(of: ".", with: ",")
            }
        }

        struct Today: Decodable {
            let kwh: Kwh
            let hasGaps: Bool
            let costCents: Int?
            /// Tagesbezogene Aufteilung; nil, wenn das Messkonzept sie nicht hergibt.
            let pvKwh: Kwh?
            let gridKwh: Kwh?

            /// Solaranteil des laufenden Tages in Prozent.
            var pvSharePercent: Int? {
                guard let pvKwh, let gridKwh else { return nil }
                let total = pvKwh.milli + gridKwh.milli
                guard total > 0 else { return nil }
                return Int((Double(pvKwh.milli) / Double(total) * 100).rounded())
            }
        }

        struct Month: Decodable {
            let kwh: Kwh
            let costCents: Int?
            let projectedMonthEndCents: Int?
            /// Vormonat, gleicher Zeitraumanteil auf Tagesbasis.
            let previousMonthKwh: Kwh?
            let deltaToPreviousMonthPct: Double?
        }

        /// MONATSBEZOGENE Aufteilung — der Tageswert steht in `today`.
        /// Nur befüllt, wenn das Messkonzept eine Aufteilung hergibt,
        /// sonst `available == false` und alle Werte `nil`.
        struct Split: Decodable {
            let available: Bool
            let pvKwh: Kwh?
            let gridKwh: Kwh?
            let savingsCents: Int?
        }

        struct DataStatus: Decodable {
            let lastReceivedAt: Date?
            let hasOpenGaps: Bool
            /// Werte noch vorläufig, weil Ersatzwerte enthalten sind.
            let isPreliminary: Bool
        }

        let lastReading: LastReading?
        let recentPower: RecentPower?
        let today: Today
        let month: Month
        let split: Split
        let dataStatus: DataStatus
    }

    struct Point: Decodable, Identifiable {
        let periodStart: Date
        let kwhTotal: Kwh
        let kwhPv: Kwh?
        let kwhGrid: Kwh?
        let costCents: Int?
        let hasGaps: Bool
        let isPreliminary: Bool

        var id: Date { periodStart }
    }

    /// `from`/`to` sind die effektiven Grenzen nach Teilnahme-Beschnitt,
    /// nicht zwingend die angefragten.
    struct Series: Decodable {
        let resolution: Resolution
        let from: Date
        let to: Date
        let points: [Point]
        let previousPeriodKwh: Kwh?
        let deltaToPreviousPeriodPct: Double?
        let avgPriceCentsPerKwh: Double?
        let savingsCents: Int?
    }

    struct DataStatus: Decodable {
        struct Gap: Decodable {
            let firstAt: Date
            let lastAt: Date
        }

        let lastReceivedAt: Date?
        let openGaps: [Gap]
        let disturbance: Bool
    }
}
