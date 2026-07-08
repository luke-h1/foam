import CoreGraphics
import UIKit

struct NativePaintStop {
  let color: UIColor
  let at: CGFloat
}

struct NativePaintShadow {
  let color: UIColor
  let radius: CGFloat
  let xOffset: CGFloat
  let yOffset: CGFloat
}

struct NativePaintLayer {
  enum Function: String {
    case linear = "LINEAR_GRADIENT"
    case radial = "RADIAL_GRADIENT"
    case url = "URL"
  }

  let function: Function
  let stops: [NativePaintStop]
  let angle: CGFloat
  let shape: String
  let repeatGradient: Bool
  let imageURL: String
  let canvasRepeat: String
  let at: CGPoint?
  let size: CGSize?
  let opacity: CGFloat
}

struct NativePaintTextStyle {
  let weight: CGFloat?
  let transform: String?
  let stroke: (color: UIColor, width: CGFloat)?
  let shadows: [NativePaintShadow]
}

struct NativePaintDefinition {
  let color: UIColor?
  let layers: [NativePaintLayer]
  let dropShadows: [NativePaintShadow]
  let textStyle: NativePaintTextStyle?
}

enum PaintDefinitionParser {
  static func parse(_ payload: [String: Any]?) -> NativePaintDefinition? {
    guard let payload else {
      return nil
    }

    let color = parseColorValue(payload["color"])
    let layers = parseLayers(payload["layers"])
    let dropShadows = parseShadows(payload["dropShadows"])
    let textStyle = parseTextStyle(payload["textStyle"])

    return NativePaintDefinition(
      color: color,
      layers: layers,
      dropShadows: dropShadows,
      textStyle: textStyle
    )
  }

  private static func parseLayers(_ value: Any?) -> [NativePaintLayer] {
    guard let array = value as? [[String: Any]] else {
      return []
    }

    return array.compactMap { entry in
      guard let functionRaw = entry["function"] as? String,
        let function = NativePaintLayer.Function(rawValue: functionRaw)
      else {
        return nil
      }

      let stops = parseStops(entry["stops"])
      let at = parsePoint(entry["at"])
      let size = parseSize(entry["size"])

      return NativePaintLayer(
        function: function,
        stops: stops,
        angle: CGFloat(entry["angle"] as? Double ?? 0),
        shape: entry["shape"] as? String ?? "circle",
        repeatGradient: entry["repeat"] as? Bool ?? false,
        imageURL: entry["image_url"] as? String ?? "",
        canvasRepeat: entry["canvas_repeat"] as? String ?? "unset",
        at: at,
        size: size,
        opacity: CGFloat(entry["opacity"] as? Double ?? 1)
      )
    }
  }

  private static func parseStops(_ value: Any?) -> [NativePaintStop] {
    guard let array = value as? [[String: Any]] else {
      return []
    }

    return array.compactMap { entry in
      guard let colorValue = entry["color"],
        let atValue = entry["at"] as? Double
      else {
        return nil
      }

      guard let color = parseColorValue(colorValue) else {
        return nil
      }

      return NativePaintStop(color: color, at: CGFloat(atValue))
    }
  }

  private static func parseShadows(_ value: Any?) -> [NativePaintShadow] {
    guard let array = value as? [[String: Any]] else {
      return []
    }

    return array.compactMap(parseShadow)
  }

  private static func parseShadow(_ entry: [String: Any]) -> NativePaintShadow? {
    guard let colorValue = entry["color"],
      let radius = entry["radius"] as? Double,
      let xOffset = entry["x_offset"] as? Double,
      let yOffset = entry["y_offset"] as? Double,
      let color = parseColorValue(colorValue)
    else {
      return nil
    }

    return NativePaintShadow(
      color: color,
      radius: CGFloat(radius),
      xOffset: CGFloat(xOffset),
      yOffset: CGFloat(yOffset)
    )
  }

