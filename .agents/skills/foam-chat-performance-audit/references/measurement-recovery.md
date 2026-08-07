# Measurement recovery

The blessed harness will sometimes be broken in the environment you have. The failure mode to avoid is silently downgrading to code reading and presenting it as an audit. The second-worst is burning an hour rediscovering a known-broken tool. Work through these in order, record which rung you landed on, and label the evidence accordingly.

## iOS native tracing on a simulator

`xctrace record` against a simulator can hang indefinitely after its `--time-limit` elapses, in both `--attach` and `--all-processes` modes, depending on the Xcode/simulator-runtime pairing. The tells:

- The `.trace` bundle contains only `Trace1.run/RunIssues.storedata` and nothing else. That is an **empty** trace, not a slow one.
- `xctrace export --toc` fails with `Document Missing Template Error` - that error means "no run data", not "wrong template name".
- Sending the hung `xctrace` a plain `SIGTERM` sometimes triggers finalisation and lets a wrapping script continue - but verify the bundle actually has run data before trusting it. A zero-byte finalisation exits cleanly too.

Retrying with a different target mode (`--attach` vs `--all-processes`) is worth exactly one attempt each. If both produce empty bundles, the tool is broken for this environment; stop retrying and drop a rung.

### Fallback: `sample` on the simulator process

A simulator app is a host macOS process, so the standard macOS profiler works on it with no setup:

```bash
pgrep -fl "<AppBinaryName>"                 # find the sim app's host pid
sample <pid> 15 -file /tmp/app-sample.txt   # 15s, 1ms interval
```

The `Sort by top of stack` section at the bottom is the quick read: Hermes `Interpreter::interpretFunction` samples ≈ JS-thread busy share, `HadesGC` entries ≈ GC pressure, `vImage`/codec entries ≈ image and video decode on background queues. The full per-thread trees name the threads (`com.facebook.react.runtime.JavaScript` is the JS thread).

Label the result **dev-build, directional**. It is real call-stack evidence and fine for "which thread, which subsystem, roughly what share" - it is not a release frame-time number and must never be reported as one.

**Close the React DevTools daemon before sampling.** An attached DevTools bridge continuously serialises the component tree, and it inflates every JS-side share in the profile - measured on this app: JSON 8.9% → 2.6%, GC 7.1% → 4.5%, interpreter 10.9% → 8.6% after closing the daemon and relaunching. Check with `react-devtools status` ("Apps: 1 connected" means contaminated) and close the driver session before capturing.

### Fallback below that: physical device

If a physical device is attached and unlocked, `xctrace` against it is usually fine even when the simulator path is broken. Check with `xcrun xctrace list devices` - devices listed under "Devices Offline" are not usable.

## React DevTools profiling via a driver (agent-device or similar)

Three failures that all present as "timed out waiting for connection", in the order to check them:

1. **Metro is dead.** `curl -s localhost:8081/status` must return `packager-status:running`. A dev-client app without its bundle server sits on the launcher screen and will never connect to anything. Metro dying mid-session is common (closed terminal, killed session); restart it with the repo's own start script and relaunch the app.
2. **The DevTools daemon started after the app.** The app only connects to the bridge if the daemon was listening at JS init. Fix: verify the daemon (`react-devtools status` - "Apps: 0 connected" with a running daemon is the tell), then terminate and relaunch the app, then wait for the connection.
3. **A stale driver session owns the device.** `DEVICE_IN_USE` errors mean a previous session holds the device; close it (`agent-device close --session <name>`) rather than fighting it with env overrides.

## Reassure with uncommitted changes (stash-baseline protocol)

To measure working-tree changes against HEAD when nothing is committed:

```bash
git stash push -m "perf-baseline"     # tracked changes only; new untracked perf tests stay put
bunx reassure --baseline --testMatch "**/relevant.perf-test.ts" [--testMatch ...]
git stash pop
bunx reassure --testMatch "**/relevant.perf-test.ts" [--testMatch ...]
```

- Scope with `--testMatch` to the affected suites; a full run buries the signal in unrelated noise and takes far longer.
- New perf-test files can stay untracked through both runs - the baseline then measures old code under the new test, which is exactly what you want.
- **Report non-significant results honestly.** An allocation/GC win frequently does not move a duration statistic whose stability is 20-30%. "Directionally consistent but under the noise floor; the claimed win is allocation, which this harness cannot resolve" is a valid and useful conclusion. Do not launder it into a win.
- Transient `index.lock` errors usually mean an editor's git integration touched the repo a moment ago; re-check for the lock before assuming a stuck process, and never delete a lock while a real git process is alive.

## Recording which rung you landed on

Every number in the report carries its provenance:

```json
{
  "evidence": "sample(1ms) on sim host process, dev build - directional only",
  "harnessState": "perf:chat:ios broken in this env: xctrace produces empty trace bundles (attach and all-processes); fell back to sample"
}
```

A broken blessed harness is itself a finding worth one line in the report - the next auditor should not have to rediscover it.
