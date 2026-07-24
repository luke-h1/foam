import ExpoModulesCore
import Foundation
import OSLog

/**
 * JS bridge for `OSSignposter` Points of Interest so Instruments can line up
 * Foam events with CPU / frame timelines.
 *
 * Signpost names must be `StaticString`, so the lane is always "Foam" and the
 * JS label goes in the message (visible in the Points of Interest detail).
 */
public class SignpostModule: Module {
  private let signposter = OSSignposter(
    subsystem: Bundle.main.bundleIdentifier ?? "tv.foam",
    category: .pointsOfInterest
  )

  private var intervals: [String: OSSignpostIntervalState] = [:]
  private let lock = NSLock()

  public func definition() -> ModuleDefinition {
    Name("Signpost")

    Function("mark") { (name: String) in
      let id = self.signposter.makeSignpostID()
      self.signposter.emitEvent("Foam", id: id, "\(name)")
    }

    Function("begin") { (name: String) in
      let id = self.signposter.makeSignpostID()
      let state = self.signposter.beginInterval("Foam", id: id, "\(name)")
      self.lock.lock()
      let previous = self.intervals.removeValue(forKey: name)
      self.intervals[name] = state
      self.lock.unlock()
      if let previous {
        self.signposter.endInterval("Foam", previous)
      }
    }

    Function("end") { (name: String) in
      self.lock.lock()
      let state = self.intervals.removeValue(forKey: name)
      self.lock.unlock()
      guard let state else {
        return
      }
      self.signposter.endInterval("Foam", state)
    }
  }
}
