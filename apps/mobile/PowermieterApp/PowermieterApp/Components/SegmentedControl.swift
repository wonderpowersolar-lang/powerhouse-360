import SwiftUI

/// The pill segmented control used for period, sort and day switches
/// (prototype `seg()` helper).
struct SegmentedControl<Value: Hashable>: View {
    let options: [Value]
    let title: (Value) -> String
    @Binding var selection: Value

    var height: CGFloat = 34
    var fontSize: CGFloat = 12.5
    var cornerRadius: CGFloat = 10

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options, id: \.self) { option in
                let active = option == selection
                Button {
                    selection = option
                } label: {
                    Text(title(option))
                        .font(.system(size: fontSize, weight: .bold))
                        .foregroundStyle(active ? Theme.btnT : Theme.tx2)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .frame(maxWidth: .infinity)
                        .frame(height: height)
                        .background {
                            if active {
                                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                                    .fill(Theme.btn)
                            }
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(title(option))
                .accessibilityAddTraits(active ? [.isSelected, .isButton] : .isButton)
            }
        }
        .padding(3)
        .pmCard(cornerRadius: cornerRadius + 3)
    }
}
