package com.lhowsam.foam.benchmark

import android.app.KeyguardManager
import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until
import java.util.regex.Pattern

val TARGET_PACKAGE: String =
  checkNotNull(InstrumentationRegistry.getArguments().getString("targetPackage"))

private val TOP_STREAMS_LIST = By.res(Pattern.compile(".*top-streams-list"))

private val STREAM_PLAYER = By.res(Pattern.compile(".*stream-player-container"))

private val CHAT_MESSAGE = By.res(Pattern.compile(".*chat-message"))

private val CHAT_LIST = By.scrollable(true).hasDescendant(CHAT_MESSAGE)

// Only Just Chatting: logged out, the WebView player gates mature categories behind a login.
private val STREAM_CARD = By.desc(Pattern.compile(".*, live, Just Chatting,.*"))

private const val SLOW_MOUNT_TIMEOUT_MS = 30_000L

fun MacrobenchmarkScope.startAndWaitForTopStreams() {
  val keyguard =
    InstrumentationRegistry.getInstrumentation().context.getSystemService(KeyguardManager::class.java)
  check(device.isScreenOn && !keyguard.isKeyguardLocked) {
    "The device is asleep or locked. Unlock it and turn on Stay awake in Developer options."
  }

  pressHome()
  startActivityAndWait()

  check(device.wait(Until.hasObject(TOP_STREAMS_LIST), SLOW_MOUNT_TIMEOUT_MS)) {
    "The Top streams list did not load in 30s. Finish onboarding on the benchmark build and stay logged out."
  }
  device.waitForIdle()
}

/**
 * Flings the list clear of the screen edges, where gesture navigation would
 * otherwise take the swipe.
 */
private fun MacrobenchmarkScope.flingList(
  list: UiObject2,
  direction: Direction,
  times: Int = 1,
) {
  list.setGestureMargin(device.displayWidth / 5)

  repeat(times) {
    list.fling(direction)
    device.waitForIdle()
  }
}

fun MacrobenchmarkScope.flingTopStreams() {
  val list = checkNotNull(device.findObject(TOP_STREAMS_LIST)) { "Could not find the Top streams list" }

  flingList(list, Direction.DOWN, 3)
  flingList(list, Direction.UP, 3)
}

private fun MacrobenchmarkScope.findJustChattingCard(): UiObject2 {
  repeat(6) {
    device.wait(Until.findObject(STREAM_CARD), 2_000)?.let { return it }

    val list = checkNotNull(device.wait(Until.findObject(TOP_STREAMS_LIST), 5_000)) {
      "Could not find the Top streams list"
    }
    flingList(list, Direction.DOWN)
  }

  error("No Just Chatting stream on Top after scrolling")
}

fun MacrobenchmarkScope.openTopStream() {
  val card = findJustChattingCard()

  val bounds = card.visibleBounds
  device.click(bounds.left + bounds.width() / 5, bounds.centerY())

  check(device.wait(Until.hasObject(STREAM_PLAYER), SLOW_MOUNT_TIMEOUT_MS)) { "The stream player did not appear in 30s" }
  check(device.wait(Until.hasObject(CHAT_MESSAGE), SLOW_MOUNT_TIMEOUT_MS)) { "No chat messages appeared in 30s" }
}

fun MacrobenchmarkScope.watchAndFlingChat() {
  Thread.sleep(8_000)

  val chat = checkNotNull(device.findObject(CHAT_LIST)) { "Could not find the chat list" }

  flingList(chat, Direction.UP, 2)
  flingList(chat, Direction.DOWN, 3)

  Thread.sleep(5_000)
}

fun MacrobenchmarkScope.leaveStream() {
  repeat(4) {
    device.pressBack()

    if (device.wait(Until.hasObject(TOP_STREAMS_LIST), 5_000) != null) {
      return
    }
  }

  error("Did not return to Top after leaving the stream")
}
