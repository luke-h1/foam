import { useCallback, useEffect, useState } from 'react';
import { SanitisiedEmoteSet } from '../services/seventTvService';
import { storageService } from '../services/storageService';

const RECENT_EMOTES_KEY = 'recent_emotes';
const MAX_RECENT_EMOTES = 50;

export const useRecentEmotes = () => {
  const [recentEmotes, setRecentEmotes] = useState<SanitisiedEmoteSet[]>([]);

  const loadRecentEmotes = useCallback(() => {
    try {
      const stored = storageService.getItem(RECENT_EMOTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SanitisiedEmoteSet[];
        setRecentEmotes(parsed);
      }
    } catch (error) {
      console.error('Error loading recent emotes:', error);
    }
  }, []);

  const addRecentEmote = useCallback((emote: SanitisiedEmoteSet) => {
    setRecentEmotes((prev) => {
      const filtered = prev.filter(e => e.id !== emote.id);
      const updated = [emote, ...filtered].slice(0, MAX_RECENT_EMOTES);
      
      try {
        storageService.setItem(RECENT_EMOTES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent emotes:', error);
      }
      
      return updated;
    });
  }, []);

  const clearRecentEmotes = useCallback(() => {
    setRecentEmotes([]);
    try {
      storageService.removeItem(RECENT_EMOTES_KEY);
    } catch (error) {
      console.error('Error clearing recent emotes:', error);
    }
  }, []);

  useEffect(() => {
    loadRecentEmotes();
  }, [loadRecentEmotes]);

  return {
    recentEmotes,
    addRecentEmote,
    clearRecentEmotes,
  };
};