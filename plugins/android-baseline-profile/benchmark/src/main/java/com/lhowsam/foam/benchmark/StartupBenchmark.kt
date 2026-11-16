package com.lhowsam.foam.benchmark

import androidx.benchmark.macro.BaselineProfileMode
import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
  @get:Rule
  val rule = MacrobenchmarkRule()

  /**
   * Nothing compiled ahead of time, like a sideload before background dexopt.
   */
  @Test
  fun startupNoCompilation() = startup(CompilationMode.None())

  /**
   * Only the Baseline Profile compiled, like the first launch after a Play install or update.
   */
  @Test
  fun startupBaselineProfile() = startup(CompilationMode.Partial(BaselineProfileMode.Require))

  private fun startup(compilationMode: CompilationMode) = rule.measureRepeated(
    packageName = TARGET_PACKAGE,
    metrics = listOf(StartupTimingMetric()),
    compilationMode = compilationMode,
    startupMode = StartupMode.COLD,
    iterations = 15,
  ) {
    startAndWaitForTopStreams()
  }
}
