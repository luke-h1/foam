package expo.modules.fullydrawn

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FullyDrawnModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FullyDrawn")

    Function("report") {
      val activity = appContext.currentActivity ?: return@Function
      activity.runOnUiThread { activity.reportFullyDrawn() }
    }
  }
}
