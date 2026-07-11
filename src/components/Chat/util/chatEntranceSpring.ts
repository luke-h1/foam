interface SpringTunableAnimation {
  damping(value: number): this;
  stiffness(value: number): this;
  mass(value: number): this;
}

/**
 * Near-critically damped (damping ratio ~0.96): quick settle with no bounce.
 * For motion the user did not drive (rails, banners).
 */
export function chatEntranceSpring<
  T extends SpringTunableAnimation,
>(animation: { springify(): T }): T {
  return animation.springify().damping(22).stiffness(240).mass(0.55);
}

/**
 * Gentle overshoot (damping ratio ~0.78) for a tappable affordance.
 */
export function chatAffordanceSpring<
  T extends SpringTunableAnimation,
>(animation: { springify(): T }): T {
  return animation.springify().damping(17).stiffness(200).mass(0.6);
}
