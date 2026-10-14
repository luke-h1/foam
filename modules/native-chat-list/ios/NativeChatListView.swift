import ExpoModulesCore
import UIKit

final class NativeChatListView: ExpoView {
  let onScroll = EventDispatcher()
  let onScrollBeginDrag = EventDispatcher()
  let onScrollEndDrag = EventDispatcher()
  let onMomentumScrollBegin = EventDispatcher()
  let onMomentumScrollEnd = EventDispatcher()
  let onEndReached = EventDispatcher()
  let onRowPress = EventDispatcher()
  let onRowLongPress = EventDispatcher()
  let onVisibleKeysChange = EventDispatcher()

  let collectionView: UICollectionView
  private let engine = ChatLayoutEngine()

  private(set) var rows: [ChatRowLayout] = []
  private var animateEmotes = true
  private var laidOutWidth: CGFloat = 0
  private var laidOutScale: CGFloat = 0
  private var composerInset: CGFloat = 0
  private var keyboardInset: CGFloat = 0
  var isPinnedToBottom = true
  var lastScrollEventTime: CFTimeInterval = 0
  var lastVisibleKeysTime: CFTimeInterval = 0
  var lastVisibleKeys: [String] = []

  /**
   * True while the user drags or the list decelerates, and for a short settle
   * time after. Animated images pause while it is true.
   */
  var isScrollActive = false
  var scrollSettleWork: DispatchWorkItem?

  /**
   * Keys that have already been on screen, or were present when the rows
   * were last replaced. Only a key outside this set plays the entrance.
   */
  var shownKeys = Set<String>()

  var emotesAnimating: Bool {
    animateEmotes && !isScrollActive
  }

  required init(appContext: AppContext? = nil) {
    let layout = UICollectionViewFlowLayout()
    layout.scrollDirection = .vertical
    layout.minimumLineSpacing = 0
    layout.minimumInteritemSpacing = 0
    collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)

    super.init(appContext: appContext)

    clipsToBounds = true
    collectionView.backgroundColor = .clear
    collectionView.contentInsetAdjustmentBehavior = .never
    collectionView.alwaysBounceVertical = true
    collectionView.keyboardDismissMode = .onDrag
    collectionView.dataSource = self
    collectionView.delegate = self
    collectionView.register(ChatRowCell.self, forCellWithReuseIdentifier: ChatRowCell.reuseIdentifier)
    addSubview(collectionView)

    collectionView.addGestureRecognizer(UITapGestureRecognizer(target: self, action: #selector(handleTap(_:))))

    let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
    longPress.minimumPressDuration = 0.4
    collectionView.addGestureRecognizer(longPress)

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(keyboardWillChangeFrame(_:)),
      name: UIResponder.keyboardWillChangeFrameNotification,
      object: nil
    )
  }

  // MARK: - JS-facing API

  func setConfig(_ config: ChatListConfigRecord) {
    animateEmotes = config.animateEmotes
    updateVisibleAnimation()
  }

  func setComposerInset(_ inset: CGFloat) {
    composerInset = inset
    updateBottomInset()
  }

  func apply(_ batch: ChatListBatchRecord) {
    engine.apply(batch) { [weak self] change in
      self?.applyChange(change)
    }
  }

  func scrollToEnd(animated: Bool) {
    // JS asks for the end after each commit. It can lag a drag that started
    // after its last scroll event, and must not pull the list back mid-drag.
    guard !collectionView.isDragging, !collectionView.isDecelerating else {
      return
    }

    isPinnedToBottom = true
    scrollToBottom(animated: animated)
  }

  func scrollToKey(_ key: String, animated: Bool, viewPosition: CGFloat) {
    guard let index = rows.firstIndex(where: { $0.key == key }) else {
      return
    }

    isPinnedToBottom = false
    collectionView.layoutIfNeeded()

    guard let attributes = collectionView.layoutAttributesForItem(at: IndexPath(item: index, section: 0)) else {
      return
    }

    let visibleHeight = collectionView.bounds.height - collectionView.contentInset.bottom
    let target = attributes.frame.minY - (visibleHeight - attributes.frame.height) * viewPosition
    collectionView.setContentOffset(CGPoint(x: 0, y: clampedOffset(target)), animated: animated)
  }

  func updateVisibleAnimation() {
    let animating = emotesAnimating

    for cell in collectionView.visibleCells {
      (cell as? ChatRowCell)?.setAnimating(animating)
    }
  }

  // MARK: - Layout

  override func layoutSubviews() {
    super.layoutSubviews()

    let wasPinned = isPinnedToBottom
    let scale = window?.screen.scale ?? traitCollection.displayScale
    collectionView.frame = bounds

    if bounds.width != laidOutWidth || scale != laidOutScale {
      relayoutIfReady(scale: scale)
    } else if wasPinned {
      scrollToBottom(animated: false)
    }
  }

