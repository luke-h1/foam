package com.lhowsam.foam.benchmark

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
  @get:Rule
  val rule = BaselineProfileRule()

  @Test
  fun generate() = rule.collect(packageName = TARGET_PACKAGE) {
    startAndWaitForTopStreams()
    flingTopStreams()

    repeat(2) {
      openTopStream()
      watchAndFlingChat()
      leaveStream()
    }
  }
}
