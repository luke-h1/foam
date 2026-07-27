package expo.modules.cpuusage

import android.os.SystemClock
import android.system.Os
import android.system.OsConstants
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class CpuUsageModule : Module() {
  private var lastProcessMs = 0L
  private var lastWallMs = 0L
  private var hasBaseline = false

  private val clockTck = Os.sysconf(OsConstants._SC_CLK_TCK).coerceAtLeast(1L)

  override fun definition() = ModuleDefinition {
    Name("CpuUsage")

    Function("getUsage") {
      currentCpuUsage()
    }
  }

  private fun currentCpuUsage(): Double {
    val processMs = readProcessCpuMs() ?: return 0.0
    val wallMs = SystemClock.uptimeMillis()

    if (!hasBaseline) {
      lastProcessMs = processMs
      lastWallMs = wallMs
      hasBaseline = true
      return 0.0
    }

    val processDelta = processMs - lastProcessMs
    val wallDelta = wallMs - lastWallMs

    lastProcessMs = processMs
    lastWallMs = wallMs

    if (wallDelta <= 0L || processDelta < 0L) {
      return 0.0
    }

    return (processDelta.toDouble() / wallDelta.toDouble()) * 100.0
  }

  private fun readProcessCpuMs(): Long? = runCatching {
    val stat = File("/proc/self/stat").readText()
    val afterComm = stat.substring(stat.lastIndexOf(')') + 1).trim()
    val fields = afterComm.split(Regex("\\s+"))

    val utime = fields[11].toLong()
    val stime = fields[12].toLong()
    (utime + stime) * 1000L / clockTck
  }.getOrNull()
}
