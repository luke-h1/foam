import Darwin
import ExpoModulesCore
import Foundation

/**
 * Exposes the process's pre-jetsam memory headroom to JS so the decoded-image
 * caches can be trimmed before iOS kills the app.
 *
 * `os_proc_available_memory()` returns the number of bytes remaining before this
 * process hits its iOS memory limit and is killed. It is the reliable signal for
 * proactive image-cache eviction — `didReceiveMemoryWarning` fires late, often
 * after the allocation that already tipped the process over. Returns 0 when the
 * value is unavailable (the caller treats 0 as "monitoring disabled").
 */
public class ImageMemoryPressureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ImageMemoryPressure")

    Function("getAvailableMemory") { () -> Double in
      Self.availableMemoryBytes()
    }
  }

  private static func availableMemoryBytes() -> Double {
    let available = os_proc_available_memory()
    return available > 0 ? Double(available) : 0
  }
}
