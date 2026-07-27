import SwiftUI

/// Overlay "Energiebilanz" — a Sankey of where today's kilowatt-hours came
/// from and went, the hourly source mix, and the reasoning behind it.
struct EnergiebilanzView: View {

    private struct Node {
        let label: String
        let value: Double
        let color: Color
    }

    private let sources: [Node] = [
        Node(label: "PV-Dach", value: 182, color: Theme.pv),
        Node(label: "Netzbezug", value: 41, color: Theme.grid),
        Node(label: "Speicher-Entladung", value: 38, color: Theme.bat)
    ]

    private let sinks: [Node] = [
        Node(label: "Wohnungen", value: 118, color: Theme.home),
        Node(label: "Wärmepumpe", value: 57, color: Theme.wp),
        Node(label: "Einspeisung", value: 33, color: Theme.feed),
        Node(label: "Allgemeinstrom", value: 22, color: Theme.grid),
        Node(label: "Ladepunkte", value: 16, color: Theme.bat),
        Node(label: "Speicher-Ladung", value: 15, color: Theme.batS)
    ]

    /// (source index, sink index, kWh) — column sums match the node values.
    private let flows: [(Int, Int, Double)] = [
        (0, 0, 82), (0, 1, 34), (0, 2, 33), (0, 3, 12), (0, 4, 11), (0, 5, 10),
        (1, 0, 11), (1, 1, 10), (1, 3, 10), (1, 4, 5), (1, 5, 5),
        (2, 0, 25), (2, 1, 13)
    ]

    private let total: Double = 261

    var body: some View {
        VStack(spacing: 0) {

            ScrollView {
                VStack(spacing: 12) {
                    sankeyCard
                    hourlyMixCard
                    batteryOriginCard
                    reasoningCard
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .scrollIndicators(.hidden)
        }
        .background(Theme.bg)
        .pmOverlayChrome(title: "Energiebilanz", subtitle: "Wohnung 12 · heute")
    }

    // MARK: Sankey

    private var sankeyCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Woher & wohin")
                    .pmFont(14.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Spacer()
                StatusPill(text: "Heute", color: Theme.tx2, background: Theme.elev, horizontalPadding: 8)
            }

            Canvas { context, size in
                drawSankey(in: &context, size: size)
            }
            .frame(height: 210)
            .padding(.top, 12)
            .accessibilityElement()
            .accessibilityLabel("Energieflüsse heute")
            .accessibilityValue("261 Kilowattstunden gesamt, davon 182 vom Dach, 41 aus dem Netz, 38 aus dem Speicher")

            HStack(alignment: .top, spacing: 16) {
                nodeLegend(title: "Quellen", nodes: sources)
                nodeLegend(title: "Verbraucher", nodes: sinks)
            }
            .padding(.top, 16)

            HintNote(symbol: "info.circle",
                     text: "Flüsse seit 0:00 Uhr. Erzeugung und Netz sind Messwerte, die Aufteilung des Speicherstroms ist berechnet.")
                .padding(.top, 12)
        }
        .padding(16)
        .pmCard()
    }

