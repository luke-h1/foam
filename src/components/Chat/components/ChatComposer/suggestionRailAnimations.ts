import { FadeInDown, FadeOutDown } from 'react-native-reanimated';

/**
 * Shared entrance/exit motion for the composer suggestion rails (emote,
 * command, mention). Kept in one place so all three rails stay in sync.
 *
 * The rail sits directly above the input, so it emerges upward out of the
 * composer on enter and settles back down toward it on exit - the same path in
 * both directions, anchored to the control that spawned it.
 *
 * The spring is near-critically damped (damping ratio ~0.96): a quick,
 * confident settle with no visible bounce, which suits motion the user did not
 * drive with a gesture. Reanimated disables both automatically when the system
 * "Reduce Motion" setting is on.
 */
export const suggestionRailEntering = FadeInDown.springify()
  .damping(22)
  .stiffness(240)
  .mass(0.55);

export const suggestionRailExiting = FadeOutDown.duration(130);
