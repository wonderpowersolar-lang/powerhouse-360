import SwiftUI

/// Overlay "Monatsreport" — the June summary with recommendations.
struct MonatsreportView: View {

    @Environment(\.showToast) private var showToast

    private let isTenant = true

    private var rows: [(label: String, value: String, delta: String, isGood: Bool)] {
        if isTenant {
            [("Verbrauch", "196 kWh", "−6 %", true),
             ("Davon Solarstrom", "149 kWh", "+4 Pkt.", true),
             ("Netzbezug", "47 kWh", "−18 %", true),
             ("Stromkosten", "51,40 €", "−8 %", true),
             ("Ersparnis ggü. Grundversorgung", "24,65 €", "+3,10 €", true)]
        } else {
            [("Erzeugung", "4,2 MWh", "+11 %", true),
             ("Direktverbrauch", "2,9 MWh", "+6 %", true),
             ("Einspeisung", "1,3 MWh", "+21 %", true),
             ("Mieterstromerlöse", "1.048 €", "+7 %", true),
             ("Anlagenverfügbarkeit", "99,4 %", "−0,2 Pkt.", false)]
        }
    }

    private var recommendations: [(title: String, body: String)] {
        if isTenant {
            [("Wäsche mittags waschen",
              "Zwischen 11 und 15 Uhr liegt dein Solaranteil bei über 90 %. Zwei Waschgänge pro Woche in dieses Fenster zu verschieben spart rund 3 € im Monat."),
             ("Standby im Blick behalten",
              "Dein Grundverbrauch nachts liegt bei 96 Watt. Das sind etwa 8 % deiner Monatsrechnung.")]
        } else {
            [("Speicherfenster nachschärfen",
              "Der Speicher lädt an fünf Tagen bereits vormittags voll und steht mittags ungenutzt. Ein späterer Ladestart erhöht den Eigenverbrauch um geschätzt 4 %."),
             ("WE 07 Zähler prüfen",
              "Seit Juni fehlen wiederholt Messwerte. Solange wird nach Standardprofil geschätzt, was die Abrechnung verzögern kann.")]
        }
    }

    var body: some View {
        VStack(spacing: 0) {

            ScrollView {
                VStack(spacing: 12) {
                    summaryCard

                    Text("Empfehlungen")
                        .pmFont(14.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 4)

                    ForEach(Array(recommendations.enumerated()), id: \.offset) { _, item in
                        recommendationCard(item)
                    }

                    downloadButton
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .pmOverlayChrome(title: isTenant ? "Monatsreport Juni" : "Monatsreport Gebäude · Juni", subtitle: isTenant ? "Wohnung 12 · 01.–30.06.2026" : "Friedrichsruher Str. 35 · 01.–30.06.2026")
    }

    private var summaryCard: some View {
        VStack(spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.label)
                            .pmFont(12.5)
                            .foregroundStyle(Theme.tx2)
                        Text(row.value)
                            .pmFont(16, weight: .heavy)
                            .foregroundStyle(Theme.tx)
                            .monospacedDigit()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    StatusPill(text: row.delta,
                               color: row.isGood ? Theme.ok : Theme.warn,
                               background: row.isGood ? Theme.okS : Theme.warnS)
                }
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }

            Divider().overlay(Theme.line)

            Text(isTenant
                 ? "Im laufenden Jahr hast du bereits 148,20 € gegenüber der Grundversorgung gespart."
                 : "Im laufenden Jahr wurden 21,6 MWh erzeugt und 6.240 € Mieterstromerlöse erzielt.")
                .pmFont(12)
                .foregroundStyle(Theme.tx3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 12)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func recommendationCard(_ item: (title: String, body: String)) -> some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Theme.accS)
                .frame(width: 38, height: 38)
                .overlay {
                    Image(systemName: "lightbulb.fill")
                        .pmFont(16, weight: .semibold)
                        .foregroundStyle(Theme.acc)
                }
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .pmFont(14, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Text(item.body)
                    .pmFont(12.5)
                    .foregroundStyle(Theme.tx2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    private var downloadButton: some View {
        Button { showToast("Download gestartet …") } label: {
            HStack(spacing: 8) {
                Image(systemName: "arrow.down.circle")
                    .pmFont(15, weight: .semibold)
                    .accessibilityHidden(true)
                Text("Als PDF herunterladen")
                    .pmFont(14, weight: .bold)
            }
            .foregroundStyle(Theme.btnT)
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(Theme.btn, in: .rect(cornerRadius: Theme.radiusButton))
        }
        .buttonStyle(.pressable)
        .accessibilityLabel("Als PDF herunterladen")
    }
}

#Preview {
    MonatsreportView()
}
