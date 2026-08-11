# Defer extracting the auth bootstrap out of AuthContext

`AuthContext`'s `populateAuthState` / `doAuth` / `doAnonAuth` orchestrate
cold-start auth as nested async closures that interleave network calls (validate,
refresh, getUserInfo, getDefaultToken) with state setters, SecureStore writes,
`twitchApi` token injection, and prefetch. Extracting a decision module — even
just the pure stored-token routing — would make the bootstrap unit-testable
without rendering the provider.

We tried the smallest safe slice (a pure `planAuthBootstrap` for the
stored-token parse + precedence) twice and **reverted it both times**, for two
distinct reasons:

1. **Test fragility (now fixed).** `AuthContext.test` used `mockResolvedValueOnce`
   chains with `clearAllMocks`, which does not drain once-queues, so the tests
   were call-count fragile and the refactor leaked stale queued values between
   tests. This has been hardened independently (see below) and is no longer a
   blocker.
2. **A background-validation microtask race (the remaining blocker).** Even with
   hardened tests, the routing switch is behaviour-identical yet deterministically
   flips `App startup › handles invalid anon token`. `doAnonAuth` sets the anon
   token optimistically and fires `validateToken().then(...)`, whose re-fetch
   bails unless `authStateRef` already reflects the committed state. With a mocked
   `validateToken` resolving in a microtask, this races the render; the
   (otherwise identical) refactor nudges the ordering enough to lose it. Making it
   deterministic means changing the optimistic-auth background-revalidation — the
   high-risk path (implicit-grant expiry, optimistic-ready, startup-timeout race;
   a regression logs users out or breaks cold start).

The high-value, safe auth extraction is already done: the pure token lifecycle
(`tokenLifecycle.ts`), unit-tested.

If revisited, do it **test-first**: stabilise the background-revalidation timing
(or its test) so the path isn't microtask-racy, then extract the bootstrap.

## What landed instead

The `AuthContext` test suite was hardened: `beforeEach` now `mockReset`s the
auth-specific mocks (SecureStore + twitchService token methods) so once-queues
and per-test implementations can't leak, and the "login with twitch" test sets
its own initial anon-boot mocks instead of relying on a previous test's leak.
The file now passes in isolation (it did not before).

## Consequences

`populateAuthState` / `doAuth` / `doAnonAuth` remain effect-interleaved closures
in `AuthContext`, testable only through `renderHook`. Accepted until a dedicated,
test-first effort that also de-races the background revalidation.
