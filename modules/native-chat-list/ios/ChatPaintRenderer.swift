import UIKit

/**
 * A URL layer drawn live by a hosted expo-image view, so it animates on the
 * shared animation driver. The rect is in points, relative to the paint view.
 */
struct ChatPaintUrlLayer {
  let url: URL
  let rect: CGRect
  let tile: String
  let opacity: CGFloat
  let needsBacking: Bool
}

enum ChatPaintSlot {
  case baked(UIImage)
  case url(ChatPaintUrlLayer)
}

/**
 * The drawn username for one paint, font and text. Sizes are in points.
 * Images are immutable, so the layout queue builds this and the main thread
 * reads it.
 */
final class ChatPaintRender {
  let size: CGSize
  let glyphOrigin: CGPoint
  let staticImage: UIImage?
  let slots: [ChatPaintSlot]
  let backingImage: UIImage?
  let strokeImage: UIImage?
  let maskImage: CGImage?

  init(
    size: CGSize,
    glyphOrigin: CGPoint,
    staticImage: UIImage?,
    slots: [ChatPaintSlot],
    backingImage: UIImage?,
    strokeImage: UIImage?,
    maskImage: CGImage?
  ) {
    self.size = size
    self.glyphOrigin = glyphOrigin
    self.staticImage = staticImage
    self.slots = slots
    self.backingImage = backingImage
    self.strokeImage = strokeImage
    self.maskImage = maskImage
  }
}

struct ChatPaintPasses: OptionSet {
  let rawValue: Int

  static let dropShadows = ChatPaintPasses(rawValue: 1 << 0)
  static let textShadows = ChatPaintPasses(rawValue: 1 << 1)
  static let baseFill = ChatPaintPasses(rawValue: 1 << 2)
  static let stroke = ChatPaintPasses(rawValue: 1 << 3)
  static let all: ChatPaintPasses = [.dropShadows, .textShadows, .baseFill, .stroke]
}

/**
 * Draws a 7TV paint the way `skia-painted-username-rasterizer.ts` does: the
 * same passes, layer order, shadow chain and slot plan. Safe to call from the
 * layout queue.
 */
final class ChatPaintRenderer {
  private let cache = NSCache<NSString, ChatPaintRender>()

  init() {
    cache.countLimit = 200
  }

  func render(paint: ChatPaintRecord, username: ChatUsernameRun, scale: CGFloat) -> ChatPaintRender? {
    let key = "\(paint.key)|\(username.text)|\(username.font.fontName)|\(username.font.pointSize)|\(scale)" as NSString

    if let cached = cache.object(forKey: key) {
      return cached
    }

    guard let render = ChatPaintDrawing(paint: paint, username: username, scale: scale)?.render() else {
      return nil
    }

    cache.setObject(render, forKey: key)
    return render
  }
}

struct ChatPaintDrawing {
  let paint: ChatPaintRecord
  let font: UIFont
  let letterSpacing: CGFloat
  let text: String
  let scale: CGFloat
  let glyphSize: CGSize
  let size: CGSize
  let glyphOrigin: CGPoint
  let baseColor: UIColor

  init?(paint: ChatPaintRecord, username: ChatUsernameRun, scale: CGFloat) {
    let measured = NSAttributedString(string: username.text, attributes: [
      .font: username.font,
      .kern: username.letterSpacing
    ]).size()

    glyphSize = CGSize(width: ceil(measured.width), height: ceil(username.font.lineHeight))

    guard glyphSize.width > 0, glyphSize.height > 0 else {
      return nil
    }

    let insets = paint.insets
    self.paint = paint
    font = username.font
    letterSpacing = username.letterSpacing
    text = username.text
    self.scale = scale
    glyphOrigin = CGPoint(x: ceil(insets.left * scale) / scale, y: ceil(insets.top * scale) / scale)

    size = CGSize(
      width: glyphOrigin.x + glyphSize.width + ceil(insets.right * scale) / scale,
      height: glyphOrigin.y + glyphSize.height + ceil(insets.bottom * scale) / scale
    )

    baseColor = ChatColor.parse(paint.baseColor) ?? .white
  }

