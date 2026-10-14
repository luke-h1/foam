import UIKit

/**
 * A bitmap in device pixels with the y axis up, which is the space Core
 * Graphics applies shadows, clips and gradients in.
 */
struct ChatPaintCanvas {
  let context: CGContext
  let scale: CGFloat
  let pixelHeight: CGFloat

  /**
   * Text shadows draw only the shadow: the glyphs go this far to the left of
   * the canvas and the shadow offset brings the shadow back.
   */
  private let shadowOnlyShift: CGFloat = 10000

  init?(size: CGSize, scale: CGFloat) {
    let width = Int(ceil(size.width * scale))
    let height = Int(ceil(size.height * scale))

    guard
      width > 0,
      height > 0,
      let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
      )
    else {
      return nil
    }

    self.context = context
    self.scale = scale
    pixelHeight = CGFloat(height)
  }

  func makeImage() -> UIImage? {
    context.makeImage().map { UIImage(cgImage: $0, scale: scale, orientation: .up) }
  }

  func pixelPoint(_ point: CGPoint) -> CGPoint {
    CGPoint(x: point.x * scale, y: pixelHeight - point.y * scale)
  }

  func pixelRect(_ rect: CGRect) -> CGRect {
    CGRect(
      x: rect.minX * scale,
      y: pixelHeight - rect.maxY * scale,
      width: rect.width * scale,
      height: rect.height * scale
    )
  }

  /**
   * Draws text with UIKit in points, y down, the way the row draws it.
   */
  func drawText(_ text: NSAttributedString, at origin: CGPoint) {
    context.saveGState()
    context.translateBy(x: 0, y: pixelHeight)
    context.scaleBy(x: scale, y: -scale)
    UIGraphicsPushContext(context)
    text.draw(at: origin)
    UIGraphicsPopContext()
    context.restoreGState()
  }

  func setShadow(_ shadow: ChatPaintShadowRecord, extraX: CGFloat = 0) {
    context.setShadow(
      offset: CGSize(width: (shadow.x + extraX) * scale, height: -shadow.y * scale),
      blur: shadow.blur * 2 * scale,
      color: (ChatColor.parse(shadow.color) ?? .black).cgColor
    )
  }
}

extension ChatPaintCanvas {
  /**
   * The drop shadows chain like Skia's nested drop-shadow filters: each one
   * shadows the content plus the shadows before it.
   */
  func drawPaint(_ drawing: ChatPaintDrawing, passes: ChatPaintPasses, gradients: [ChatPaintLayerRecord]) {
    let dropShadows = passes.contains(.dropShadows) ? drawing.paint.dropShadows : []

    for shadow in dropShadows.reversed() {
      setShadow(shadow)
      context.beginTransparencyLayer(auxiliaryInfo: nil)
    }

    if passes.contains(.textShadows) {
      drawTextShadows(drawing)
    }

    if passes.contains(.baseFill), gradients.isEmpty {
      drawText(drawing.attributed(color: drawing.baseColor), at: drawing.glyphOrigin)
    }

    for layer in gradients {
      drawGradientLayer(layer, drawing: drawing)
    }

    if passes.contains(.stroke), let stroke = drawing.paint.stroke {
      drawText(drawing.attributed(color: .clear, stroke: stroke), at: drawing.glyphOrigin)
    }

    for _ in dropShadows {
      context.endTransparencyLayer()
    }
  }

  private func drawTextShadows(_ drawing: ChatPaintDrawing) {
    let shifted = CGPoint(x: drawing.glyphOrigin.x - shadowOnlyShift, y: drawing.glyphOrigin.y)

    for shadow in drawing.paint.textShadows.reversed() {
      context.saveGState()
      setShadow(shadow, extraX: shadowOnlyShift)
      drawText(drawing.attributed(color: .black), at: shifted)
      context.restoreGState()
    }
  }

