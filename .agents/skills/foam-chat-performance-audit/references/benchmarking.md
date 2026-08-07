# Head-to-head benchmarking

Use only when comparing against another app. "Faster than X" is a claim that needs a method, or it is marketing.

## 1. Name the structural gap first

Before measuring anything, state what the comparison actually is. An app built on a different UI stack may not pay for the same per-frame work this app does - per unit of work rendered it may win permanently. Pretending otherwise makes the whole report untrustworthy, and it points the work in the wrong direction.

**The winnable game is almost always work avoided.** High-throughput surfaces are usually a firehose of near-duplicate content where most items do not need to become a distinct render. The apps that feel fastest do the least per item, not the most per millisecond. Frame the frontier accordingly: coalescing, caching, admission gates, and deleted work beat micro-optimisation every time.

## 2. Control the comparison

- **Same physical device**, same OS build, same network, same brightness, same battery state. Cross-device comparisons are worthless.
- **Screen-record at high frame rate** (240fps if the hardware allows) so dropped frames are visible independently of instrumentation.
- **Match the feature set.** Same content providers, same visual density, same font size, same optional enrichments enabled. Rendering richer content than the other app and then losing on frame rate is not a finding — it is a category error.
- **Fix the scenario.** Pick the load, record it precisely, and use the same one for every run. If the load comes from live data, note that it is not reproducible and treat single runs as indicative rather than conclusive.

## 3. Measure three things, not one

Frame rate alone hides more than it reveals.

| Metric | How | Why it matters |
| --- | --- | --- |
| Sustained and worst-case frame time over 60s | Instruments (iOS), Perfetto (Android) | The worst frame is what the user perceives as jank |
| End-to-end latency, input arrival → visible pixel | Timestamped instrumentation, or high-speed video against a known event | A coalescing interval sets a floor here; state it |
| CPU and thermal state over 10 minutes | Platform profiler, or the app's own CPU instrumentation | An app that wins for 60s and throttles at minute six has lost |

## 4. Report the loss cases explicitly

This is the part that gets omitted and shouldn't.

If a deliberate trade-off makes the other app look better on some axis — a coalescing interval that caps update frequency, a commit cap that lets the app fall behind under load, a quality setting that costs frames — that belongs in the report next to the numbers you won on. A benchmark that only reports favourable columns is not evidence, and anyone who checks will stop believing the rest of it.

State plainly which axes were lost and whether the cause is a fixable implementation detail or a structural property of the platform.

## 5. Record raw numbers, not a verdict

```json
{
  "date": "2026-08-07",
  "device": "Pixel 8, Android 15, Release",
  "scenario": "live feed, ~45 items/s sustained, 60s",
  "featureParity": "same providers enabled both apps; theirs lacks cosmetic layer, disabled in ours",
  "results": {
    "ours":       { "meanFrameMs": 9.1, "worstFrameMs": 34, "latencyMs": 140, "cpu10min": "22%" },
    "theirs":     { "meanFrameMs": 7.4, "worstFrameMs": 19, "latencyMs": 40,  "cpu10min": "17%" }
  },
  "lossCases": [
    "latency floor set by our 100ms coalescing interval — deliberate, see issue #594",
    "worst-frame gap traced to item mount cost with recycling disabled — fixable, see F1"
  ]
}
```

A verdict field is deliberately absent. The numbers and the loss cases are the output; whether that is good enough is a product decision, not an audit result.
