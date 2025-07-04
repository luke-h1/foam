import ActivityKit
import SwiftUI

public struct MyLiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable & Hashable {}

  public typealias MyLiveActivityState = ContentState

  public let customString: String
  public let customNumber: Int
}
