import SwiftUI

/// Overlay "Messsystem" — meter fleet health plus the glossary of states.
struct MesssystemView: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let onBack: () -> Void

    @Environment(\.openOverlay) private var openOverlay

    private let devices: [(color: Color, name: String, state: String)] = [
        (Theme.ok, "PV-Zähler", "online · vor 1 Min"),
        (Theme.ok, "Netzanschlusszähler", "online · vor 1 Min"),
        (Theme.warn, "Wohnungszähler · 24 Stück", "23 online · WE 07 verzögert"),
        (Theme.ok, "Wärmepumpen-Zähler", "online · vor 3 Min"),
        (Theme.ok, "Batteriespeicher", "online · 74 %"),
        (Theme.ok, "Gateway · LoRaWAN", "Signal gut"),
        (Theme.ok, "Datenverbindung", "stabil · LTE-Backup bereit")
    ]

    private let glossary: [(term: String, meaning: String)] = [
        ("Online", "Zähler meldet sich im 15-Minuten-Takt."),
        ("Verzögert", "seit über 2 Stunden keine Daten, Verbindung wird neu aufgebaut."),
        ("Geschätzt", "Lücken werden nach Standardprofil ersetzt und später korrigiert."),
        ("Offline", "kein Kontakt seit 24 Stunden, Technik wird informiert."),
        ("Wartung", "geplanter Austausch oder Eichung steht an.")
    ]

    var body: some View {
        VStack(spacing: 0) {
            OverlayHeader(title: "Messsystem",
                          subtitle: "Letzter Empfang vor 2 Min · Gateway stabil",
                          onBack: onBack)

            ScrollView {
                VStack(spacing: 13) {
                    statusPills
                    warningCard
                    deviceList
                    glossaryCard
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
    }

    private var statusPills: some View {
        HStack(spacing: 9) {
            countTile("27", "online", Theme.ok, Theme.okS)
            countTile("1", "verzögert", Theme.warn, Theme.warnS)
            countTile("0", "offline", Theme.tx2, Theme.elev)
        }
    }

    private func countTile(_ value: String, _ label: String,
                           _ color: Color, _ background: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .pmFont(20, weight: .heavy)
                .foregroundStyle(color)
                .monospacedDigit()
            Text(label)
                .pmFont(11.5, weight: .semibold)
                .foregroundStyle(Theme.tx2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 13)
        .background(background, in: .rect(cornerRadius: Theme.radiusTile, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var warningCard: some View {
        VStack(alignment: .leading, spacing: 13) {
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Theme.warnS)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .pmFont(16, weight: .semibold)
                            .foregroundStyle(Theme.warn)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 3) {
                    Text("Wohnungszähler WE 07 verzögert")
                        .pmFont(14, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text("Letzter Wert vor 6 Stunden. Bis zur Verbindung werden die Werte nach Standardprofil geschätzt und danach automatisch korrigiert.")
                        .pmFont(12.5)
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .accessibilityElement(children: .combine)

            Button {
                openOverlay(.stoerungsfall)
            } label: {
                Text("Supportfall erstellen")
                    .pmFont(13.5, weight: .bold)
                    .foregroundStyle(Theme.btnT)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Theme.btn, in: .rect(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.pressable)
        }
        .padding(16)
        .pmCard()
    }

    private var deviceList: some View {
        VStack(spacing: 0) {
            ForEach(Array(devices.enumerated()), id: \.offset) { index, device in
                if index > 0 { Divider().overlay(Theme.line) }
                HStack(spacing: 10) {
                    Circle()
                        .fill(device.color)
                        .frame(width: 9, height: 9)
                        .accessibilityHidden(true)
                    Text(device.name)
                        .pmFont(13.5, weight: .semibold)
                        .foregroundStyle(Theme.tx)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(device.state)
                        .pmFont(11.5)
                        .foregroundStyle(Theme.tx3)
                }
                .padding(.vertical, 12)
                .accessibilityElement(children: .combine)
            }
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private var glossaryCard: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("Was bedeuten die Zustände?")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)
                .padding(.bottom, 2)

            ForEach(Array(glossary.enumerated()), id: \.offset) { _, entry in
                Group {
                    Text(entry.term).font(.pmScaled(12.5, weight: .bold, for: dynamicTypeSize))
                    + Text(" — ").font(.pmScaled(12.5, for: dynamicTypeSize))
                    + Text(entry.meaning).font(.pmScaled(12.5, for: dynamicTypeSize))
                }
                .foregroundStyle(Theme.tx2)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(16)
        .pmCard()
    }
}

#Preview {
    MesssystemView(onBack: {})
}
