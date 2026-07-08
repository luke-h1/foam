import CoreText
import UIKit

final class PaintImageCache {
  static let shared = PaintImageCache()

  private let cache = NSCache<NSString, UIImage>()
  private var inFlight = [String: [(UIImage?) -> Void]]()

  private init() {}

  func image(for urlString: String, completion: @escaping (UIImage?) -> Void) {
    let key = urlString as NSString
    if let cached = cache.object(forKey: key) {
      completion(cached)
      return
    }

    if inFlight[urlString] != nil {
      inFlight[urlString]?.append(completion)
      return
    }

    inFlight[urlString] = [completion]

    guard let url = URL(string: urlString) else {
      finish(urlString: urlString, image: nil)
      return
    }

    URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
      let image = data.flatMap { UIImage(data: $0) }
      DispatchQueue.main.async {
        if let image {
          self?.cache.setObject(image, forKey: key)
        }
        self?.finish(urlString: urlString, image: image)
      }
    }.resume()
  }

  private func finish(urlString: String, image: UIImage?) {
    let callbacks = inFlight.removeValue(forKey: urlString) ?? []
    callbacks.forEach { $0(image) }
  }
}

enum PaintRenderer {
  struct Configuration {
    let text: String
    let paint: NativePaintDefinition
    let fallbackColor: UIColor
    let font: UIFont
    let lineHeight: CGFloat
    let textTransform: String?
  }

  static func measureSize(for configuration: Configuration) -> CGSize {
    let attributed = attributedString(for: configuration)
    let bounds = attributed.boundingRect(
      with: CGSize(width: CGFloat.greatestFiniteMagnitude, height: configuration.lineHeight),
      options: [.usesLineFragmentOrigin, .usesFontLeading],
      context: nil
    )
    let padding = shadowPadding(for: configuration.paint)
    return CGSize(
      width: ceil(bounds.width) + padding.width,
      height: max(configuration.lineHeight, ceil(bounds.height)) + padding.height
    )
  }

  static func render(
    configuration: Configuration,
    images: [String: UIImage],
    in rect: CGRect
  ) {
    let padding = shadowPadding(for: configuration.paint)
    let contentOrigin = CGPoint(x: padding.width * 0.5, y: padding.height * 0.5)
    let attributed = attributedString(for: configuration)
    let textBounds = textBoundingRect(for: attributed, lineHeight: configuration.lineHeight)
    let textOrigin = CGPoint(
      x: contentOrigin.x,
      y: contentOrigin.y + max(0, (rect.height - padding.height - textBounds.height) * 0.5)
    )
    let drawRect = textBounds.offsetBy(dx: textOrigin.x, dy: textOrigin.y)

    for shadow in configuration.paint.dropShadows {
      drawShadow(
        attributed: attributed,
        at: textOrigin,
        shadow: shadow
      )
    }

    for shadow in configuration.paint.textStyle?.shadows ?? [] {
      drawShadow(
        attributed: attributed,
        at: textOrigin,
        shadow: shadow
      )
    }

    if let mask = textMaskImage(attributed: attributed, drawRect: drawRect, canvasSize: rect.size) {
      UIGraphicsGetCurrentContext()?.saveGState()
      UIGraphicsGetCurrentContext()?.clip(to: rect, mask: mask)

      if let baseColor = configuration.paint.color {
        baseColor.setFill()
        UIRectFill(drawRect)
      } else if configuration.paint.layers.isEmpty {
        configuration.fallbackColor.setFill()
        UIRectFill(drawRect)
      }

      for layer in configuration.paint.layers.reversed() {
        draw(layer: layer, in: drawRect, paint: configuration.paint, fallbackColor: configuration.fallbackColor, images: images)
      }

      UIGraphicsGetCurrentContext()?.restoreGState()
    }

    if let stroke = configuration.paint.textStyle?.stroke {
      drawStroke(
        attributed: attributed,
        at: textOrigin,
        stroke: stroke
      )
    }
  }

  private static func attributedString(for configuration: Configuration) -> NSAttributedString {
    var text = configuration.text
    if let transform = configuration.textTransform {
      switch transform {
      case "uppercase":
        text = text.uppercased()
      case "lowercase":
        text = text.lowercased()
      default:
        break
      }
    }

    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = configuration.lineHeight
    paragraph.maximumLineHeight = configuration.lineHeight

    return NSAttributedString(
      string: text,
      attributes: [
        .font: configuration.font,
        .paragraphStyle: paragraph,
      ]
    )
  }

  private static func textBoundingRect(
    for attributed: NSAttributedString,
    lineHeight: CGFloat
  ) -> CGRect {
    attributed.boundingRect(
      with: CGSize(width: CGFloat.greatestFiniteMagnitude, height: lineHeight),
      options: [.usesLineFragmentOrigin, .usesFontLeading],
      context: nil
    ).integral
  }

