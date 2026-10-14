import UIKit

let chatTargetKey = NSAttributedString.Key("foamChatTarget")

/**
 * A transparent stand-in for every attachment. The cell draws the real images
 * as subviews, and the row draws icons itself, so TextKit only reserves space.
 */
private let clearAttachmentImage = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1)).image { _ in }

struct ChatOverlayImage {
  let url: URL
  let frame: CGRect
}

final class ChatImageAttachment: NSTextAttachment {
  var url: URL?
  var overlays: [ChatOverlayImage] = []
  var target: ChatRowTarget?
  var opacity: CGFloat = 1
  var tint: UIColor?
  var icon: UIImage?
}

/**
 * What a press inside a row landed on. `index` is the badge position for a
 * badge, and the JS token index for everything else.
 */
struct ChatRowTarget {
  let kind: String
  let index: Int
}

/**
 * A rounded fill behind a whole paragraph.
 */
struct ChatLineFill {
  let color: UIColor
  let radius: CGFloat
}

/**
 * Drawing that belongs to one paragraph rather than to its glyphs.
 */
struct ChatLineDecoration {
  let range: NSRange
  let fill: ChatLineFill?
  let strikeColor: UIColor?
}

/**
 * The username span of a painted row, so the paint can draw the same glyphs.
 */
struct ChatUsernameRun {
  let range: NSRange
  let text: String
  let font: UIFont
  let letterSpacing: CGFloat
}

struct RowString {
  let string: NSAttributedString
  let decorations: [ChatLineDecoration]
  let username: ChatUsernameRun?
}

private struct LineContext {
  let paragraph: NSParagraphStyle
  let lineHeight: CGFloat
  let target: ChatRowTarget?
}

/**
 * Turns the lines of one row record into the attributed string TextKit lays
 * out: one paragraph per line, with a fixed height for every wrapped line.
 */
final class RowStringBuilder {
  private let styles: [ChatTextStyle]
  private let hasPaint: Bool
  private let result = NSMutableAttributedString()
  private var decorations: [ChatLineDecoration] = []
  private var username: ChatUsernameRun?

  init(styles: [ChatTextStyle], hasPaint: Bool) {
    self.styles = styles
    self.hasPaint = hasPaint
  }

  func build(lines: [ChatLineRecord]) -> RowString {
    for (index, line) in lines.enumerated() {
      append(line: line, isLast: index == lines.count - 1)
    }

    return RowString(string: result, decorations: decorations, username: username)
  }

  private func append(line: ChatLineRecord, isLast: Bool) {
    let context = makeContext(line: line)
    let start = result.length

    if let icon = line.icon {
      appendIcon(icon, context: context)
    }

    for span in line.spans {
      append(span: span, context: context)
    }

    if !isLast {
      result.append(NSAttributedString(string: "\n", attributes: [
        .paragraphStyle: context.paragraph,
        .font: style(at: line.spans.first?.style ?? 0).font
      ]))
    }

    let fill = line.background.flatMap { background in
      ChatColor.parse(background.color).map { ChatLineFill(color: $0, radius: CGFloat(background.radius)) }
    }

    let strikeColor = ChatColor.parse(line.strikeColor)

    if fill != nil || strikeColor != nil {
      let range = NSRange(location: start, length: result.length - start)
      decorations.append(ChatLineDecoration(range: range, fill: fill, strikeColor: strikeColor))
    }
  }

  /**
   * A line with a background is one padded pill, so its vertical padding goes
   * into the line height and its side padding into the indents.
   */
  private func makeContext(line: ChatLineRecord) -> LineContext {
    let paddingVertical = CGFloat(line.background?.paddingVertical ?? 0)
    let paddingHorizontal = CGFloat(line.background?.paddingHorizontal ?? 0)
    let lineHeight = CGFloat(line.lineHeight) + paddingVertical * 2

    let paragraph = NSMutableParagraphStyle()
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
    paragraph.paragraphSpacing = CGFloat(line.marginBottom)
    paragraph.lineBreakMode = line.numberOfLines == 1 ? .byTruncatingTail : .byWordWrapping
    paragraph.firstLineHeadIndent = paddingHorizontal
    paragraph.headIndent = paddingHorizontal
    paragraph.tailIndent = -paddingHorizontal

    let target = line.pressTarget.map { ChatRowTarget(kind: $0, index: -1) }
    return LineContext(paragraph: paragraph, lineHeight: lineHeight, target: target)
  }

  private func append(span: ChatSpanRecord, context: LineContext) {
    if span.url != nil, span.kind == "badge" || span.kind == "emote" {
      appendImage(span, context: context)
      return
    }

    appendText(span, context: context)
  }