    private func nodeLegend(title: String, nodes: [Node]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .pmFont(10.5, weight: .bold)
                .tracking(0.6)
                .foregroundStyle(Theme.tx3)

            ForEach(Array(nodes.enumerated()), id: \.offset) { _, node in
                HStack(spacing: 6) {
                    Circle().fill(node.color).frame(width: 7, height: 7)
                        .accessibilityHidden(true)
                    Text(node.label)
                        .pmFont(11.5)
                        .foregroundStyle(Theme.tx2)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(Int(node.value))")
                        .pmFont(11.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                        .monospacedDigit()
                }
                .accessibilityElement(children: .combine)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func drawSankey(in context: inout GraphicsContext, size: CGSize) {
        let nodeWidth: CGFloat = 7
        let gap: CGFloat = 6
        let leftX: CGFloat = 0
        let rightX = size.width - nodeWidth

        func offsets(_ nodes: [Node]) -> [(start: CGFloat, height: CGFloat)] {
            let usable = size.height - gap * CGFloat(nodes.count - 1)
            var y: CGFloat = 0
            return nodes.map { node in
                let height = usable * CGFloat(node.value / total)
                defer { y += height + gap }
                return (start: y, height: height)
            }
        }

        let sourceBox = offsets(sources)
        let sinkBox = offsets(sinks)

        // Running cursor per node so consecutive ribbons stack up.
        var sourceCursor = sourceBox.map(\.start)
        var sinkCursor = sinkBox.map(\.start)

        for (sourceIndex, sinkIndex, value) in flows {
            let sourceThickness = sourceBox[sourceIndex].height * CGFloat(value / sources[sourceIndex].value)
            let sinkThickness = sinkBox[sinkIndex].height * CGFloat(value / sinks[sinkIndex].value)

            let y0 = sourceCursor[sourceIndex]
            let y1 = sinkCursor[sinkIndex]
            sourceCursor[sourceIndex] += sourceThickness
            sinkCursor[sinkIndex] += sinkThickness

            let x0 = leftX + nodeWidth
            let x1 = rightX
            let controlA = x0 + (x1 - x0) * 0.45
            let controlB = x0 + (x1 - x0) * 0.55

            var ribbon = Path()
            ribbon.move(to: CGPoint(x: x0, y: y0))
            ribbon.addCurve(to: CGPoint(x: x1, y: y1),
                            control1: CGPoint(x: controlA, y: y0),
                            control2: CGPoint(x: controlB, y: y1))
            ribbon.addLine(to: CGPoint(x: x1, y: y1 + sinkThickness))
            ribbon.addCurve(to: CGPoint(x: x0, y: y0 + sourceThickness),
                            control1: CGPoint(x: controlB, y: y1 + sinkThickness),
                            control2: CGPoint(x: controlA, y: y0 + sourceThickness))
            ribbon.closeSubpath()

            context.fill(ribbon, with: .color(sources[sourceIndex].color.opacity(0.3)))
        }

        for (index, node) in sources.enumerated() {
            let rect = CGRect(x: leftX, y: sourceBox[index].start,
                              width: nodeWidth, height: sourceBox[index].height)
            context.fill(Path(roundedRect: rect, cornerRadius: nodeWidth / 2), with: .color(node.color))
        }
        for (index, node) in sinks.enumerated() {
            let rect = CGRect(x: rightX, y: sinkBox[index].start,
                              width: nodeWidth, height: sinkBox[index].height)
            context.fill(Path(roundedRect: rect, cornerRadius: nodeWidth / 2), with: .color(node.color))
        }
    }

    // MARK: Hourly source mix

    private var hourlyMixCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                Text("Quellen im Tagesverlauf")
                    .pmFont(14.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                    .frame(maxWidth: .infinity, alignment: .leading)
                mixLegend("Solar", Theme.pv)
                mixLegend("Speicher", Theme.bat)
                mixLegend("Netz", Theme.grid)
            }

            Canvas { context, size in
                let slot = size.width / 24
                for hour in 0..<24 {
                    let h = Double(hour)
                    let demand = 0.3 + 0.5 * exp(-pow((h - 7.5) / 1.6, 2))
                        + 0.85 * exp(-pow((h - 19.5) / 2.2, 2)) + 0.2 * exp(-pow((h - 13) / 3.4, 2))
                    let solar = min(demand, 1.1 * exp(-pow((h - 13) / 3.1, 2)))
                    let battery = min(demand - solar, (h >= 17 || h <= 6) ? 0.3 : 0.05)
                    let grid = max(0, demand - solar - battery)

                    var y = size.height
                    for (value, color) in [(grid, Theme.grid), (battery, Theme.bat), (solar, Theme.pv)] {
                        let height = CGFloat(value / 1.4) * (size.height - 6)
                        guard height > 0.5 else { continue }
                        let rect = CGRect(x: slot * CGFloat(hour) + slot / 2 - 4.3,
                                          y: y - height, width: 8.6, height: height)
                        context.fill(Path(roundedRect: rect, cornerRadius: 1.5), with: .color(color))
                        y -= height
                    }
                }
            }
            .frame(height: 120)
            .padding(.top, 12)
            .accessibilityElement()
            .accessibilityLabel("Stündliche Zusammensetzung des verbrauchten Stroms")
            .accessibilityValue("Mittags fast vollständig Solar, abends Speicher und Netz")

            HStack(spacing: 0) {
                ForEach(["00", "06", "12", "18", "24"], id: \.self) { label in
                    Text(label)
                        .pmFont(11)
                        .foregroundStyle(Theme.tx3)
                    if label != "24" { Spacer(minLength: 0) }
                }
            }
            .padding(.top, 6)
            .accessibilityHidden(true)

            Text("So setzte sich der verbrauchte Strom stündlich zusammen.")
                .pmFont(11.5)
                .foregroundStyle(Theme.tx3)
                .padding(.top, 8)
        }
        .padding(16)
        .pmCard()
    }

    private func mixLegend(_ label: String, _ color: Color) -> some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .pmFont(11)
                .foregroundStyle(Theme.tx2)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: Battery origin

    private var batteryOriginCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("Speicher-Ladung · Herkunft")
                    .pmFont(14.5, weight: .bold)
                    .foregroundStyle(Theme.tx)
                Spacer()
                StatusPill(text: "grün geladen", color: Theme.ok, background: Theme.okS, horizontalPadding: 8)
            }

