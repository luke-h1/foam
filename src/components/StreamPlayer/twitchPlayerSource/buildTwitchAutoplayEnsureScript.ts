/**
 * Drives playback on the stock (unscripted) player so a stream never sits
 * paused after load. Twitch's embed honours neither the `muted=false` URL param
 * nor unmuted autoplay reliably, and on iOS an unmuted play() resolves but is
 * then silently re-paused by WebKit (no rejection to catch) — leaving the video
 * stuck on the play button. This guarantees playback: it tries the requested
 * audio state, and on any pause — a rejected play() OR a silent re-pause —
 * falls back to muted playback so the picture is always moving. Once unmuting a
 * playing video makes WebKit re-pause it, it stops fighting and stays muted
 * (a later user tap can unmute), which avoids an unmute/re-pause oscillation.
 *
 * The first attempt is deferred past the WKWebView init window: starting the
 * inline video too early intermittently leaves its AVPlayer layer out of the
 * compositor (audio advances, picture is black). The deferral plus the
 * StreamPlayer layout nudge keep playback off that race.
 */
export function buildTwitchAutoplayEnsureScript(options: {
  muted: boolean;
  startDelayMs?: number;
}): string {
  const startDelayMs = Math.max(0, options.startDelayMs ?? 800);
  return `
(function() {
  if (window.__foamAutoplayEnsureInstalled) { return true; }
  window.__foamAutoplayEnsureInstalled = true;

  var TARGET_MUTED = ${options.muted ? 'true' : 'false'};
  var START_DELAY_MS = ${startDelayMs};
  var unmuteBlocked = false;
  // One-shot autoplay guard: set on first play and by native pause.
  var stopped = false;

  function prepare(video) {
    try {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.removeAttribute('controls');
    } catch (e) {}
  }

  function playMuted(video) {
    try {
      video.muted = true;
      var p = video.play();
      if (p && typeof p.catch === 'function') { p.catch(function() {}); }
    } catch (e) {}
  }

  function postMuteState(video) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'muteState',
        payload: {
          muted: !!video.muted,
          volume: typeof video.volume === 'number' ? video.volume : 1
        }
      }));
    } catch (e) {}
  }

  var unmuteAttempts = 0;

  // Unmute the already-playing stream; iOS re-pauses cold unmuted autoplay, so retry then accept muted.
  function reconcileAudio(video) {
    if (!video) { return; }
    if (TARGET_MUTED) {
      if (!video.muted) { video.muted = true; }
      return;
    }
    if (unmuteBlocked) { return; }
    video.muted = false;
    video.volume = 1;
    setTimeout(function() {
      var v = document.querySelector('video');
      if (!v || TARGET_MUTED || !v.paused) { return; }
      unmuteAttempts++;
      if (unmuteAttempts >= 3) {
        unmuteBlocked = true;
        playMuted(v);
        return;
      }
      var p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function() { unmuteBlocked = true; playMuted(v); });
      }
      setTimeout(function() {
        reconcileAudio(document.querySelector('video'));
      }, 250);
    }, 250);
  }

  function ensurePlaying(video) {
    if (stopped || !video) { return; }
    prepare(video);

    if (!video.paused) {
      // Already playing: go inert so we never force play over a user/native pause.
      stopped = true;
      reconcileAudio(video);
      return;
    }

    // Always start muted: iOS blocks unmuted autoplay; reconcileAudio raises volume once playing.
    try {
      video.muted = true;
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function() {});
      }
    } catch (e) {}
  }

  function tick() {
    ensurePlaying(document.querySelector('video'));
  }

  // Retry play until the video starts or a deadline; stops on first play. Re-callable from native.
  window.__foamEnsurePlaying = function() {
    stopped = false;
    var deadline = Date.now() + 12000;
    function pump() {
      if (stopped) { return; }
      var video = document.querySelector('video');
      if (video && !video.paused) { return; }
      tick();
      if (Date.now() < deadline) { setTimeout(pump, 600); }
    }
    pump();
  };

  // Native calls this on pause so the loop stops fighting teardown.
  window.__foamStopEnsurePlaying = function() {
    stopped = true;
  };

  // User mute toggle: stop the loop, pin unmuteBlocked, re-kick play if an unmute re-pauses.
  window.__foamSetMuted = function(nextMuted) {
    try {
      stopped = true;
      unmuteBlocked = true;
      var video = document.querySelector('video');
      if (!video) { return; }
      video.muted = !!nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        if (video.paused) {
          var p = video.play();
          if (p && typeof p.catch === 'function') { p.catch(function() {}); }
          setTimeout(function() {
            if (video.paused && !video.muted) {
              var p2 = video.play();
              if (p2 && typeof p2.catch === 'function') { p2.catch(function() {}); }
            }
          }, 150);
        }
      }
      postMuteState(video);
    } catch (e) {}
  };

  function attach(video) {
    if (!video || video.__foamAutoplayEnsure) { return; }
    video.__foamAutoplayEnsure = true;
    video.addEventListener('loadeddata', tick);
    video.addEventListener('canplay', tick);
    // Reconcile audio as soon as playback is confirmed.
    video.addEventListener('playing', tick);
    video.addEventListener('volumechange', function() { postMuteState(video); });
    postMuteState(video);
  }

  setTimeout(window.__foamEnsurePlaying, START_DELAY_MS);

  var existing = document.querySelector('video');
  if (existing) { attach(existing); return true; }

  var observer = new MutationObserver(function() {
    var video = document.querySelector('video');
    if (video) { observer.disconnect(); attach(video); }
  });
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
  return true;
})();
true;`;
}
