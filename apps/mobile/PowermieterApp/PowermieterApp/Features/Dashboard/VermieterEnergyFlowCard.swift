import SwiftUI

/// "Energiefluss · Gebäude" card — the landlord/owner (Vermieter) view of the
/// whole-building energy flow. Where `EnergyFlowCard` shows a single
/// apartment's PV → home ← grid triangle, this fans six building-scale nodes
/// (PV, feed-in, building load, storage, heat pump, wallbox) around a central
/// building glyph, with animated Canvas connectors — no bundled imagery.
struct VermieterEnergyFlowCard: View {
    @Environment(\.openSheet) private var openSheet

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            header
            diagram
                .frame(height: 272)
                .padding(.top, 4)
            footer
                .padding(.top, 2)
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
        .padding(.bottom, 12)
        .pmCard()
    }

    // MARK: Header row

    private var header: some View {
        HStack(spacing: 7) {
            Text("Energiefluss · Gebäude")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)
            Spacer(minLength: 0)
            Text("Live")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.acc)
                .padding(.horizontal, 9).padding(.vertical, 4)
                .background(Theme.accS, in: .capsule)
            Text("Bilanz")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.btnT)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background(Theme.btn, in: .capsule)
        }
    }

    // MARK: Diagram

    private var diagram: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let center = CGPoint(x: w * 0.5, y: h * 0.5)
            let pv = CGPoint(x: w * 0.5, y: h * 0.11)
            let feed = CGPoint(x: w * 0.17, y: h * 0.36)
            let gebaeude = CGPoint(x: w * 0.83, y: h * 0.34)
            let speicher = CGPoint(x: w * 0.18, y: h * 0.66)
            let wp = CGPoint(x: w * 0.82, y: h * 0.66)
            let wallbox = CGPoint(x: w * 0.5, y: h * 0.9)

            ZStack {
                RadialGradient(colors: [Theme.acc.opacity(0.10), .clear],
                               center: .center, startRadius: 0, endRadius: w * 0.42)

                TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion)) { ctx in
                    let phase = reduceMotion ? 0 : -CGFloat(ctx.date.timeIntervalSinceReferenceDate * 34)
                        .truncatingRemainder(dividingBy: 52)
                    Canvas { canvas, _ in
                        drawFlow(canvas, from: center, to: pv, color: Theme.pv, phase: phase)
                        drawFlow(canvas, from: center, to: feed, color: Theme.feed, phase: phase)
                        drawFlow(canvas, from: center, to: gebaeude, color: Theme.home, phase: phase)
                        drawFlow(canvas, from: center, to: speicher, color: Theme.bat, phase: phase)
                        drawFlow(canvas, from: center, to: wp, color: Theme.wp, phase: phase)
                        drawFlow(canvas, from: center, to: wallbox, color: Theme.feed, phase: phase)
                    }
                }

                buildingGlyph.position(center)

                nodePill(symbol: "sun.max.fill", tint: Theme.pv, label: "PV-Anlage", value: "18,6 kW", sheet: .node("pv"))
                    .position(pv)
                nodePill(symbol: "arrow.up.forward", tint: Theme.feed, label: "Einspeisung", value: "3,4 kW", sheet: .node("netz"))
                    .position(feed)
                nodePill(symbol: "house.fill", tint: Theme.home, label: "Gebäude", value: "12,8 kW", sheet: .node("geb"))
                    .position(gebaeude)
                nodePill(symbol: "battery.75percent", tint: Theme.bat, label: "Speicher · lädt", value: "74 %", sheet: .node("bat"))
                    .position(speicher)
                nodePill(symbol: "heat.waves", tint: Theme.wp, label: "Wärmepumpe", value: "2,4 kW", sheet: .node("wp"))
                    .position(wp)
                nodePill(symbol: "ev.charger.fill", tint: Theme.feed, label: "Wallbox · 2 aktiv", value: "1,7 kW", sheet: .node("wb"))
                    .position(wallbox)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Energiefluss Gebäude: PV-Anlage 18,6 Kilowatt, Einspeisung 3,4 Kilowatt, Gebäudeverbrauch 12,8 Kilowatt, Speicher lädt bei 74 Prozent, Wärmepumpe 2,4 Kilowatt, Wallbox mit 2 aktiven Ladepunkten 1,7 Kilowatt.")
    }

    private func drawFlow(_ canvas: GraphicsContext, from: CGPoint, to: CGPoint, color: Color, phase: CGFloat) {
        let control = CGPoint(x: (from.x + to.x) / 2 + (to.y - from.y) * 0.18,
                              y: (from.y + to.y) / 2)
        var path = Path()
        path.move(to: from)
        path.addQuadCurve(to: to, control: control)

        canvas.stroke(path, with: .color(color.opacity(0.16)), lineWidth: 6)
        canvas.stroke(path, with: .color(color),
                      style: StrokeStyle(lineWidth: 2.4, lineCap: .round, dash: [5, 8], dashPhase: phase))
        canvas.fill(Path(ellipseIn: CGRect(x: to.x - 3, y: to.y - 3, width: 6, height: 6)),
                    with: .color(color))
    }

    private var buildingGlyph: some View {
        Image(systemName: "building.2.fill")
            .font(.system(size: 46, weight: .regular))
            .foregroundStyle(Theme.home)
            .frame(width: 84, height: 84)
            .background(Theme.card2, in: .circle)
            .overlay { Circle().strokeBorder(Theme.line2, lineWidth: 1) }
            .pmCardShadow()
    }

    private func nodePill(symbol: String, tint: Color, label: String,
                          value: String, sheet: AppSheet) -> some View {
        Button { openSheet(sheet) } label: {
            HStack(spacing: 7) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 0) {
                Text(label)
                    .font(.system(size: 9.5))
                    .foregroundStyle(Theme.tx2)
                Text(value)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
            }
            .fixedSize()
        }
            .padding(.horizontal, 10).padding(.vertical, 7)
            .background(Theme.card2, in: .rect(cornerRadius: 13, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(Theme.line2, lineWidth: 1) }
            .pmCardShadow()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }

    // MARK: Footer

    private var footer: some View {
        HStack(spacing: 7) {
            Circle().fill(Theme.grid).frame(width: 8, height: 8)
            Text("Netzbezug aktuell 0,0 kW — das Gebäude läuft solar.")
                .font(.system(size: 11.5))
                .foregroundStyle(Theme.tx3)
        }
    }
}

#Preview {
    VermieterEnergyFlowCard().padding().background(Theme.bg)
}
