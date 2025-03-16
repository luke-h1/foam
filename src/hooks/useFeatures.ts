/**
 * Custom hook which allows the user to enable or disable
 * certain features of the app based on their preference
 */

import { AllowedKey, storageService } from '@app/services';
import { useEffect, useState } from 'react';

export interface Feature {
  title: string;
  description: string;
  enabled: boolean;
  key: AllowedKey;
}

const allowedFeatures: Feature[] = [
  {
    title: 'Stacked stream cards',
    description: 'Whether to enable a stack layout for streams',
    enabled: false,
    key: 'foam_stacked_cards',
  },
];

export function useFeatures() {
  const [features, setFeatures] = useState<Feature[]>(allowedFeatures);

  useEffect(() => {
    const storedFeatures = storageService.get<string>('foam_stacked_cards');

    if (storedFeatures) {
      setFeatures(JSON.parse(storedFeatures));
    }
  }, []);

  useEffect(() => {
    storageService.set('foam_stacked_cards', JSON.stringify(features));
  }, [features]);

  const toggleFeature = (key: AllowedKey, enabled: boolean) => {
    setFeatures(prev =>
      prev.map(feature =>
        feature.key === key ? { ...feature, enabled } : feature,
      ),
    );
  };

  return {
    features,
    toggleFeature,
  };
}
