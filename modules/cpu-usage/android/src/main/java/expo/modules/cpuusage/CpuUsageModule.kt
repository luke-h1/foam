package expo.modules.cpuusage

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class CpuUsageModule : Module() {
  private var lastProcessTicks = 0L
  private var lastTotalTicks = 0L
  private var hasBaseline = false

  override fun definition() = ModuleDefinition {
    Name("CpuUsage")

    Function("getUsage") {
      currentCpuUsage()
    }
  }

  /**
   * Process CPU% since previous call - scale by core count of phone so it matches the iOS
   * native module 'sum across all threads'
   * returns 0 on first call or when /proc is unreadable
   */
  private fun currentCpuUsage(): Double {
    val processTicks = readProcessTicks() ?: return 0.0
    val totalTicks = readTotalCpuTicks() ?: return 0.0

    if (!hasBaseline) {
      lastProcessTicks = processTicks
      lastTotalTicks = totalTicks
      hasBaseline = true
      return 0.0
    }

    val processDelta = processTicks - lastProcessTicks
    val totalDelta = totalTicks - lastTotalTicks

    lastProcessTicks = processTicks
    lastTotalTicks = totalTicks

    if (totalDelta <= 0L || processDelta < 0L) {
      return 0.0
    }

    val cores = Runtime.getRuntime().availableProcessors().coerceAtLeast(1)
    return (processDelta.toDouble() / totalDelta.toDouble()) * 100.0 * cores
  }

  /**
   * utime + stime from /proc/self/stat in clock ticks
   */
  private fun readProcessTicks(): Long? {
    return runCatching {
      val stat = File("/proc/self/stat").readText()
      val afterComm = stat.substring(stat.lastIndexOf(')') + 1).trim()
      val fields = afterComm.split(Regex("\\s+"))

      val utime = fields[11].toLong()
      val stime = fields[12].toLong()
      utime + stime
    }.getOrNull()
  }

  /**
   * Sum of all jiffies on the first line of /proc/stat
   */
  private fun readTotalCpuTicks(): Long? {
    return runCatching {
      val firstLine = File("/proc/stat").bufferedReader().use { it.readLine() }
      firstLine
        .split(Regex("\\s+"))
        .drop(1)
        .filter { it.isNotEmpty() }
        .sumOf { it.toLong() }
    }.getOrNull()
  }
}
