import UIKit

extension NativeChatListView: UICollectionViewDataSource {
  func collectionView(_: UICollectionView, numberOfItemsInSection _: Int) -> Int {
    rows.count
  }

  func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
    let cell = collectionView.dequeueReusableCell(withReuseIdentifier: ChatRowCell.reuseIdentifier, for: indexPath)

    guard let rowCell = cell as? ChatRowCell, indexPath.item < rows.count else {
      return cell
    }

    let row = rows[indexPath.item]
    let key = row.key
    rowCell.configure(with: row, appContext: appContext, animating: emotesAnimating)

    rowCell.onAccessibilityAction = { [weak self] target in
      self?.sendAccessibilityAction(key: key, target: target)
    }

    return rowCell
  }
}

// MARK: - Presses

extension NativeChatListView {
  private func hit(at location: CGPoint) -> (row: ChatRowLayout, target: ChatRowTarget?)? {
    guard
      let indexPath = collectionView.indexPathForItem(at: location),
      indexPath.item < rows.count,
      let cell = collectionView.cellForItem(at: indexPath)
    else {
      return nil
    }

    let row = rows[indexPath.item]
    let point = collectionView.convert(location, to: cell.contentView)
    return (row, row.target(at: point))
  }

  @objc func handleTap(_ recognizer: UITapGestureRecognizer) {
    guard let hit = hit(at: recognizer.location(in: collectionView)), let target = hit.target else {
      return
    }

    onRowPress(["key": hit.row.key, "target": target.kind, "index": target.index])
  }

  @objc func handleLongPress(_ recognizer: UILongPressGestureRecognizer) {
    guard recognizer.state == .began, let hit = hit(at: recognizer.location(in: collectionView)) else {
      return
    }

    onRowLongPress([
      "key": hit.row.key,
      "target": hit.target?.kind ?? "row",
      "index": hit.target?.index ?? -1
    ])
  }

  /**
   * VoiceOver custom actions send the same events a press would.
   */
  func sendAccessibilityAction(key: String, target: String) {
    let payload: [String: Any] = ["key": key, "target": target, "index": -1]

    if target == "row" {
      onRowLongPress(payload)
    } else {
      onRowPress(payload)
    }
  }
}
