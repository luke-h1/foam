import {
  buildRawTwitchPlayerBootstrapScript,
  buildRawTwitchPlayerUrl,
  buildTwitchAutoplayEnsureScript,
  buildTwitchCaptionHiderScript,
  buildTwitchClipPlayerUrl,
  buildTwitchContentGateAcceptScript,
  buildTwitchContentGateWatcherScript,
  buildTwitchEmbedErrorWatcherScript,
  buildTwitchLatencyTrackerScript,
  buildTwitchLiveSyncScript,
  buildTwitchOverlayHideScript,
  buildTwitchPlayerAudioDefaultScript,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from '../twitchPlayerSource';

describe('twitchPlayerSource', () => {
  test('content-gate accept clicks the anonymous classification gate', () => {
    const script = buildTwitchContentGateAcceptScript();

    expect(script).toContain(
      'asyncQuerySelector(\'button[data-a-target*="content-classification-gate"]\', 10000)',
    );
    expect(script).toContain('button.click()');
  });

  test('content-gate watcher reports a login-required gate so the WebView becomes tappable', () => {
    const script = buildTwitchContentGateWatcherScript();

    expect(script).toContain(
      'var GATE_SELECTOR = \'[data-a-target*="content-classification-gate"]\'',
    );
    // A gate blocks only when it has no auto-clickable continue button - i.e. it
    // requires login - so the anonymous mature gate (auto-accepted elsewhere) is
    // never reported as blocking.
    expect(script).toContain(
      '!gate.querySelector(\'button[data-a-target*="content-classification-gate"]\')',
    );
    // Posts the bridge message the player uses to re-enable WebView interaction.
    expect(script).toContain("type: 'contentGateDetected'");
    expect(script).toContain('hasContentGate: hasGate');

    // Only posts on a change, so the bridge isn't spammed every tick.
    expect(script).toContain('if (lastReported === hasGate) { return; }');

    /**
     * Stays interactive across the whole login flow: tapping the gate's login
     * link navigates off player.twitch.tv, and the WebView must stay tappable so
     * the user can type/paste credentials.
     */
    expect(script).toContain(
      "window.location.hostname.indexOf('player.twitch.tv') === -1",
    );
    expect(script).toContain('return isInAuthFlow() || isBlockingGate();');
    /**
     * Tapping the login link removes the gate before window.location updates to
     * the auth host, so a synchronous clear would disable the WebView just as the
     * login form appears. Once interactive, the clear is deferred and re-checked
     * so a pending navigation can settle before interaction is handed back.
     */
    expect(script).toContain('if (lastReported === true) {');
    expect(script).toContain('clearTimer = setTimeout(function() {');
    expect(script).toContain('if (!isActive()) { post(false); }');
    // Only the top frame reports, so a login subframe can't race it.
    expect(script).toContain(
      'if (window.top !== window.self) { return true; }',
    );
  });

  test('latency tracker drives the video-stats menu and reads the latency node', () => {
    const script = buildTwitchLatencyTrackerScript();

    // Navigates Twitch's settings menu: gear -> Advanced -> Video Stats input.
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-button"]\', 10000)',
    );
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-menu-item-advanced"]\')',
    );
    expect(script).toContain(
      'asyncQuerySelector(\'[data-a-target="player-settings-submenu-advanced-video-stats"] input\')',
    );
    // Reads the latency node and posts it to the bridge.
    expect(script).toContain('[aria-label="Latency To Broadcaster"]');
    expect(script).toContain('hlsLatencyBroadcaster');
    // Keeps Twitch's stats overlay hidden so nothing shows over the video.
    expect(script).toContain('[data-a-target="player-overlay-video-stats"]');
    // The whitespace escape survives into the injected regex as \\s, not s.
    expect(script).toContain('([0-9.]+)\\s*sec');
    // Detects ads so it re-enables stats once the stream resumes.
    expect(script).toContain('function isAdActive()');
    expect(script).toContain('[data-a-target="video-ad-label"]');
  });

  test('live sync seeks to the live edge and exposes a re-trigger hook', () => {
    const script = buildTwitchLiveSyncScript({ targetSeconds: 3 });

    // Measures client drift from the newest seekable segment.
    expect(script).toContain('seekable.end(seekable.length - 1)');
    expect(script).toContain('var drift = liveEdge - video.currentTime');
    expect(script).toContain('var TARGET_S = 3');
    // Seeks to the live edge, leaving the target buffer.
    expect(script).toContain('video.currentTime = liveEdge - TARGET_S');
    // Re-triggerable on demand from chat settings.
    expect(script).toContain('window.__foamSyncToLive = function()');
    // Runs once at start, not on a continuous interval.
    expect(script).not.toContain('setInterval');
    // Skips ads so the start-sync targets the real stream, not a pre-roll.
    expect(script).toContain('function isAdActive()');
    expect(script).toContain('skipped (ad playing)');
  });

  test('overlay hide targets only the three player-chrome selectors', () => {
    const script = buildTwitchOverlayHideScript();

    expect(script).toContain("document.querySelector('.top-bar')");
    expect(script).toContain("document.querySelector('.player-controls')");
    expect(script).toContain(
      "document.querySelector('#channel-player-disclosures')",
    );
    expect(script).toContain(
      "document.querySelector('.video-player__overlay')",
    );
    // Must not reintroduce subscribe/gift/follow blocking or click interception.
    expect(script).not.toContain('subscribe-button');
    expect(script).not.toContain("addEventListener('click'");
  });

  test('builds raw Twitch player URLs without mixing channel and video params', () => {
    expect(
      buildRawTwitchPlayerUrl({
        autoplay: true,
        channel: 'cohhcarnage',
        muted: false,
        parent: 'www.twitch.tv',
      }),
    ).toBe(
      'https://player.twitch.tv/?channel=cohhcarnage&muted=false&parent=www.twitch.tv',
    );
    expect(
      buildRawTwitchPlayerUrl({
        autoplay: false,
        channel: 'ignored',
        muted: true,
        parent: 'www.twitch.tv',
        video: '123',
      }),
    ).toBe(
      'https://player.twitch.tv/?video=123&autoplay=false&muted=true&parent=www.twitch.tv',
    );
  });

  test('starts raw Twitch autoplay in the requested audio state and recovers after layout changes', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    expect(script).toContain('var targetMuted = false');
    expect(script).toContain('var userPaused = !shouldAutoplay');
    expect(script).toContain('video.muted = targetMuted');
    expect(script).toContain("video.addEventListener('playing', function()");
    expect(script).toContain(
      "window.addEventListener('orientationchange', schedulePlaybackRecovery)",
    );
  });

  test('playback watchdog treats an active ad break like a pause', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    expect(script).toContain('function isAdActive()');
    expect(script).toContain('[data-a-target="video-ad-label"]');
    expect(script).toContain(
      '!video || video.paused || userPaused || !startAllowed || isAdActive()',
    );
  });

  test('autoplay-ensure starts muted then raises the volume', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    expect(script).toContain('var TARGET_MUTED = false');
    expect(script).toContain('var START_DELAY_MS = 800');
    // Playback always begins muted (the only state iOS autoplay reliably
    // permits) so the picture moves immediately.
    expect(script).toContain('video.muted = true');
    expect(script).toContain('video.play()');
    // Once playing, reconcileAudio brings the stream up to full volume.
    expect(script).toContain('video.muted = false');
    expect(script).toContain('video.volume = 1');
  });

  test('autoplay-ensure gives up to muted after repeated unmute re-pauses', () => {
    const script = buildTwitchAutoplayEnsureScript({ muted: false });

    // Unmuting an ongoing stream can make iOS silently re-pause it; the script
    // resumes and retries a bounded number of times, then accepts muted
    // playback so the picture never stalls on a pause.
    expect(script).toContain('var unmuteBlocked = false');
    expect(script).toContain('unmuteAttempts++');
    expect(script).toContain('if (unmuteAttempts >= 3)');
    expect(script).toContain('unmuteBlocked = true;');
    expect(script).toContain('playMuted(v);');
  });

  test('autoplay-ensure keeps a muted start muted', () => {
    const script = buildTwitchAutoplayEnsureScript({
      muted: true,
      startDelayMs: 0,
    });

    expect(script).toContain('var TARGET_MUTED = true');
    expect(script).toContain('var START_DELAY_MS = 0');
    // With a muted target the stream is held muted, never raised to volume.
    expect(script).toContain('if (!video.muted) { video.muted = true; }');
  });

  test('seeds the Twitch player mute preference so it boots in the requested audio state', () => {
    const unmuted = buildTwitchPlayerAudioDefaultScript({ muted: false });
    expect(unmuted).toContain(
      "window.localStorage.setItem(\n      'video-muted',\n      JSON.stringify({ default: false })\n    )",
    );
    expect(unmuted).toContain("window.localStorage.setItem('volume', '1')");

    const muted = buildTwitchPlayerAudioDefaultScript({ muted: true });
    expect(muted).toContain('JSON.stringify({ default: true })');
    expect(muted).toContain("window.localStorage.setItem('volume', '1')");
  });

  test('hides captions with text track "hidden", never "disabled"', () => {
    const script = buildRawTwitchPlayerBootstrapScript({
      autoplay: true,
      debug: false,
      muted: false,
    });

    // 'disabled' makes WKWebView's native HLS AVPlayer renegotiate and stall;
    // 'hidden' keeps the track loaded but unrendered. No caption CSS either.
    expect(script).toContain("video.textTracks[0].mode = 'hidden'");
    expect(script).not.toContain("mode = 'disabled'");
    expect(script).not.toContain('text-track-container');
  });

  test('caption hider switches the text track to hidden on play and pause', () => {
    const script = buildTwitchCaptionHiderScript();

    expect(script).toContain("video.textTracks[0].mode = 'hidden'");
    expect(script).not.toContain("mode = 'disabled'");
    expect(script).not.toContain('text-track-container');
    expect(script).toContain("video.addEventListener('playing'");
    expect(script).toContain("video.addEventListener('pause'");
  });

  test('builds Twitch clip embed URLs', () => {
    expect(
      buildTwitchClipPlayerUrl({
        autoplay: true,
        clip: 'AnimatedOptimisticWasabiVoteNay',
        muted: false,
        parent: 'www.twitch.tv',
      }),
    ).toBe(
      'https://clips.twitch.tv/embed?clip=AnimatedOptimisticWasabiVoteNay&parent=www.twitch.tv&autoplay=true&muted=false&preload=metadata',
    );
  });

  test('embed-error watcher reports Twitch misconfigured pages with the parent value', () => {
    const script = buildTwitchEmbedErrorWatcherScript();

    // Detects Twitch's misconfigured-embed error text.
    expect(script).toContain("text.indexOf('embed is misconfigured') !== -1");
    // Posts the bridge message the native side maps to a dedicated Sentry issue.
    expect(script).toContain("type: 'embedMisconfigured'");
    // Includes the offending parent so the report is actionable.
    expect(script).toContain(
      "new URLSearchParams(window.location.search).get('parent')",
    );
    // Stops as soon as a real player video appears, so it never scans the
    // healthy player's large DOM.
    expect(script).toContain("if (document.querySelector('video'))");
    // Only the top frame reports, so a subframe can't duplicate the event.
    expect(script).toContain(
      'if (window.top !== window.self) { return true; }',
    );
    // The poll is only started when the synchronous check has not already
    // resolved, so a same-tick hit never leaves an unclearable interval.
    expect(script).toContain('if (!stopped) {');
    expect(script).toContain('timer = setInterval(check, 1000)');
  });

  test('detects app and Twitch passport callback URLs', () => {
    expect(isAppUrl('foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('exp+foam://stream/cohhcarnage')).toBe(true);
    expect(isAppUrl('https://www.twitch.tv')).toBe(false);

    expect(
      isTwitchPassportCallbackUrl(
        'https://www.twitch.tv/passport-callback#token=abc',
      ),
    ).toBe(true);
    expect(isTwitchPassportCallbackUrl('not a url')).toBe(false);
  });
});
