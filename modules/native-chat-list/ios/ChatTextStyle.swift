import UIKit

/**
 * One entry of the JS text style table, with the font and colour resolved.
 * Immutable, so the layout queue and the main thread can share it.
 */
struct ChatTextStyle {
  let font: UIFont
  let tabularFont: UIFont
  let color: UIColor
  let letterSpacing: CGFloat
  let lineHeight: CGFloat
  let opacity: CGFloat
  let strikethrough: Bool
  let underline: Bool

  static let fallback = ChatTextStyle(record: ChatTextStyleRecord())

  init(record: ChatTextStyleRecord) {
    let size = CGFloat(record.fontSize)
    let font = record.fontFamily.flatMap { UIFont(name: $0, size: size) } ?? UIFont.systemFont(ofSize: size)

    self.font = font
    tabularFont = Self.tabular(font)
    color = ChatColor.parse(record.color) ?? .white
    letterSpacing = CGFloat(record.letterSpacing)
    lineHeight = CGFloat(record.lineHeight)
    opacity = CGFloat(record.opacity)
    strikethrough = record.strikethrough
    underline = record.underline
  }

  /**
   * Timestamps use `tabular-nums` in `ChatText`, so every digit has the same
   * width and the column does not shift.
   */
  private static func tabular(_ font: UIFont) -> UIFont {
    let feature: [UIFontDescriptor.FeatureKey: Int] = [
      .type: kNumberSpacingType,
      .selector: kMonospacedNumbersSelector
    ]

    let descriptor = font.fontDescriptor.addingAttributes([.featureSettings: [feature]])
    return UIFont(descriptor: descriptor, size: font.pointSize)
  }
}
