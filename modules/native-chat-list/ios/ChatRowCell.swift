import ExpoImage
import ExpoModulesCore
import UIKit

/**
 * Draws a row's precomputed TextKit layout.
 */
private final class ChatRowTextView: UIView {
  var rowLayout: ChatRowLayout? {
    didSet {
      setNeedsDisplay()
    }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    isOpaque = false
    backgroundColor = .clear
    contentMode = .redraw
    isUserInteractionEnabled = false
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func draw(_: CGRect) {
    rowLayout?.draw()
  }
}

/**
 * An expo-image view and the URL it last loaded, so a recycled cell that shows
 * the same image does not load it again.
 */
private final class HostedImage {
  let view: ImageView
  var url: URL?

  init(appContext: AppContext?) {
    view = ImageView(appContext: appContext)
    view.isUserInteractionEnabled = false
    view.setHostedFill(false)
  }
}

final class ChatRowCell: UICollectionViewCell {
  static let reuseIdentifier = "ChatRowCell"

  /**
   * Called with the target kind when VoiceOver runs one of the row's custom
   * actions: `row` for message actions, `username` or `reply`.
   */
  var onAccessibilityAction: ((String) -> Void)?

  private let textView = ChatRowTextView()
  private let paintView = ChatPaintView()
  private var images: [HostedImage] = []
  private var entranceAnimator: UIViewPropertyAnimator?

  private(set) var rowLayout: ChatRowLayout?

  override init(frame: CGRect) {
    super.init(frame: frame)
    contentView.addSubview(textView)
    contentView.addSubview(paintView)
    isAccessibilityElement = true
    accessibilityTraits = .staticText
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  override func prepareForReuse() {
    super.prepareForReuse()
    stopEntrance()
  }

  func configure(with layout: ChatRowLayout, appContext: AppContext?, animating: Bool) {
    rowLayout = layout
    textView.frame = CGRect(x: 0, y: 0, width: layout.width, height: layout.height)
    textView.rowLayout = layout

    configureImages(layout.images, appContext: appContext, animating: animating)

    if let paint = layout.paint {
      paintView.isHidden = false
      paintView.frame = paint.frame
      paintView.show(paint.render, appContext: appContext, animating: animating)
    } else {
      paintView.isHidden = true
      paintView.clear()
    }

    configureAccessibility(layout)
  }

  /**
   * Starts or pauses every animated image in the row. A paused image keeps
   * its current frame.
   */
  func setAnimating(_ animating: Bool) {
    for image in images where !image.view.isHidden {
      image.view.setHostedAnimating(animating)
    }

    paintView.setAnimating(animating)
  }

  private func configureImages(_ rowImages: [ChatRowImage], appContext: AppContext?, animating: Bool) {
    while images.count < rowImages.count {
      let image = HostedImage(appContext: appContext)
      contentView.insertSubview(image.view, belowSubview: paintView)
      images.append(image)
    }

    for (index, image) in images.enumerated() {
      guard index < rowImages.count else {
        hide(image)
        continue
      }

      let rowImage = rowImages[index]
      image.view.isHidden = false
      image.view.alpha = rowImage.opacity
      image.view.frame = rowImage.frame

      if image.url != rowImage.url {
        image.url = rowImage.url
        image.view.setHostedSource(rowImage.url)
      }

      image.view.setHostedAnimating(animating)
    }
  }

  private func hide(_ image: HostedImage) {
    image.view.isHidden = true

    guard image.url != nil else {
      return
    }

    image.url = nil
    image.view.setHostedSource(nil)
  }
}

// MARK: - Entrance

extension ChatRowCell {
  /**
   * Hides the row now and springs it in on the next main loop turn. Batch
   * updates run without animation, so starting the spring inside one would
   * skip it.
   */
  func playEntrance() {
    stopEntrance()

    let key = rowLayout?.key
    contentView.alpha = 0
    contentView.transform = CGAffineTransform(translationX: 0, y: 25)

    DispatchQueue.main.async { [weak self] in
      guard let self, rowLayout?.key == key else {
        return
      }

      let timing = UISpringTimingParameters(mass: 0.55, stiffness: 240, damping: 22, initialVelocity: .zero)
      let animator = UIViewPropertyAnimator(duration: 0, timingParameters: timing)

      animator.addAnimations { [weak self] in
        self?.contentView.alpha = 1
        self?.contentView.transform = .identity
      }

      entranceAnimator = animator
      animator.startAnimation()
    }
  }

  private func stopEntrance() {
    entranceAnimator?.stopAnimation(true)
    entranceAnimator = nil
    contentView.alpha = 1
    contentView.transform = .identity
  }
}

// MARK: - Accessibility

extension ChatRowCell {
  private func configureAccessibility(_ layout: ChatRowLayout) {
    accessibilityLabel = layout.accessibilityLabel

    var actions = [makeAction("Message actions", target: "row")]

    if layout.canOpenProfile {
      actions.append(makeAction("View profile", target: "username"))
    }

    if layout.canJumpToReply {
      actions.append(makeAction("Go to replied message", target: "reply"))
    }

    accessibilityCustomActions = actions
  }

  private func makeAction(_ name: String, target: String) -> UIAccessibilityCustomAction {
    UIAccessibilityCustomAction(name: name) { [weak self] _ in
      self?.onAccessibilityAction?(target)
      return true
    }
  }
}
