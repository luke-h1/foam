import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Updates from 'expo-updates';

export const setupBackgroundUpdates = async () => {
  if (!Updates.isEnabled) {
    return;
  }

  const BACKGROUND_TASK_NAME = 'task-run-expo-update';

  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    if (!Updates.isEnabled) {
      return;
    }

    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  });

  const isRegistered =
    await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  if (!isRegistered) {
    console.log(`Registering background task ${BACKGROUND_TASK_NAME}`);
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: process.env.APP_VARIANT === 'production' ? 1 : 15,
    });
  }
};
