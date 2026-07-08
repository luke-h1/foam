import CoreText
import ExpoModulesCore
import UIKit

final class PaintedUsernameView: ExpoView {
  var text: String = ""
  var paintPayload: [String: Any]?
  var fallbackColor: String = "#FFFFFF"
  var fontSize: CGFloat = 14
  var lineHeight: CGFloat = 17
  var fontWeight: String = "700"
  var textTransform: String?

  private let imageView = UIImageView()
  private var renderConfiguration: PaintRenderer.Configuration?
  private var loadedImages: [String: UIImage] = [:]
  private var pendingImageURLs: Set<String> = []

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = false
    imageView.contentMode = .topLeft
    addSubview(imageView)
  }

  func applyProps() {
    guard let paint = PaintDefinitionParser.parse(paintPayload) else {
      renderConfiguration = nil
      imageView.image = nil
      invalidateIntrinsicContentSize()
      setNeedsLayout()
      return
    }

    let configuration = PaintRenderer.Configuration(
      text: text,
      paint: paint,
      fallbackColor: CssColorParser.uiColor(from: fallbackColor),
      font: PaintedUsernameView.font(size: fontSize, weight: fontWeight),
      lineHeight: lineHeight,
      textTransform: textTransform
    )

    renderConfiguration = configuration
    loadedImages = [:]
    pendingImageURLs = Set(
      paint.layers
        .filter { $0.function == .url }
        .map(\.imageURL)
        .filter { !$0.isEmpty }
    )

    for url in pendingImageURLs {
      PaintImageCache.shared.image(for: url) { [weak self] image in
        self?.handleLoadedImage(url: url, image: image)
      }
    }

    invalidateIntrinsicContentSize()
    setNeedsLayout()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    imageView.frame = bounds
    rerenderIfNeeded()
  }

  override var intrinsicContentSize: CGSize {
    guard let renderConfiguration else {
      return .zero
    }

    return PaintRenderer.measureSize(for: renderConfiguration)
  }

  override func sizeThatFits(_ size: CGSize) -> CGSize {
    intrinsicContentSize
  }

  private func rerenderIfNeeded() {
    guard let renderConfiguration, bounds.width > 0, bounds.height > 0 else {
      return
    }

    let renderer = UIGraphicsImageRenderer(size: bounds.size)
    let image = renderer.image { _ in
      PaintRenderer.render(
        configuration: renderConfiguration,
        images: loadedImages,
        in: bounds
      )
    }
    imageView.image = image
  }

  private func handleLoadedImage(url: String, image: UIImage?) {
    pendingImageURLs.remove(url)
    if let image {
      loadedImages[url] = image
    }
    setNeedsLayout()
  }

  private static func font(size: CGFloat, weight: String) -> UIFont {
    let numericWeight = Double(weight) ?? 700
    let uiWeight: UIFont.Weight =
      if numericWeight >= 700 {
        .bold
      } else if numericWeight >= 600 {
        .semibold
      } else if numericWeight >= 500 {
        .medium
      } else {
        .regular
      }

    return UIFont.systemFont(ofSize: size, weight: uiWeight)
  }
}
