import UIKit

/**
 * Distance from the end, in points, that still counts as "at the bottom".
 * Matches `RETURN_TO_BOTTOM_THRESHOLD` in `use-chat-scroll.ts`.
 */
private let pinnedToBottomThreshold: CGFloat = 80

/**
 * `use-chat-scroll.ts` only needs scroll events while the user drags or
 * flings, so they are throttled rather than sent every frame.
 */
private let scrollEventInterval: CFTimeInterval = 0.1

private let visibleKeysInterval: CFTimeInterval = 0.25

/**
 * How long the list must stay still before animated images resume. Matches
 * `SETTLE_MS` in `create-scroll-activity.ts`.
 */
private let scrollSettleDelay: TimeInterval = 0.15

extension NativeChatListView: UICollectionViewDelegateFlowLayout {
  func collectionView(
    _ collectionView: UICollectionView,
    layout _: UICollectionViewLayout,
    sizeForItemAt indexPath: IndexPath
  ) -> CGSize {
    guard indexPath.item < rows.count else {
      return .zero
    }

    let row = rows[indexPath.item]
    return CGSize(width: collectionView.bounds.width, height: row.height)
  }

  func collectionView(_: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
    guard indexPath.item < rows.count, let rowCell = cell as? ChatRowCell else {
      return
    }

    let row = rows[indexPath.item]

    guard shownKeys.insert(row.key).inserted, row.animateEntrance else {
      return
    }

    rowCell.playEntrance()
  }

  func scrollViewWillBeginDragging(_: UIScrollView) {
    beginScrollActivity()
    onScrollBeginDrag(scrollPayload())
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    guard scrollView.isDragging || scrollView.isDecelerating else {
      return
    }

    let shouldPin = distanceFromEnd() <= pinnedToBottomThreshold

    if shouldPin != isPinnedToBottom {
      isPinnedToBottom = shouldPin

      if shouldPin {
        onEndReached([:])
      }
    }

    let now = CACurrentMediaTime()

    if now - lastScrollEventTime >= scrollEventInterval {
      lastScrollEventTime = now
      onScroll(scrollPayload())
    }

    emitVisibleKeys(force: false)
  }

  func scrollViewDidEndDragging(_: UIScrollView, willDecelerate decelerate: Bool) {
    onScroll(scrollPayload())
    onScrollEndDrag(scrollPayload())

    if !decelerate {
      emitVisibleKeys(force: true)
      endScrollActivity()
    }
  }

  func scrollViewWillBeginDecelerating(_: UIScrollView) {
    onMomentumScrollBegin(scrollPayload())
  }

  func scrollViewDidEndDecelerating(_: UIScrollView) {
    onScroll(scrollPayload())
    onMomentumScrollEnd(scrollPayload())
    emitVisibleKeys(force: true)
    endScrollActivity()
  }

  private func beginScrollActivity() {
    scrollSettleWork?.cancel()
    scrollSettleWork = nil

    guard !isScrollActive else {
      return
    }

    isScrollActive = true
    updateVisibleAnimation()
  }

  private func endScrollActivity() {
    scrollSettleWork?.cancel()

    let work = DispatchWorkItem { [weak self] in
      self?.isScrollActive = false
      self?.updateVisibleAnimation()
    }

    scrollSettleWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + scrollSettleDelay, execute: work)
  }

  func emitVisibleKeys(force: Bool) {
    let now = CACurrentMediaTime()

    guard force || now - lastVisibleKeysTime >= visibleKeysInterval else {
      return
    }

    lastVisibleKeysTime = now

    let keys = collectionView.indexPathsForVisibleItems
      .map(\.item)
      .sorted()
      .compactMap { $0 < rows.count ? rows[$0].key : nil }

    guard keys != lastVisibleKeys else {
      return
    }

    lastVisibleKeys = keys
    onVisibleKeysChange(["keys": keys])
  }

  /**
   * The shape of a React Native scroll event, so `use-chat-scroll.ts` reads it
   * unchanged. The bottom inset is part of the content height, because the
   * hook measures the distance to the end without insets.
   */
  private func scrollPayload() -> [String: Any] {
    let size = collectionView.bounds.size

    return [
      "contentOffset": ["x": 0, "y": collectionView.contentOffset.y],
      "contentSize": [
        "width": size.width,
        "height": collectionView.contentSize.height + collectionView.contentInset.bottom
      ],
      "layoutMeasurement": ["width": size.width, "height": size.height]
    ]
  }

  private func distanceFromEnd() -> CGFloat {
    let maxOffset = collectionView.contentSize.height + collectionView.contentInset.bottom - collectionView.bounds
      .height
    return max(0, maxOffset - collectionView.contentOffset.y)
  }
}
