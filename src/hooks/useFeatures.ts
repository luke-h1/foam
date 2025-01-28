/**
 * Custom hook which allows the user to enable or disable
 * certain features of the app based on their preference
 */

import { storage } from '@app/utils/storage';
import { useEffect, useState } from 'react';

type FeatureKey = 'foam_stacked_cards';

export interface Feature {
  title: string;
  description: string;
  enabled: boolean;
  key: FeatureKey;
}

const FEATURES_STORAGE_KEY = 'foamUserFeatures';

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
    const storedFeatures = storage.getString(FEATURES_STORAGE_KEY);

    if (storedFeatures) {
      setFeatures(JSON.parse(storedFeatures));
    }
  }, []);

  useEffect(() => {
    storage.set(FEATURES_STORAGE_KEY, JSON.stringify(features));
  }, [features]);

  const toggleFeature = (key: FeatureKey, enabled: boolean) => {
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
