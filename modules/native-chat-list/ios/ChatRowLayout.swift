import UIKit

/**
 * Where one emote, overlay or badge image sits inside its row.
 */
struct ChatRowImage {
  let url: URL
  let frame: CGRect
  let opacity: CGFloat
}

/**
 * A rounded fill the row draws behind its glyphs: a line background or a
 * badge tint.
 */
struct ChatRowFill {
  let rect: CGRect
  let color: UIColor
  let radius: CGFloat
}

struct ChatRowStrike {
  let rect: CGRect
  let color: UIColor
}

struct ChatRowIcon {
  let image: UIImage
  let frame: CGRect
}

struct ChatPaintPlacement {
  let render: ChatPaintRender
  let frame: CGRect
}

/**
 * Everything a row needs from the list to lay out. Immutable.
 */
struct ChatLayoutContext {
  let width: CGFloat
  let styles: [ChatTextStyle]
  let scale: CGFloat
  let paints: ChatPaintRenderer
}

/**
 * TextKit 1 objects for one row. Only one thread touches them at a time.
 */
private struct ChatTextKit {
  let storage: NSTextStorage
  let layoutManager: NSLayoutManager
  let container: NSTextContainer

  init(string: NSAttributedString, width: CGFloat) {
    storage = NSTextStorage(attributedString: string)
    layoutManager = NSLayoutManager()
    container = NSTextContainer(size: CGSize(width: width, height: .greatestFiniteMagnitude))
    container.lineFragmentPadding = 0
    layoutManager.addTextContainer(container)
    storage.addLayoutManager(layoutManager)
    layoutManager.ensureLayout(for: container)
  }

  /**
   * Where a glyph's line starts. The x comes from the line fragment, because
   * glyph locations are relative to it. The y and height come from the used
   * rect, which leaves out the paragraph spacing.
   */
  func lineBox(forGlyphAt glyphIndex: Int) -> CGRect {
    let fragment = layoutManager.lineFragmentRect(forGlyphAt: glyphIndex, effectiveRange: nil)
    let used = layoutManager.lineFragmentUsedRect(forGlyphAt: glyphIndex, effectiveRange: nil)
    return CGRect(x: fragment.minX, y: used.minY, width: fragment.width, height: used.height)
  }
}

private struct PlacedAttachments {
  var images: [ChatRowImage] = []
  var fills: [ChatRowFill] = []
  var icons: [ChatRowIcon] = []
  var targets: [(frame: CGRect, target: ChatRowTarget)] = []
}

/**
 * One row, laid out for one width. Built and fully laid out on the layout
 * queue, then only read on the main thread, so the TextKit objects are never
 * touched from two threads at once.
 */
final class ChatRowLayout {
  let key: String
  let width: CGFloat
  let height: CGFloat
  let accessibilityLabel: String
  let animateEntrance: Bool
  let canJumpToReply: Bool
  let canOpenProfile: Bool
  let images: [ChatRowImage]
  let paint: ChatPaintPlacement?

  private let surfaceRect: CGRect
  private let surfaceColor: UIColor?
  private let border: ChatRowFill?
  private let fills: [ChatRowFill]
  private let strikes: [ChatRowStrike]
  private let icons: [ChatRowIcon]
  private let imageTargets: [(frame: CGRect, target: ChatRowTarget)]
  private let textOrigin: CGPoint
  private let textKit: ChatTextKit

