import UIKit

/**
 * Parses the colour strings the JS theme produces: `#RGB`, `#RRGGBB`,
 * `#RRGGBBAA`, `rgb(...)` and `rgba(...)`.
 */
enum ChatColor {
  static func parse(_ value: String?) -> UIColor? {
    guard let raw = value?.trimmingCharacters(in: .whitespaces), !raw.isEmpty else {
      return nil
    }

    if raw.hasPrefix("#") {
      return parseHex(String(raw.dropFirst()))
    }

    if raw.hasPrefix("rgb") {
      return parseRgb(raw)
    }

    return nil
  }

  private static func parseHex(_ hex: String) -> UIColor? {
    var expanded = hex

    if hex.count == 3 {
      expanded = hex.map { "\($0)\($0)" }.joined()
    }

    guard expanded.count == 6 || expanded.count == 8, let value = UInt64(expanded, radix: 16) else {
      return nil
    }

    let hasAlpha = expanded.count == 8
    let red = CGFloat((value >> (hasAlpha ? 24 : 16)) & 0xFF) / 255
    let green = CGFloat((value >> (hasAlpha ? 16 : 8)) & 0xFF) / 255
    let blue = CGFloat((value >> (hasAlpha ? 8 : 0)) & 0xFF) / 255
    let alpha = hasAlpha ? CGFloat(value & 0xFF) / 255 : 1

    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }

  private static func parseRgb(_ raw: String) -> UIColor? {
    guard let open = raw.firstIndex(of: "("), let close = raw.lastIndex(of: ")") else {
      return nil
    }

    let components = raw[raw.index(after: open) ..< close]
      .split(separator: ",")
      .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }

    guard components.count >= 3 else {
      return nil
    }

    return UIColor(
      red: CGFloat(components[0]) / 255,
      green: CGFloat(components[1]) / 255,
      blue: CGFloat(components[2]) / 255,
      alpha: components.count > 3 ? CGFloat(components[3]) : 1
    )
  }
}
