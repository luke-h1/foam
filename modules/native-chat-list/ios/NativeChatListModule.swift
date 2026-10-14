import ExpoModulesCore

public class NativeChatListModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeChatList")

    View(NativeChatListView.self) {
      Events(
        "onScroll",
        "onScrollBeginDrag",
        "onScrollEndDrag",
        "onMomentumScrollBegin",
        "onMomentumScrollEnd",
        "onEndReached",
        "onRowPress",
        "onRowLongPress",
        "onVisibleKeysChange"
      )

      Prop("config") { (view: NativeChatListView, config: ChatListConfigRecord) in
        view.setConfig(config)
      }

      Prop("composerInset") { (view: NativeChatListView, inset: Double) in
        view.setComposerInset(CGFloat(inset))
      }

      AsyncFunction("apply") { (view: NativeChatListView, batch: ChatListBatchRecord) in
        view.apply(batch)
      }
      .runOnQueue(.main)

      AsyncFunction("scrollToEnd") { (view: NativeChatListView, animated: Bool) in
        view.scrollToEnd(animated: animated)
      }
      .runOnQueue(.main)

      AsyncFunction("scrollToKey") { (view: NativeChatListView, key: String, animated: Bool, viewPosition: Double) in
        view.scrollToKey(key, animated: animated, viewPosition: CGFloat(viewPosition))
      }
      .runOnQueue(.main)
    }
  }
}
