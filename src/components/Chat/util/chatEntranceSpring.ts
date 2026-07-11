interface SpringTunableAnimation {
  damping(value: number): this;
  stiffness(value: number): this;
  mass(value: number): this;
}

/**
 * Near-critically damped (damping ratio ~0.96): quick settle with no visible
 * bounce, suited to motion the user did not drive with a gesture.
 */
export function chatEntranceSpring<
  T extends SpringTunableAnimation,
>(animation: { springify(): T }): T {
  return animation.springify().damping(22).stiffness(240).mass(0.55);
}
