import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

export type ExtendedEdge = Edge | 'start' | 'end';

const propertySuffixMap = {
  top: 'Top',
  bottom: 'Bottom',
  left: 'Start',
  right: 'End',
  start: 'Start',
  end: 'End',
};

const getInsetEdge = (edge: ExtendedEdge): Edge => {
  if (edge === 'start') {
    return 'left';
  }

  if (edge === 'end') {
    return 'right';
  }

  return edge;
};

export type SafeAreaInsetsStyle<
  Property extends 'padding' | 'margin' = 'padding',
  Edges extends Array<ExtendedEdge> = Array<ExtendedEdge>,
> = {
  [K in Edges[number] as `${Property}${Capitalize<K>}`]: number;
};

/**
 * A hook that can be used to create a safe-area-aware style object that can be passed directly to a View.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/utils/useSafeAreaInsetsStyle.ts/}
 * @param {ExtendedEdge[]} safeAreaEdges - The edges to apply the safe area insets to.
 * @param {"padding" | "margin"} property - The property to apply the safe area insets to.
 * @returns {SafeAreaInsetsStyle<Property, Edges>} - The style object with the safe area insets applied.
 */
export function useSafeAreaInsetsStyle<
  Property extends 'padding' | 'margin' = 'padding',
  Edges extends Array<ExtendedEdge> = [],
>(
  safeAreaEdges: Edges = [] as unknown as Edges,
  property: Property = 'padding' as Property,
): SafeAreaInsetsStyle<Property, Edges> {
  const insets = useSafeAreaInsets();

  const style = {} as Record<string, number>;

  for (const edge of safeAreaEdges) {
    const value = getInsetEdge(edge);
    style[`${property}${propertySuffixMap[edge]}`] = insets[value];
  }

  return style as SafeAreaInsetsStyle<Property, Edges>;
}
