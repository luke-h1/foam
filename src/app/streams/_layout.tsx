import { Stack } from 'expo-router';
import { useCallback } from 'react';
import TmiService from '@app/services/tmi-service';
import ChatEventService from '@app/services/chat-event-service';

export default function StreamsLayout() {
  const eventService = ChatEventService.getInstance();

  const handleBeforeRemove = useCallback((e: any) => {
    console.log(
      '🎯 StreamsLayout: Screen is being removed, disconnecting chat',
    );

    // Emit screen exit event
    eventService.emitScreenExit('StreamsLayout');

    // Disconnect from all TMI channels
    try {
      if (TmiService.isConnected()) {
        const currentChannels = TmiService.getCurrentChannels();
        console.log('🔌 StreamsLayout: Current channels:', currentChannels);

        // Part from all channels
        currentChannels.forEach(channel => {
          TmiService.getInstance()
            .part(channel)
            .catch(error => {
              console.warn(`Failed to part from channel ${channel}:`, error);
            });
        });
      }
    } catch (error) {
      console.warn('Error disconnecting from channels:', error);
    }
  }, []);

  const handleFocus = useCallback(() => {
    console.log('🎯 StreamsLayout: Screen focused');
    eventService.emitScreenEnter('StreamsLayout');
  }, []);

  const handleBlur = useCallback(() => {
    console.log('🎯 StreamsLayout: Screen blurred');
    eventService.emitScreenExit('StreamsLayout');

    // Disconnect from all TMI channels when leaving the streams section
    try {
      if (TmiService.isConnected()) {
        const currentChannels = TmiService.getCurrentChannels();
        console.log(
          '🔌 StreamsLayout: Disconnecting from channels:',
          currentChannels,
        );

        currentChannels.forEach(channel => {
          TmiService.getInstance()
            .part(channel)
            .catch(error => {
              console.warn(`Failed to part from channel ${channel}:`, error);
            });
        });
      }
    } catch (error) {
      console.warn('Error disconnecting from channels on blur:', error);
    }
  }, []);

  return (
    <Stack
      screenListeners={{
        beforeRemove: handleBeforeRemove,
        focus: handleFocus,
        blur: handleBlur,
      }}
    />
  );
}
