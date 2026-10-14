import ExpoImage
import ExpoModulesCore
import SDWebImage
import UIKit

/**
 * Shows one drawn username: the static image, each layer slot in order, then
 * the stroke. URL layers are hosted expo-image views clipped to the glyphs,
 * so animated paints step on the shared animation driver.
 */
final class ChatPaintView: UIView {
  private var render: ChatPaintRender?
  private var hostedViews: [ImageView] = []

  override init(frame: CGRect) {
    super.init(frame: frame)
    isUserInteractionEnabled = false
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  func show(_ render: ChatPaintRender, appContext: AppContext?, animating: Bool) {
    guard render !== self.render else {
      setAnimating(animating)
      return
    }

    clear()
    self.render = render

    let bounds = CGRect(origin: .zero, size: render.size)
    addImage(render.staticImage, frame: bounds, to: self)

    for slot in render.slots {
      switch slot {
      case let .baked(image):
        addImage(image, frame: bounds, to: self)
      case let .url(layer):
        addUrlSlot(layer, render: render, appContext: appContext)
      }
    }

    addImage(render.strokeImage, frame: bounds, to: self)
    setAnimating(animating)
  }

  func clear() {
    for view in hostedViews {
      view.setHostedSource(nil)
    }

    hostedViews = []
    subviews.forEach { $0.removeFromSuperview() }
    render = nil
  }

  func setAnimating(_ animating: Bool) {
    for view in hostedViews {
      view.setHostedAnimating(animating)
    }
  }

  private func addImage(_ image: UIImage?, frame: CGRect, to parent: UIView) {
    guard let image else {
      return
    }

    let view = UIImageView(image: image)
    view.frame = frame
    parent.addSubview(view)
  }

  private func addUrlSlot(_ layer: ChatPaintUrlLayer, render: ChatPaintRender, appContext: AppContext?) {
    let bounds = CGRect(origin: .zero, size: render.size)
    let container = UIView(frame: bounds)
    container.alpha = layer.opacity

    if let maskImage = render.maskImage {
      let mask = CALayer()
      mask.frame = bounds
      mask.contents = maskImage
      container.layer.mask = mask
    }

    if layer.needsBacking {
      addImage(render.backingImage, frame: bounds, to: container)
    }

    if layer.tile == "none" {
      let imageView = ImageView(appContext: appContext)
      imageView.frame = layer.rect
      imageView.setHostedFill(true)
      imageView.setHostedSource(layer.url)
      container.addSubview(imageView)
      hostedViews.append(imageView)
    } else {
      container.addSubview(ChatPaintTileView(layer: layer))
    }

    addSubview(container)
  }
}

/**
 * A tiled URL layer. It repeats the first frame at the image's own size from
 * the glyph origin. The tile size is only known after the load, so the tile
 * does not animate.
 */
private final class ChatPaintTileView: UIView {
  private let layerInfo: ChatPaintUrlLayer

  init(layer: ChatPaintUrlLayer) {
    layerInfo = layer
    super.init(frame: layer.rect)
    isUserInteractionEnabled = false

    SDWebImageManager.shared
      .loadImage(with: layer.url, options: [], progress: nil) { [weak self] image, _, _, _, _, _ in
        guard let self, let image else {
          return
        }

        showTile(image.images?.first ?? image)
      }
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not supported")
  }

  private func showTile(_ image: UIImage) {
    var frame = layerInfo.rect

    if layerInfo.tile == "repeat-x" {
      frame.size.height = image.size.height
    }

    if layerInfo.tile == "repeat-y" {
      frame.size.width = image.size.width
    }

    self.frame = frame
    backgroundColor = UIColor(patternImage: image)
  }
}