  private func appendText(_ span: ChatSpanRecord, context: LineContext) {
    let style = style(at: span.style)
    let font = span.kind == "timestamp" ? style.tabularFont : style.font
    let color = ChatColor.parse(span.color) ?? style.color
    let isPaintedUsername = hasPaint && span.kind == "username"
    let textColor = color.withAlphaComponent(color.cgColor.alpha * style.opacity)

    // TextKit puts the extra line height above the glyphs; this offset centres
    // them in the line, the same way React Native does for a fixed lineHeight.
    var attributes: [NSAttributedString.Key: Any] = [
      .font: font,
      .foregroundColor: isPaintedUsername ? UIColor.clear : textColor,
      .paragraphStyle: context.paragraph,
      .baselineOffset: (context.lineHeight - font.lineHeight) / 2,
      .kern: style.letterSpacing
    ]

    if style.underline {
      attributes[.underlineStyle] = NSUnderlineStyle.single.rawValue
    }

    if style.strikethrough {
      attributes[.strikethroughStyle] = NSUnderlineStyle.single.rawValue
    }

    if let target = context.target ?? Self.target(for: span) {
      attributes[chatTargetKey] = target
    }

    let start = result.length
    result.append(NSAttributedString(string: span.text, attributes: attributes))

    if isPaintedUsername, username == nil {
      username = ChatUsernameRun(
        range: NSRange(location: start, length: result.length - start),
        text: span.text,
        font: font,
        letterSpacing: style.letterSpacing
      )
    }

    addTrailingKern(CGFloat(span.marginRight ?? 0))
  }

  private func appendImage(_ span: ChatSpanRecord, context: LineContext) {
    guard let url = span.url.flatMap(URL.init(string:)) else {
      appendText(span, context: context)
      return
    }

    if let overlap = span.overlapPrevious, overlap > 0 {
      addTrailingKern(-CGFloat(overlap))
    }

    let size = CGSize(width: span.width ?? context.lineHeight, height: span.height ?? context.lineHeight)
    let attachment = ChatImageAttachment()
    attachment.image = clearAttachmentImage
    attachment.bounds = CGRect(origin: .zero, size: size)
    attachment.url = url
    attachment.target = context.target ?? Self.target(for: span)
    attachment.opacity = CGFloat(span.opacity ?? 1)
    attachment.tint = ChatColor.parse(span.tint)

    attachment.overlays = span.overlays.compactMap { overlay in
      URL(string: overlay.url).map { overlayUrl in
        ChatOverlayImage(
          url: overlayUrl,
          frame: CGRect(x: overlay.x, y: overlay.y, width: overlay.width, height: overlay.height)
        )
      }
    }

    appendAttachment(attachment, styleIndex: span.style, context: context)
    addTrailingKern(CGFloat(span.marginRight ?? 0))
  }

  private func appendIcon(_ icon: ChatLineIconRecord, context: LineContext) {
    let size = CGFloat(icon.size)
    let configuration = UIImage.SymbolConfiguration(pointSize: size)
    let color = ChatColor.parse(icon.color) ?? .white

    let attachment = ChatImageAttachment()
    attachment.image = clearAttachmentImage
    attachment.bounds = CGRect(x: 0, y: 0, width: size, height: size)
    attachment.icon = UIImage(systemName: icon.name, withConfiguration: configuration)?
      .withTintColor(color, renderingMode: .alwaysOriginal)

    appendAttachment(attachment, styleIndex: 0, context: context)
    addTrailingKern(CGFloat(icon.marginRight))
  }

  private func appendAttachment(_ attachment: ChatImageAttachment, styleIndex: Int, context: LineContext) {
    let string = NSMutableAttributedString(attachment: attachment)
    var attributes: [NSAttributedString.Key: Any] = [
      .paragraphStyle: context.paragraph,
      .font: style(at: styleIndex).font
    ]

    if let target = attachment.target {
      attributes[chatTargetKey] = target
    }

    string.addAttributes(attributes, range: NSRange(location: 0, length: string.length))
    result.append(string)
  }

  /**
   * Adds space after the last character. Kern applies after a character, so
   * this is how a span's right margin reaches TextKit.
   */
  private func addTrailingKern(_ value: CGFloat) {
    guard value != 0, result.length > 0 else {
      return
    }

    let range = (result.string as NSString).rangeOfComposedCharacterSequence(at: result.length - 1)
    let existing = result.attribute(.kern, at: range.location, effectiveRange: nil) as? CGFloat ?? 0
    result.addAttribute(.kern, value: existing + value, range: range)
  }

  private func style(at index: Int) -> ChatTextStyle {
    index >= 0 && index < styles.count ? styles[index] : .fallback
  }

  private static func target(for span: ChatSpanRecord) -> ChatRowTarget? {
    switch span.kind {
    case "username":
      ChatRowTarget(kind: "username", index: -1)
    case "badge", "emote", "link", "mention":
      ChatRowTarget(kind: span.kind, index: span.index)
    default:
      nil
    }
  }
}
