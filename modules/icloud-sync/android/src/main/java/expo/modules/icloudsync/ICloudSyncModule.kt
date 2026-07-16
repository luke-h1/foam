package expo.modules.icloudsync

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ICloudSyncModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ICloudSync")

    Function("isAvailable") {
      false
    }

    AsyncFunction("getString") { _: String ->
      null as String?
    }

    AsyncFunction("setString") { _: String, _: String ->
    }

    AsyncFunction("remove") { _: String ->
    }

    AsyncFunction("synchronize") {
      false
    }
  }
}
