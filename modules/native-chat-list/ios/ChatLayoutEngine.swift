import UIKit

/**
 * The result of one batch, ready for the main thread to apply.
 */
enum ChatLayoutChange {
  case reset([ChatRowLayout])
  case incremental(removeFromStart: Int, append: [ChatRowLayout], update: [ChatRowLayout])
}

/**
 * Owns the row records and the text style table, and lays rows out on a
 * serial background queue. Every method is called on the main thread;
 * completions run on the main thread in the order the calls were made.
 */
final class ChatLayoutEngine {
  private let queue = DispatchQueue(label: "tv.foam.native-chat-list.layout", qos: .userInitiated)
  private let paints = ChatPaintRenderer()

  // Read and written on `queue` only.
  private var records: [ChatRowRecord] = []
  private var styles: [ChatTextStyle] = []
  private var width: CGFloat = 0
  private var scale: CGFloat = 0

  func apply(_ batch: ChatListBatchRecord, completion: @escaping (ChatLayoutChange) -> Void) {
    queue.async { [self] in
      if let table = batch.styles {
        styles = table.map(ChatTextStyle.init(record:))
      }

      if let reset = batch.reset {
        records = reset
        deliver(.reset(layoutAll()), completion)
        return
      }

      let removeCount = min(batch.removeFromStart, records.count)
      records.removeFirst(removeCount)

      let updatedKeys = replace(batch.update)
      records.append(contentsOf: batch.append)

      guard let context = makeContext() else {
        return
      }

      let appended = batch.append.map { ChatRowLayout(record: $0, context: context) }

      let updated = batch.update
        .filter { updatedKeys.contains($0.key) }
        .map { ChatRowLayout(record: $0, context: context) }

      deliver(.incremental(removeFromStart: removeCount, append: appended, update: updated), completion)
    }
  }

  /**
   * Lays every row out again for a new width or screen scale.
   */
  func relayout(
    width newWidth: CGFloat,
    scale newScale: CGFloat,
    completion: @escaping (ChatLayoutChange) -> Void
  ) {
    queue.async { [self] in
      width = newWidth
      scale = newScale
      deliver(.reset(layoutAll()), completion)
    }
  }

  /**
   * Swaps in updated records and returns the keys that were present.
   */
  private func replace(_ update: [ChatRowRecord]) -> Set<String> {
    guard !update.isEmpty else {
      return []
    }

    let updates = Dictionary(update.map { ($0.key, $0) }, uniquingKeysWith: { _, last in last })
    var updatedKeys = Set<String>()

    for index in records.indices {
      if let updated = updates[records[index].key] {
        records[index] = updated
        updatedKeys.insert(updated.key)
      }
    }

    return updatedKeys
  }

  private func makeContext() -> ChatLayoutContext? {
    guard width > 0, scale > 0 else {
      return nil
    }

    return ChatLayoutContext(width: width, styles: styles, scale: scale, paints: paints)
  }

  private func layoutAll() -> [ChatRowLayout] {
    guard let context = makeContext() else {
      return []
    }

    return records.map { ChatRowLayout(record: $0, context: context) }
  }

  private func deliver(_ change: ChatLayoutChange, _ completion: @escaping (ChatLayoutChange) -> Void) {
    DispatchQueue.main.async {
      completion(change)
    }
  }
}
