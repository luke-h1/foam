interface SpringTunableAnimation {
  damping(value: number): this;
  stiffness(value: number): this;
  mass(value: number): this;
}

/**
 * Applies the shared chat-surface entrance spring to an entering animation,
 * e.g. `chatEntranceSpring(FadeInUp)`. Used by the composer suggestion rails,
 * the reply preview, and the pinned-message banner so every low-frequency chat
 * surface arrives with the same motion; tune it here and they all follow.
 *
 * The spring is near-critically damped (damping ratio ~0.96): a quick,
 * confident settle with no visible bounce, which suits motion the user did not
 * drive with a gesture. Reanimated disables the animation automatically when
 * the system "Reduce Motion" setting is on.
 */
export function chatEntranceSpring<
  T extends SpringTunableAnimation,
>(animation: { springify(): T }): T {
  return animation.springify().damping(22).stiffness(240).mass(0.55);
}
