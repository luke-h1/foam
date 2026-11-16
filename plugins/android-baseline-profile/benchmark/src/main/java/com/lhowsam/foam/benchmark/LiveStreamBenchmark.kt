package com.lhowsam.foam.benchmark

import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.FrameTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The first stream open after a cold start: the WebView player loads, chat
 * connects and floods, and the user flings through chat history.
 */
@RunWith(AndroidJUnit4::class)
class LiveStreamBenchmark {
  @get:Rule
  val rule = MacrobenchmarkRule()

  @Test
  fun liveStreamNoCompilation() = liveStream(CompilationMode.None())

  @Test
  fun liveStreamBaselineProfile() = liveStream(CompilationMode.Partial(BaselineProfileMode.Require))

  private fun liveStream(compilationMode: CompilationMode) = rule.measureRepeated(
    packageName = TARGET_PACKAGE,
    metrics = listOf(FrameTimingMetric()),
    compilationMode = compilationMode,
    iterations = 10,
  ) {
    // Kill first, so startActivityAndWait cold-starts to Top instead of resuming the stream
    killProcess()
    startAndWaitForTopStreams()
    openTopStream()
    watchAndFlingChat()
    leaveStream()
  }
}