            HStack(spacing: 4) {
                GeometryReader { geo in
                    HStack(spacing: 4) {
                        Capsule().fill(Theme.pv)
                            .frame(width: max(0, (geo.size.width - 3) * 0.86))
                        Capsule().fill(Theme.grid)
                    }
                }
            }
            .frame(height: 10)
            .padding(.top, 12)

            HStack(spacing: 12) {
                mixLegend("Solar 86 %", Theme.pv)
                mixLegend("Netz 14 %", Theme.grid)
                Spacer(minLength: 0)
                Text("Stand 74 % · 106 kWh")
                    .pmFont(11.5, weight: .semibold)
                    .foregroundStyle(Theme.tx2)
                    .monospacedDigit()
            }
            .padding(.top, 8)
        }
        .padding(16)
        .pmCard()
        .accessibilityElement(children: .combine)
    }

    // MARK: Reasoning

    private var reasoningCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Systemlogik · Warum passiert das?")
                .pmFont(14.5, weight: .bold)
                .foregroundStyle(Theme.tx)
                .padding(.bottom, 4)

            reasonRow(color: Theme.pv,
                      title: "Direktverbrauch zuerst",
                      body: "Solarstrom deckt immer zuerst den laufenden Bedarf im Haus — das ist die günstigste Kilowattstunde.",
                      time: "ganztägig")
            reasonRow(color: Theme.bat,
                      title: "Speicher lädt aus Überschuss",
                      body: "Erst wenn mehr erzeugt als verbraucht wird, geht der Rest in den Speicher.",
                      time: "ab 09:40")
            reasonRow(color: Theme.feed,
                      title: "Einspeisung als Letztes",
                      body: "Ist auch der Speicher voll, fließt der Überschuss ins Netz und wird vergütet.",
                      time: "ab 12:10")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .pmCard()
    }

    private func reasonRow(color: Color, title: String, body: String, time: String) -> some View {
        VStack(spacing: 0) {
            Divider().overlay(Theme.line)
            HStack(alignment: .top, spacing: 12) {
                Circle()
                    .fill(color)
                    .frame(width: 9, height: 9)
                    .padding(.top, 4)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .pmFont(13.5, weight: .bold)
                        .foregroundStyle(Theme.tx)
                    Text(body)
                        .pmFont(12)
                        .foregroundStyle(Theme.tx2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Text(time)
                    .pmFont(11)
                    .foregroundStyle(Theme.tx3)
                    .monospacedDigit()
            }
            .padding(.vertical, 12)
            .accessibilityElement(children: .combine)
        }
    }
}

#Preview {
    EnergiebilanzView()
}
