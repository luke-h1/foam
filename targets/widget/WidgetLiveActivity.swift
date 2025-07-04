import ActivityKit
import WidgetKit
import SwiftUI

struct WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
      ActivityConfiguration(for: MyLiveActivityAttributes.self) { context in
            VStack {
              Text(context.attributes.customString)
            }
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom")
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T")
            } minimal: {
                Text("M")
            }
        }
    }
}

#Preview(
  "Lockscreen View",
  as: .content,
  using: MyLiveActivityAttributes(customString: "Hello World", customNumber: 1)
) {
  WidgetLiveActivity()
} contentStates: {
  MyLiveActivityAttributes.MyLiveActivityState()
}