  init(record: ChatRowRecord, context: ChatLayoutContext) {
    let surface = record.surface
    let marginVertical = CGFloat(surface.marginVertical)
    let borderWidth = CGFloat(surface.borderLeftWidth)
    let origin = CGPoint(x: borderWidth + surface.paddingLeft, y: marginVertical + surface.paddingTop)
    let containerWidth = max(1, context.width - origin.x - surface.paddingRight)
    let built = RowStringBuilder(styles: context.styles, hasPaint: record.paint != nil).build(lines: record.lines)
    let textKit = ChatTextKit(string: built.string, width: containerWidth)
    let textHeight = ceil(textKit.layoutManager.usedRect(for: textKit.container).height)
    let surfaceHeight = surface.paddingTop + textHeight + surface.paddingBottom
    let placed = Self.placeAttachments(textKit: textKit, origin: origin)
    let lineFills = Self.lineFills(built.decorations, textKit: textKit, origin: origin, width: containerWidth)

    key = record.key
    width = context.width
    height = surfaceHeight + marginVertical * 2
    accessibilityLabel = record.accessibilityLabel
    animateEntrance = record.animateEntrance
    canJumpToReply = record.canJumpToReply
    canOpenProfile = record.canOpenProfile
    textOrigin = origin
    self.textKit = textKit
    surfaceRect = CGRect(x: 0, y: marginVertical, width: context.width, height: surfaceHeight)
    surfaceColor = ChatColor.parse(surface.backgroundColor)
    images = placed.images
    icons = placed.icons
    imageTargets = placed.targets
    fills = lineFills + placed.fills
    strikes = Self.strikes(built.decorations, textKit: textKit, origin: origin, width: containerWidth)

    border = ChatColor.parse(surface.borderLeftColor).flatMap { color in
      guard borderWidth > 0 else {
        return nil
      }

      let rect = CGRect(x: 0, y: marginVertical, width: borderWidth, height: surfaceHeight)
      return ChatRowFill(rect: rect, color: color, radius: 0)
    }

    paint = Self.placePaint(
      record: record,
      username: built.username,
      textKit: textKit,
      origin: origin,
      context: context
    )
  }

  /**
   * Draws the surface, the text and its decorations in the current graphics
   * context. Main thread only.
   */
  func draw() {
    if let surfaceColor {
      surfaceColor.setFill()
      UIRectFill(surfaceRect)
    }

    if let border {
      border.color.setFill()
      UIRectFill(border.rect)
    }

    for fill in fills {
      fill.color.setFill()
      UIBezierPath(roundedRect: fill.rect, cornerRadius: fill.radius).fill()
    }

    let glyphRange = textKit.layoutManager.glyphRange(for: textKit.container)
    textKit.layoutManager.drawBackground(forGlyphRange: glyphRange, at: textOrigin)
    textKit.layoutManager.drawGlyphs(forGlyphRange: glyphRange, at: textOrigin)

    for strike in strikes {
      strike.color.setFill()
      UIRectFill(strike.rect)
    }

    for icon in icons {
      icon.image.draw(in: Self.aspectFit(icon.image.size, in: icon.frame))
    }
  }

  /**
   * Finds what a point in row coordinates landed on, if anything.
   */
  func target(at point: CGPoint) -> ChatRowTarget? {
    if let hit = imageTargets.first(where: { $0.frame.insetBy(dx: -4, dy: -4).contains(point) }) {
      return hit.target
    }

    let local = CGPoint(x: point.x - textOrigin.x, y: point.y - textOrigin.y)
    let layoutManager = textKit.layoutManager
    var fraction: CGFloat = 0

    let glyphIndex = layoutManager.glyphIndex(
      for: local,
      in: textKit.container,
      fractionOfDistanceThroughGlyph: &fraction
    )

    let glyphRect = layoutManager.boundingRect(
      forGlyphRange: NSRange(location: glyphIndex, length: 1),
      in: textKit.container
    )

    guard glyphRect.insetBy(dx: -4, dy: -4).contains(local) else {
      return nil
    }

    let charIndex = layoutManager.characterIndexForGlyph(at: glyphIndex)

    guard charIndex < textKit.storage.length else {
      return nil
    }

    return textKit.storage.attribute(chatTargetKey, at: charIndex, effectiveRange: nil) as? ChatRowTarget
  }

  private static func aspectFit(_ size: CGSize, in frame: CGRect) -> CGRect {
    guard size.width > 0, size.height > 0 else {
      return frame
    }

    let ratio = min(frame.width / size.width, frame.height / size.height)
    let fitted = CGSize(width: size.width * ratio, height: size.height * ratio)

    return CGRect(
      x: frame.midX - fitted.width / 2,
      y: frame.midY - fitted.height / 2,
      width: fitted.width,
      height: fitted.height
    )
  }
}

// MARK: - Placement

private extension ChatRowLayout {
  /**
   * Finds where TextKit put each attachment glyph, so an image view can sit on
   * top of the transparent placeholder. Images are centred in their line.
   */
  static func placeAttachments(textKit: ChatTextKit, origin: CGPoint) -> PlacedAttachments {
    var placed = PlacedAttachments()
    let fullRange = NSRange(location: 0, length: textKit.storage.length)

    textKit.storage.enumerateAttribute(.attachment, in: fullRange) { value, range, _ in
      guard let attachment = value as? ChatImageAttachment else {
        return
      }

      let glyphIndex = textKit.layoutManager.glyphIndexForCharacter(at: range.location)
      let lineRect = textKit.lineBox(forGlyphAt: glyphIndex)
      let location = textKit.layoutManager.location(forGlyphAt: glyphIndex)
      let size = attachment.bounds.size

      let frame = CGRect(
        x: origin.x + lineRect.minX + location.x,
        y: origin.y + lineRect.minY + (lineRect.height - size.height) / 2,
        width: size.width,
        height: size.height
      )

      place(attachment, frame: frame, into: &placed)
    }

    return placed
  }

