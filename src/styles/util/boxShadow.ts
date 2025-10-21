interface ShadowRules {
  shadowRadius?: number;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowColor?: `#${string}`;
  elevation?: number;
}

const defaultValues: ShadowRules = {
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
};

export const boxShadow = (rules: ShadowRules = defaultValues): ShadowRules =>
  rules;
