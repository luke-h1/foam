import ExpoModulesCore
import Foundation

public class ICloudSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudSync")

    Function("isAvailable") {
      FileManager.default.ubiquityIdentityToken != nil
    }

    AsyncFunction("getString") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.synchronize()
      return NSUbiquitousKeyValueStore.default.string(forKey: key)
    }

    AsyncFunction("setString") { (key: String, value: String) in
      let store = NSUbiquitousKeyValueStore.default
      store.set(value, forKey: key)
      store.synchronize()
    }

    AsyncFunction("remove") { (key: String) in
      let store = NSUbiquitousKeyValueStore.default
      store.removeObject(forKey: key)
      store.synchronize()
    }

    AsyncFunction("synchronize") {
      NSUbiquitousKeyValueStore.default.synchronize()
    }
  }
}
