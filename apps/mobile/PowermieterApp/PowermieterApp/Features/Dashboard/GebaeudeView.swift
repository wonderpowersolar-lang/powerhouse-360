import SwiftUI

/// Gebäude — the building tab for the Vermieter and Verwaltung roles
/// (prototype `tabGeb`). No image assets exist, so the header photo is
/// rendered natively as a gradient plus SF Symbol glyph.
struct GebaeudeView: View {
    @Environment(\.openOverlay) private var openOverlay
    @Environment(\.openSheet) private var openSheet

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView {
                VStack(spacing: 13) {
                    heroCard
                    statusGrid
                    tasksCard
                    actionTiles
                    energyReportRow
                    monthReportRow
                }
                .padding(.horizontal, 18)
                .padding(.top, 104)
                .padding(.bottom, 108)
            }
            .scrollIndicators(.hidden)

            DashboardHeader(greeting: "Gebäude",
                            subtitle: "Friedrichsruher Str. 35 · 24 Einheiten",
                            unreadCount: 0)
        }
        .background(Theme.bg)
    }

    // MARK: Hero card

    private var heroCard: some View {
        Button { openSheet(.building) } label: {
            VStack(spacing: 0) {
                heroBanner
                heroInfo
            }
        }
        .buttonStyle(.pressable)
        .background(Theme.card, in: .rect(cornerRadius: Theme.radiusCard, style: .continuous))
        .clipShape(.rect(cornerRadius: Theme.radiusCard, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: Theme.radiusCard, style: .continuous)
                .strokeBorder(Theme.line, lineWidth: 1)
        }
        .pmCardShadow()
    }

    /// Native stand-in for the prototype's building photo.
    private var heroBanner: some View {
        ZStack {
            LinearGradient(colors: [Theme.home.opacity(0.28), Theme.card2],
                           startPoint: .top, endPoint: .bottom)
            Image(systemName: "building.2.fill")
                .font(.system(size: 54))
                .foregroundStyle(Theme.home.opacity(0.55))
            LinearGradient(colors: [.clear, Theme.card],
                           startPoint: .center, endPoint: .bottom)
        }
        .frame(height: 116)
        .frame(maxWidth: .infinity)
        .accessibilityHidden(true)
    }

    private var heroInfo: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Friedrichsruher Straße 35")
                .font(.system(size: 16.5, weight: .heavy))
                .foregroundStyle(Theme.tx)

            Text("14193 Berlin · Baujahr 1998 · saniert 2024")
                .font(.system(size: 12.5))
                .foregroundStyle(Theme.tx2)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 7) {
                    pill("24 Wohneinheiten", Theme.tx2, Theme.elev)
                    pill("PV 52,9 kWp", Theme.pv, Theme.pvS)
                    Spacer()
                }
                HStack(spacing: 7) {
                    pill("Speicher 144 kWh", Theme.bat, Theme.batS)
                    pill("Wärmepumpe", Theme.wp, Theme.wpS)
                    Spacer()
                }
            }
            .padding(.top, 11)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 16)
    }

    private func pill(_ text: String, _ color: Color, _ background: Color) -> some View {
        StatusPill(text: text, color: color, background: background)
    }

    // MARK: Status grid

    private var statusGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            statusTile(caption: "Anlagenstatus") {
                HStack(spacing: 7) {
                    Circle()
                        .fill(Theme.ok)
                        .frame(width: 9, height: 9)
                        .accessibilityHidden(true)
                    Text("In Ordnung")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(Theme.tx)
                }
                tileFooter("Wechselrichter · Speicher · WP")
            }

            Button { openOverlay(.messsystem) } label: {
                statusTile(caption: "Messsystem") {
                    HStack(spacing: 7) {
                        PulseDot(color: Theme.warn, size: 9)
                        Text("27 / 28 online")
                            .font(.system(size: 14.5, weight: .bold))
                            .foregroundStyle(Theme.tx)
                    }
                    Text("Status ansehen →")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Theme.acc)
                }
            }
            .buttonStyle(.pressable)
            .accessibilityElement(children: .combine)

            statusTile(caption: "Batteriespeicher") {
                Text("74 % · lädt")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.elev)
                    GeometryReader { geo in
                        Capsule()
                            .fill(Theme.bat)
                            .frame(width: geo.size.width * 0.74)
                    }
                }
                .frame(height: 7)
                .accessibilityElement()
                .accessibilityLabel("Batteriespeicher")
                .accessibilityValue("74 Prozent, lädt")
            }

            statusTile(caption: "Letzter Datenempfang") {
                HStack(spacing: 7) {
                    PulseDot(color: Theme.acc, size: 9)
                    Text("vor 2 Min")
                        .font(.system(size: 14.5, weight: .bold))
                        .foregroundStyle(Theme.tx)
                }
                tileFooter("Gateway LoRaWAN · stabil")
            }
        }
    }

    private func statusTile<Content: View>(caption: String,
                                           @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(caption)
                .font(.system(size: 12))
                .foregroundStyle(Theme.tx2)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .pmCard(cornerRadius: Theme.radiusTile)
    }

    private func tileFooter(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11))
            .foregroundStyle(Theme.tx3)
    }

    // MARK: Offene Aufgaben

    private var tasksCard: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Offene Aufgaben")
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Spacer()
                Text("3")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Theme.tx2)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(Theme.elev, in: .capsule)
            }
            .padding(.top, 11)
            .padding(.bottom, 7)

            Divider().overlay(Theme.line)

            taskRow(dotColor: Theme.warn,
                    title: "Zähler WE 07 prüfen",
                    subtitle: "verzögert seit 6 Std",
                    target: .stoerungsfall)

            Divider().overlay(Theme.line)

            taskRow(dotColor: Theme.info,
                    title: "SEPA-Mandat WE 14",
                    subtitle: "Erinnerung senden",
                    target: .support)

            Divider().overlay(Theme.line)

            taskRow(dotColor: Theme.tx3,
                    title: "Unterschrift WE 03",
                    subtitle: "Vertragsänderung offen",
                    target: .support)
        }
        .padding(.horizontal, 16)
        .pmCard()
    }

    private func taskRow(dotColor: Color, title: String, subtitle: String,
                         target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            HStack(spacing: 11) {
                Circle()
                    .fill(dotColor)
                    .frame(width: 9, height: 9)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundStyle(Theme.tx)
                    Text(subtitle)
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.vertical, 11)
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Action tiles

    private var actionTiles: some View {
        HStack(spacing: 12) {
            actionTile(title: "Wohneinheiten", caption: "21 aktiv · 1 Warnung",
                       target: .wohneinheiten)
            actionTile(title: "Verbrauchsaufteilung", caption: "Juli · nach Kategorie",
                       target: .verbrauchsaufteilung)
        }
    }

    private func actionTile(title: String, caption: String, target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            VStack(alignment: .leading, spacing: 7) {
                Text(title)
                    .font(.system(size: 13.5, weight: .bold))
                    .foregroundStyle(Theme.tx)
                Text(caption)
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.tx3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .pmCard(cornerRadius: Theme.radiusTile)
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Report rows

    private var energyReportRow: some View {
        reportRow(background: Theme.feedS,
                  symbol: "waveform.path",
                  tint: Theme.feed,
                  title: "Energiebilanz heute",
                  subtitle: "Woher jede Kilowattstunde kam – und wohin sie ging",
                  target: .energiebilanz)
    }

    private var monthReportRow: some View {
        reportRow(background: Theme.infoS,
                  symbol: "doc.text.fill",
                  tint: Theme.info,
                  title: "Monatsreport Gebäude · Juni",
                  subtitle: "PDF-Export für Eigentümerversammlung",
                  target: .monatsreport)
    }

    private func reportRow(background: Color,
                           symbol: String,
                           tint: Color,
                           title: String,
                           subtitle: String,
                           target: AppOverlay) -> some View {
        Button { openOverlay(target) } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(background)
                    .frame(width: 38, height: 38)
                    .overlay {
                        Image(systemName: symbol)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(tint)
                    }
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Theme.tx)
                    Text(subtitle)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Theme.tx3)
                    .accessibilityHidden(true)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .pmCard()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    GebaeudeView()
}