  func render() -> ChatPaintRender {
    let hasUrlLayers = paint.layers.contains { $0.kind == "image" && $0.url != nil }

    guard hasUrlLayers else {
      return ChatPaintRender(
        size: size,
        glyphOrigin: glyphOrigin,
        staticImage: draw(passes: .all, gradients: gradientLayers(paint.layers)),
        slots: [],
        backingImage: nil,
        strokeImage: nil,
        maskImage: nil
      )
    }

    let slots = layerSlots()

    let needsBacking = slots.contains { slot in
      if case let .url(layer) = slot {
        return layer.needsBacking
      }

      return false
    }

    return ChatPaintRender(
      size: size,
      glyphOrigin: glyphOrigin,
      staticImage: draw(passes: [.dropShadows, .textShadows, .baseFill], gradients: []),
      slots: slots,
      backingImage: needsBacking ? draw(passes: .baseFill, gradients: []) : nil,
      strokeImage: paint.stroke == nil ? nil : draw(passes: .stroke, gradients: []),
      maskImage: makeMask()
    )
  }

  /**
   * Contiguous gradients bake into one slot, and each URL layer gets a live
   * slot, so a gradient above a URL layer still draws on top of it.
   */
  private func layerSlots() -> [ChatPaintSlot] {
    var slots: [ChatPaintSlot] = []
    var pending: [ChatPaintLayerRecord] = []

    let flush = {
      guard !pending.isEmpty else {
        return
      }

      if let image = draw(passes: [], gradients: pending) {
        slots.append(.baked(image))
      }

      pending = []
    }

    for layer in paint.layers {
      if layer.kind == "image", let url = layer.url.flatMap(URL.init(string:)) {
        flush()
        slots.append(.url(urlLayer(layer, url: url, index: slots.count)))
        continue
      }

      pending.append(layer)
    }

    flush()
    return slots
  }

  private func urlLayer(_ layer: ChatPaintLayerRecord, url: URL, index: Int) -> ChatPaintUrlLayer {
    let rect = layerRect(layer).offsetBy(dx: glyphOrigin.x, dy: glyphOrigin.y)

    return ChatPaintUrlLayer(
      url: url,
      rect: layer.tile == "none" ? rect : CGRect(origin: glyphOrigin, size: glyphSize),
      tile: layer.tile,
      opacity: CGFloat(layer.opacity),
      needsBacking: index > 0 || layer.opacity < 1
    )
  }

  private func gradientLayers(_ layers: [ChatPaintLayerRecord]) -> [ChatPaintLayerRecord] {
    layers.filter { $0.kind != "image" }
  }

  /**
   * CSS `background-position` and `background-size` inside the glyph box.
   */
  func layerRect(_ layer: ChatPaintLayerRecord) -> CGRect {
    let sizeX = layer.size?.first ?? 1
    let sizeY = layer.size?.last ?? 1
    let positionX = layer.at?.first ?? 0
    let positionY = layer.at?.last ?? 0

    return CGRect(
      x: (1 - sizeX) * positionX * glyphSize.width,
      y: (1 - sizeY) * positionY * glyphSize.height,
      width: sizeX * glyphSize.width,
      height: sizeY * glyphSize.height
    )
  }

  func attributed(color: UIColor, stroke: ChatPaintStrokeRecord? = nil) -> NSAttributedString {
    var attributes: [NSAttributedString.Key: Any] = [
      .font: font,
      .kern: letterSpacing,
      .foregroundColor: color
    ]

    if let stroke {
      attributes[.strokeColor] = ChatColor.parse(stroke.color) ?? color
      attributes[.strokeWidth] = stroke.width / font.pointSize * 100
    }

    return NSAttributedString(string: text, attributes: attributes)
  }

  private func draw(passes: ChatPaintPasses, gradients: [ChatPaintLayerRecord]) -> UIImage? {
    guard let canvas = ChatPaintCanvas(size: size, scale: scale) else {
      return nil
    }

    canvas.drawPaint(self, passes: passes, gradients: gradients)
    return canvas.makeImage()
  }

  /**
   * White glyphs on a clear surface. The cell uses the alpha as a layer mask
   * to clip URL layers to the glyphs.
   */
  private func makeMask() -> CGImage? {
    guard let canvas = ChatPaintCanvas(size: size, scale: scale) else {
      return nil
    }

    canvas.drawText(attributed(color: .white), at: glyphOrigin)
    return canvas.context.makeImage()
  }
}