  private static func place(_ attachment: ChatImageAttachment, frame: CGRect, into placed: inout PlacedAttachments) {
    if let icon = attachment.icon {
      placed.icons.append(ChatRowIcon(image: icon, frame: frame))
    }

    if let tint = attachment.tint {
      placed.fills.append(ChatRowFill(rect: frame, color: tint, radius: 4))
    }

    if let url = attachment.url {
      placed.images.append(ChatRowImage(url: url, frame: frame, opacity: attachment.opacity))
    }

    for overlay in attachment.overlays {
      placed.images.append(ChatRowImage(
        url: overlay.url,
        frame: overlay.frame.offsetBy(dx: frame.minX, dy: frame.minY),
        opacity: attachment.opacity
      ))
    }

    if let target = attachment.target {
      placed.targets.append((frame, target))
    }
  }

  /**
   * The used rect of every wrapped line in a paragraph, without the paragraph
   * spacing TextKit adds to the last line fragment.
   */
  private static func usedRects(for range: NSRange, textKit: ChatTextKit) -> [CGRect] {
    let glyphRange = textKit.layoutManager.glyphRange(forCharacterRange: range, actualCharacterRange: nil)
    var rects: [CGRect] = []

    textKit.layoutManager.enumerateLineFragments(forGlyphRange: glyphRange) { _, usedRect, _, _, _ in
      rects.append(usedRect)
    }

    return rects
  }

  static func lineFills(
    _ decorations: [ChatLineDecoration],
    textKit: ChatTextKit,
    origin: CGPoint,
    width: CGFloat
  ) -> [ChatRowFill] {
    decorations.compactMap { decoration in
      guard let fill = decoration.fill else {
        return nil
      }

      let rects = usedRects(for: decoration.range, textKit: textKit)

      guard let first = rects.first, let last = rects.last else {
        return nil
      }

      let rect = CGRect(x: origin.x, y: origin.y + first.minY, width: width, height: last.maxY - first.minY)
      return ChatRowFill(rect: rect, color: fill.color, radius: fill.radius)
    }
  }

  static func strikes(
    _ decorations: [ChatLineDecoration],
    textKit: ChatTextKit,
    origin: CGPoint,
    width: CGFloat
  ) -> [ChatRowStrike] {
    decorations.flatMap { decoration -> [ChatRowStrike] in
      guard let color = decoration.strikeColor else {
        return []
      }

      return usedRects(for: decoration.range, textKit: textKit).map { rect in
        ChatRowStrike(rect: CGRect(x: origin.x, y: origin.y + rect.midY - 0.5, width: width, height: 1), color: color)
      }
    }
  }

  /**
   * The paint view covers the username glyphs. The row draws those glyphs
   * clear, centred in their line, so the paint image lines up with them.
   */
  static func placePaint(
    record: ChatRowRecord,
    username: ChatUsernameRun?,
    textKit: ChatTextKit,
    origin: CGPoint,
    context: ChatLayoutContext
  ) -> ChatPaintPlacement? {
    guard
      let paintRecord = record.paint,
      let username,
      let render = context.paints.render(paint: paintRecord, username: username, scale: context.scale)
    else {
      return nil
    }

    let glyphIndex = textKit.layoutManager.glyphIndexForCharacter(at: username.range.location)
    let lineRect = textKit.lineBox(forGlyphAt: glyphIndex)
    let location = textKit.layoutManager.location(forGlyphAt: glyphIndex)
    let glyphX = origin.x + lineRect.minX + location.x
    let glyphY = origin.y + lineRect.minY + (lineRect.height - username.font.lineHeight) / 2

    let frame = CGRect(
      x: glyphX - render.glyphOrigin.x,
      y: glyphY - render.glyphOrigin.y,
      width: render.size.width,
      height: render.size.height
    )

    return ChatPaintPlacement(render: render, frame: frame)
  }
}
