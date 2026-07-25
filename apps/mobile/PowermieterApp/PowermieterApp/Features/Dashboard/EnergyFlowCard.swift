import SwiftUI

/// "Energiefluss" card — a live diagram of PV → building ← grid, with the
/// apartment draw. The prototype layered animated SVG flow lines over a
/// building photo; here it's rendered natively (Canvas connectors + SF
/// Symbols) so it needs no bundled imagery.
struct EnergyFlowCard: View {
    @Environment(\.openSheet) private var openSheet

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            header
            diagram
                .frame(height: 250)
                .padding(.top, 4)
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
        .padding(.bottom, 12)
        .pmCard()
    }

    // MARK: Header row

    private var header: some View {
        HStack(spacing: 7) {
            Text("Energiefluss")
                .font(.system(size: 14.5, weight: .bold))
                .foregroundStyle(Theme.tx)
            Spacer(minLength: 0)
            Text("Jetzt")
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
            let center = CGPoint(x: w * 0.5, y: h * 0.48)
            let pv = CGPoint(x: w * 0.5, y: h * 0.12)
            let netz = CGPoint(x: w * 0.21, y: h * 0.52)
            let whg = CGPoint(x: w * 0.79, y: h * 0.46)

            ZStack {
                RadialGradient(colors: [Theme.acc.opacity(0.10), .clear],
                               center: .center, startRadius: 0, endRadius: w * 0.4)

                TimelineView(.animation(minimumInterval: 1.0 / 30.0, paused: reduceMotion)) { ctx in
                    let phase = reduceMotion ? 0 : -CGFloat(ctx.date.timeIntervalSinceReferenceDate * 34)
                        .truncatingRemainder(dividingBy: 52)
                    Canvas { canvas, _ in
                        drawFlow(canvas, from: center, to: pv, color: Theme.pv, phase: phase)
                        drawFlow(canvas, from: netz, to: center, color: Theme.grid, phase: phase)
                        drawFlow(canvas, from: center, to: whg, color: Theme.home, phase: phase)
                    }
                }

                buildingGlyph.position(center)

                nodePill(symbol: "sun.max.fill", tint: Theme.pv, label: "PV vom Dach", value: "4,6 kW", sheet: .node("pv"))
                    .position(pv)
                nodePill(symbol: "bolt.fill", tint: Theme.grid, label: "Netzstrom", value: "0,8 kW", sheet: .node("netz"))
                    .position(netz)
                nodePill(symbol: "house.fill", tint: Theme.home, label: "Wohnung", value: "3,2 kW", sheet: .node("whg"))
                    .position(whg)

                Text("76 % deines Stroms kommen gerade vom Dach · Tippe für Details")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.tx3)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .position(x: w * 0.5, y: h - 8)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Energiefluss: PV vom Dach 4,6 Kilowatt, Netzstrom 0,8 Kilowatt, Wohnung verbraucht 3,2 Kilowatt. 76 Prozent vom Dach.")
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
            HStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 0) {
                Text(label)
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.tx2)
                Text(value)
                    .font(.system(size: 14.5, weight: .heavy))
                    .foregroundStyle(Theme.tx)
                    .monospacedDigit()
            }
            .fixedSize()
        }
            .padding(.horizontal, 11).padding(.vertical, 8)
            .background(Theme.card2, in: .rect(cornerRadius: 14, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line2, lineWidth: 1) }
            .pmCardShadow()
        }
        .buttonStyle(.pressable)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    EnergyFlowCard().padding().background(Theme.bg)
}