  private static func drawShadow(
    attributed: NSAttributedString,
    at origin: CGPoint,
    shadow: NativePaintShadow
  ) {
    let shadowed = NSMutableAttributedString(attributedString: attributed)
    let range = NSRange(location: 0, length: shadowed.length)
    shadowed.addAttributes(
      [
        .foregroundColor: shadow.color,
        .shadow: NSShadow().then {
          $0.shadowColor = shadow.color
          $0.shadowOffset = CGSize(width: shadow.xOffset, height: shadow.yOffset)
          $0.shadowBlurRadius = shadow.radius
        },
      ],
      range: range
    )
    shadowed.draw(at: origin)
  }

  private static func drawStroke(
    attributed: NSAttributedString,
    at origin: CGPoint,
    stroke: (color: UIColor, width: CGFloat)
  ) {
    let stroked = NSMutableAttributedString(attributedString: attributed)
    let range = NSRange(location: 0, length: stroked.length)
    stroked.addAttributes(
      [
        .strokeColor: stroke.color,
        .strokeWidth: stroke.width,
        .foregroundColor: UIColor.clear,
      ],
      range: range
    )
    stroked.draw(at: origin)
  }

  private static func textMaskImage(
    attributed: NSAttributedString,
    drawRect: CGRect,
    canvasSize: CGSize
  ) -> CGImage? {
    let renderer = UIGraphicsImageRenderer(size: canvasSize)
    let image = renderer.image { _ in
      let maskText = NSMutableAttributedString(attributedString: attributed)
      maskText.addAttribute(
        .foregroundColor,
        value: UIColor.black,
        range: NSRange(location: 0, length: maskText.length)
      )
      maskText.draw(at: drawRect.origin)
    }
    return image.cgImage
  }

  private static func draw(
    layer: NativePaintLayer,
    in rect: CGRect,
    paint: NativePaintDefinition,
    fallbackColor: UIColor,
    images: [String: UIImage]
  ) {
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    context.saveGState()
    context.setAlpha(layer.opacity)

    switch layer.function {
    case .linear:
      if let gradient = linearGradient(for: layer) {
        context.drawLinearGradient(
          gradient,
          start: gradientStart(for: layer.angle, in: rect),
          end: gradientEnd(for: layer.angle, in: rect),
          options: []
        )
      }
    case .radial:
      if let gradient = linearGradient(for: layer) {
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = max(rect.width, rect.height) * 0.5
        context.drawRadialGradient(
          gradient,
          startCenter: center,
          startRadius: 0,
          endCenter: center,
          endRadius: radius,
          options: []
        )
      }
    case .url:
      if let image = images[layer.imageURL] {
        image.draw(in: rect)
      } else if paint.color == nil && paint.layers.count == 1 {
        fallbackColor.setFill()
        UIRectFill(rect)
      }
    }

    context.restoreGState()
  }

  private static func linearGradient(for layer: NativePaintLayer) -> CGGradient? {
    guard !layer.stops.isEmpty else {
      return nil
    }

    let colors = layer.stops.map { $0.color.cgColor } as CFArray
    let locations = layer.stops.map { $0.at }
    return CGGradient(
      colorsSpace: CGColorSpaceCreateDeviceRGB(),
      colors: colors,
      locations: locations
    )
  }

  private static func gradientStart(for angle: CGFloat, in bounds: CGRect) -> CGPoint {
    let points = angleToPoints(angle: angle)
    return CGPoint(
      x: bounds.minX + bounds.width * points.start.x,
      y: bounds.minY + bounds.height * points.start.y
    )
  }

  private static func gradientEnd(for angle: CGFloat, in bounds: CGRect) -> CGPoint {
    let points = angleToPoints(angle: angle)
    return CGPoint(
      x: bounds.minX + bounds.width * points.end.x,
      y: bounds.minY + bounds.height * points.end.y
    )
  }

  private static func angleToPoints(angle: CGFloat) -> (
    start: CGPoint,
    end: CGPoint
  ) {
    let rad = (angle - 90) * .pi / 180
    let start = CGPoint(
      x: 0.5 + 0.5 * cos(rad + .pi),
      y: 0.5 + 0.5 * sin(rad + .pi)
    )
    let end = CGPoint(
      x: 0.5 + 0.5 * cos(rad),
      y: 0.5 + 0.5 * sin(rad)
    )
    return (start, end)
  }

  private static func shadowPadding(for paint: NativePaintDefinition) -> CGSize {
    var horizontal: CGFloat = 0
    var vertical: CGFloat = 0

    let shadows = paint.dropShadows + (paint.textStyle?.shadows ?? [])
    for shadow in shadows {
      horizontal = max(horizontal, abs(shadow.xOffset) + shadow.radius)
      vertical = max(vertical, abs(shadow.yOffset) + shadow.radius)
    }

    if let stroke = paint.textStyle?.stroke {
      horizontal = max(horizontal, stroke.width)
      vertical = max(vertical, stroke.width)
    }

    return CGSize(width: ceil(horizontal * 2), height: ceil(vertical * 2))
  }
}

private extension NSShadow {
  func then(_ configure: (NSShadow) -> Void) -> NSShadow {
    configure(self)
    return self
  }
}
