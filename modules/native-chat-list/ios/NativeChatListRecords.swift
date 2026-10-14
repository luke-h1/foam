import ExpoModulesCore

/**
 * The records mirror the types in `NativeChatList.types.ts`. Read the field
 * comments there.
 */
struct ChatTextStyleRecord: Record {
  @Field var color: String = "#EDEDED"
  @Field var fontFamily: String?
  @Field var fontSize: Double = 14
  @Field var letterSpacing: Double = 0
  @Field var lineHeight: Double = 21
  @Field var opacity: Double = 1
  @Field var strikethrough: Bool = false
  @Field var underline: Bool = false
}

struct ChatEmoteOverlayRecord: Record {
  @Field var url: String = ""
  @Field var width: Double = 0
  @Field var height: Double = 0
  @Field var x: Double = 0
  @Field var y: Double = 0
}

struct ChatSpanRecord: Record {
  @Field var kind: String = "text"
  @Field var text: String = ""
  @Field var style: Int = 0
  @Field var color: String?
  @Field var url: String?
  @Field var width: Double?
  @Field var height: Double?
  @Field var overlays: [ChatEmoteOverlayRecord] = []
  @Field var overlapPrevious: Double?
  @Field var opacity: Double?
  @Field var marginRight: Double?
  @Field var tint: String?
  @Field var index: Int = -1
}

struct ChatLineIconRecord: Record {
  @Field var color: String = "#EDEDED"
  @Field var marginRight: Double = 4
  @Field var name: String = ""
  @Field var size: Double = 12
}

struct ChatLineBackgroundRecord: Record {
  @Field var color: String = ""
  @Field var paddingHorizontal: Double = 0
  @Field var paddingVertical: Double = 0
  @Field var radius: Double = 0
}

struct ChatLineRecord: Record {
  @Field var background: ChatLineBackgroundRecord?
  @Field var icon: ChatLineIconRecord?
  @Field var lineHeight: Double = 21
  @Field var marginBottom: Double = 0
  @Field var numberOfLines: Int = 0
  @Field var pressTarget: String?
  @Field var strikeColor: String?
  @Field var spans: [ChatSpanRecord] = []
}

struct ChatRowSurfaceRecord: Record {
  @Field var backgroundColor: String?
  @Field var borderLeftColor: String?
  @Field var borderLeftWidth: Double = 0
  @Field var marginVertical: Double = 0
  @Field var paddingBottom: Double = 0
  @Field var paddingLeft: Double = 0
  @Field var paddingRight: Double = 0
  @Field var paddingTop: Double = 0
}

struct ChatPaintShadowRecord: Record {
  @Field var blur: Double = 0
  @Field var color: String = ""
  @Field var x: Double = 0
  @Field var y: Double = 0
}

struct ChatPaintLayerRecord: Record {
  @Field var kind: String = "linear"
  @Field var opacity: Double = 1
  @Field var at: [Double]?
  @Field var size: [Double]?
  @Field var colors: [String] = []
  @Field var locations: [Double] = []
  @Field var angle: Double = 0
  @Field var ellipse: Bool = false
  @Field var url: String?
  @Field var tile: String = "none"
}

struct ChatPaintStrokeRecord: Record {
  @Field var color: String = ""
  @Field var width: Double = 0
}

struct ChatPaintInsetsRecord: Record {
  @Field var bottom: Double = 0
  @Field var left: Double = 0
  @Field var right: Double = 0
  @Field var top: Double = 0
}

struct ChatPaintRecord: Record {
  @Field var key: String = ""
  @Field var baseColor: String = ""
  @Field var dropShadows: [ChatPaintShadowRecord] = []
  @Field var insets: ChatPaintInsetsRecord = .init()
  @Field var layers: [ChatPaintLayerRecord] = []
  @Field var stroke: ChatPaintStrokeRecord?
  @Field var textShadows: [ChatPaintShadowRecord] = []
}

struct ChatRowRecord: Record {
  @Field var key: String = ""
  @Field var accessibilityLabel: String = ""
  @Field var animateEntrance: Bool = false
  @Field var canJumpToReply: Bool = false
  @Field var canOpenProfile: Bool = false
  @Field var lines: [ChatLineRecord] = []
  @Field var paint: ChatPaintRecord?
  @Field var surface: ChatRowSurfaceRecord = .init()
}

struct ChatListBatchRecord: Record {
  @Field var reset: [ChatRowRecord]?
  @Field var removeFromStart: Int = 0
  @Field var append: [ChatRowRecord] = []
  @Field var update: [ChatRowRecord] = []
  @Field var styles: [ChatTextStyleRecord]?
}

struct ChatListConfigRecord: Record {
  @Field var animateEmotes: Bool = true
}
