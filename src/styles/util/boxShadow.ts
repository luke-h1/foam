interface ShadowRules {
  shadowRadius?: number;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowColor?: `#${string}`;
  elevation?: number;
}

const defaultValues: ShadowRules = {
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowColor: '#000000',
  elevation: 3,
};

export const boxShadow = (rules: ShadowRules = defaultValues): ShadowRules =>
  rules;
