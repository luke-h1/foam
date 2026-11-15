interface SpringTunableAnimation {
  damping(value: number): this;
  stiffness(value: number): this;
  mass(value: number): this;
}

export function chatEntranceSpring<
  T extends SpringTunableAnimation,
>(animation: { springify(): T }): T {
  return animation.springify().damping(22).stiffness(240).mass(0.55);
}