  /**
   * Base glyphs, then the gradient drawn only where the glyphs are, inside
   * the layer rect.
   */
  private func drawGradientLayer(_ layer: ChatPaintLayerRecord, drawing: ChatPaintDrawing) {
    guard let gradient = makeGradient(layer) else {
      return
    }

    let grouped = layer.opacity < 1
    context.saveGState()

    if grouped {
      context.setAlpha(layer.opacity)
      context.beginTransparencyLayer(auxiliaryInfo: nil)
    }

    drawText(drawing.attributed(color: drawing.baseColor), at: drawing.glyphOrigin)

    let rect = drawing.layerRect(layer).offsetBy(dx: drawing.glyphOrigin.x, dy: drawing.glyphOrigin.y)
    context.saveGState()
    context.clip(to: pixelRect(rect))
    context.beginTransparencyLayer(auxiliaryInfo: nil)
    drawText(drawing.attributed(color: .black), at: drawing.glyphOrigin)
    context.setBlendMode(.sourceIn)
    fill(gradient, layer: layer, rect: rect)
    context.endTransparencyLayer()
    context.restoreGState()

    if grouped {
      context.endTransparencyLayer()
    }

    context.restoreGState()
  }

  private func fill(_ gradient: CGGradient, layer: ChatPaintLayerRecord, rect: CGRect) {
    let options: CGGradientDrawingOptions = [.drawsBeforeStartLocation, .drawsAfterEndLocation]

    guard layer.kind == "radial" else {
      let line = cssLinearGradientLine(angle: layer.angle, size: rect.size)
      let start = pixelPoint(CGPoint(x: rect.minX + line.start.x, y: rect.minY + line.start.y))
      let end = pixelPoint(CGPoint(x: rect.minX + line.end.x, y: rect.minY + line.end.y))
      context.drawLinearGradient(gradient, start: start, end: end, options: options)
      return
    }

    let center = pixelPoint(CGPoint(x: rect.midX, y: rect.midY))
    let halfWidth = rect.width / 2
    let halfHeight = rect.height / 2
    let radiusX = layer.ellipse ? halfWidth * 2.squareRoot() : hypot(halfWidth, halfHeight)
    let radiusY = layer.ellipse ? halfHeight * 2.squareRoot() : radiusX

    guard radiusX > 0, radiusY > 0 else {
      return
    }

    context.saveGState()
    context.translateBy(x: center.x, y: center.y)
    context.scaleBy(x: 1, y: radiusY / radiusX)
    context.drawRadialGradient(
      gradient,
      startCenter: .zero,
      startRadius: 0,
      endCenter: .zero,
      endRadius: radiusX * scale,
      options: options
    )
    context.restoreGState()
  }

  private func makeGradient(_ layer: ChatPaintLayerRecord) -> CGGradient? {
    let colors = layer.colors.compactMap { ChatColor.parse($0)?.cgColor }

    guard colors.count >= 2, colors.count == layer.colors.count else {
      return nil
    }

    let locations = layer.locations.count == colors.count ? layer.locations.map { CGFloat($0) } : nil

    return CGGradient(
      colorsSpace: CGColorSpace(name: CGColorSpace.sRGB),
      colors: colors as CFArray,
      locations: locations
    )
  }
}

/**
 * The CSS linear-gradient line for a box (css-images-3), matching
 * `css-linear-gradient-line.ts`, in points relative to the box.
 */
private func cssLinearGradientLine(angle: Double, size: CGSize) -> (start: CGPoint, end: CGPoint) {
  let radians = angle * .pi / 180
  let directionX = sin(radians)
  let directionY = -cos(radians)
  let length = abs(size.width * directionX) + abs(size.height * directionY)
  let center = CGPoint(x: size.width / 2, y: size.height / 2)
  let halfX = directionX * length / 2
  let halfY = directionY * length / 2

  return (
    CGPoint(x: center.x - halfX, y: center.y - halfY),
    CGPoint(x: center.x + halfX, y: center.y + halfY)
  )
}