  private static func parseTextStyle(_ value: Any?) -> NativePaintTextStyle? {
    guard let entry = value as? [String: Any] else {
      return nil
    }

    let strokeEntry = entry["stroke"] as? [String: Any]
    let strokeColor = strokeEntry.flatMap { parseColorValue($0["color"]) }
    let strokeWidth = strokeEntry?["width"] as? Double

    let stroke: (color: UIColor, width: CGFloat)? =
      if let strokeColor, let strokeWidth {
        (strokeColor, CGFloat(strokeWidth))
      } else {
        nil
      }

    return NativePaintTextStyle(
      weight: (entry["weight"] as? Double).map { CGFloat($0) },
      transform: entry["transform"] as? String,
      stroke: stroke,
      shadows: parseShadows(entry["shadows"])
    )
  }

  private static func parsePoint(_ value: Any?) -> CGPoint? {
    guard let array = value as? [Double], array.count == 2 else {
      return nil
    }

    return CGPoint(x: array[0], y: array[1])
  }

  private static func parseSize(_ value: Any?) -> CGSize? {
    guard let array = value as? [Double], array.count == 2 else {
      return nil
    }

    return CGSize(width: array[0], height: array[1])
  }

  private static func parseColorValue(_ value: Any?) -> UIColor? {
    guard let number = value as? NSNumber else {
      return nil
    }

    return SevenTvColor.uiColor(fromPacked: number.int64Value)
  }
}

enum SevenTvColor {
  static func uiColor(fromPacked packed: Int64) -> UIColor {
    let value = UInt32(bitPattern: Int32(truncatingIfNeeded: packed))
    let red = CGFloat((value >> 24) & 0xFF) / 255.0
    let green = CGFloat((value >> 16) & 0xFF) / 255.0
    let blue = CGFloat((value >> 8) & 0xFF) / 255.0
    let alpha = CGFloat(value & 0xFF) / 255.0
    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}

enum CssColorParser {
  static func uiColor(from css: String) -> UIColor {
    let trimmed = css.trimmingCharacters(in: .whitespacesAndNewlines)

    if trimmed.hasPrefix("#") {
      return hexColor(trimmed) ?? .white
    }

    if trimmed.hasPrefix("rgba("), trimmed.hasSuffix(")") {
      let inner = trimmed.dropFirst(5).dropLast(1)
      let parts = inner.split(separator: ",").map {
        $0.trimmingCharacters(in: .whitespaces)
      }
      if parts.count == 4,
        let red = Double(parts[0]),
        let green = Double(parts[1]),
        let blue = Double(parts[2]),
        let alpha = Double(parts[3])
      {
        return UIColor(
          red: CGFloat(red) / 255.0,
          green: CGFloat(green) / 255.0,
          blue: CGFloat(blue) / 255.0,
          alpha: CGFloat(alpha)
        )
      }
    }

    if trimmed.hasPrefix("rgb("), trimmed.hasSuffix(")") {
      let inner = trimmed.dropFirst(4).dropLast(1)
      let parts = inner.split(separator: ",").map {
        $0.trimmingCharacters(in: .whitespaces)
      }
      if parts.count == 3,
        let red = Double(parts[0]),
        let green = Double(parts[1]),
        let blue = Double(parts[2])
      {
        return UIColor(
          red: CGFloat(red) / 255.0,
          green: CGFloat(green) / 255.0,
          blue: CGFloat(blue) / 255.0,
          alpha: 1
        )
      }
    }

    return .white
  }

  private static func hexColor(_ value: String) -> UIColor? {
    var hex = String(value.dropFirst())
    if hex.count == 3 {
      hex = hex.map { String(repeating: $0, count: 2) }.joined()
    }
    guard hex.count == 6 || hex.count == 8, let value = UInt64(hex, radix: 16) else {
      return nil
    }

    if hex.count == 6 {
      let red = CGFloat((value >> 16) & 0xFF) / 255.0
      let green = CGFloat((value >> 8) & 0xFF) / 255.0
      let blue = CGFloat(value & 0xFF) / 255.0
      return UIColor(red: red, green: green, blue: blue, alpha: 1)
    }

    let red = CGFloat((value >> 24) & 0xFF) / 255.0
    let green = CGFloat((value >> 16) & 0xFF) / 255.0
    let blue = CGFloat((value >> 8) & 0xFF) / 255.0
    let alpha = CGFloat(value & 0xFF) / 255.0
    return UIColor(red: red, green: green, blue: blue, alpha: alpha)
  }
}