  private func relayoutIfReady(scale: CGFloat) {
    guard bounds.width > 0, scale > 0 else {
      return
    }

    laidOutWidth = bounds.width
    laidOutScale = scale

    engine.relayout(width: bounds.width, scale: scale) { [weak self] change in
      self?.applyChange(change)
    }
  }

  private func applyChange(_ change: ChatLayoutChange) {
    switch change {
    case let .reset(layouts):
      rows = layouts
      shownKeys = Set(layouts.map(\.key))
      collectionView.reloadData()
      collectionView.layoutIfNeeded()

      if isPinnedToBottom {
        scrollToBottom(animated: false)
      }

    case let .incremental(removeFromStart, append, update):
      applyIncremental(removeFromStart: removeFromStart, append: append, update: update)
    }

    emitVisibleKeys(force: true)
  }

  private func applyIncremental(removeFromStart: Int, append: [ChatRowLayout], update: [ChatRowLayout]) {
    let removeCount = min(removeFromStart, rows.count)
    let removedHeight = rows.prefix(removeCount).reduce(CGFloat(0)) { $0 + $1.height }
    let previousOffset = collectionView.contentOffset.y

    let deleted = (0 ..< removeCount).map { IndexPath(item: $0, section: 0) }
    shownKeys.subtract(rows.prefix(removeCount).map(\.key))
    rows.removeFirst(removeCount)

    // A row that arrives while the user reads history plays no entrance when
    // they scroll down to it later.
    if !isPinnedToBottom {
      shownKeys.formUnion(append.map(\.key))
    }

    let reloaded = replaceRows(update, indexOffset: removeCount)
    let insertStart = rows.count
    rows.append(contentsOf: append)
    let inserted = (insertStart ..< rows.count).map { IndexPath(item: $0, section: 0) }

    guard !deleted.isEmpty || !inserted.isEmpty || !reloaded.isEmpty else {
      return
    }

    UIView.performWithoutAnimation {
      collectionView.performBatchUpdates {
        collectionView.deleteItems(at: deleted)
        collectionView.reloadItems(at: reloaded)
        collectionView.insertItems(at: inserted)
      }

      collectionView.layoutIfNeeded()
    }

    if isPinnedToBottom {
      scrollToBottom(animated: false)
    } else if removedHeight > 0 {
      // Rows above the viewport left; move by the same height so the rows the
      // user is reading stay still.
      collectionView.contentOffset.y = clampedOffset(previousOffset - removedHeight)
    }
  }

  /**
   * Swaps updated rows in place. Reloads use the index from before this
   * batch's deletes, so `indexOffset` adds those back.
   */
  private func replaceRows(_ update: [ChatRowLayout], indexOffset: Int) -> [IndexPath] {
    guard !update.isEmpty else {
      return []
    }

    let updates = Dictionary(update.map { ($0.key, $0) }, uniquingKeysWith: { _, last in last })
    var reloaded: [IndexPath] = []

    for index in rows.indices {
      if let updated = updates[rows[index].key] {
        rows[index] = updated
        reloaded.append(IndexPath(item: index + indexOffset, section: 0))
      }
    }

    return reloaded
  }

  private func scrollToBottom(animated: Bool) {
    collectionView.layoutIfNeeded()
    let bottom = collectionView.contentSize.height + collectionView.contentInset.bottom - collectionView.bounds.height
    collectionView.setContentOffset(CGPoint(x: 0, y: max(0, bottom)), animated: animated)
  }

  private func clampedOffset(_ offset: CGFloat) -> CGFloat {
    let maxOffset = collectionView.contentSize.height + collectionView.contentInset.bottom - collectionView.bounds
      .height
    return min(max(0, offset), max(0, maxOffset))
  }

  private func updateBottomInset() {
    let safeBottom = window?.safeAreaInsets.bottom ?? 0
    let bottom = composerInset + max(0, keyboardInset - safeBottom)

    guard collectionView.contentInset.bottom != bottom else {
      return
    }

    collectionView.contentInset.bottom = bottom
    collectionView.verticalScrollIndicatorInsets.bottom = bottom

    if isPinnedToBottom {
      scrollToBottom(animated: false)
    }
  }

  @objc private func keyboardWillChangeFrame(_ notification: Notification) {
    guard
      let window,
      let endFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect
    else {
      return
    }

    let frameInWindow = convert(bounds, to: window)
    keyboardInset = max(0, frameInWindow.maxY - endFrame.minY)

    let duration = notification.userInfo?[UIResponder.keyboardAnimationDurationUserInfoKey] as? Double ?? 0.25

    UIView.animate(withDuration: duration) {
      self.updateBottomInset()
    }
  }
}
