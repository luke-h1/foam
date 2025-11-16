export const defineTask = jest.fn();
export const isTaskDefined = jest.fn(() => false);
export const isTaskRegisteredAsync = jest.fn(() => Promise.resolve(false));
export const registerTaskAsync = jest.fn(() => Promise.resolve());
export const unregisterTaskAsync = jest.fn(() => Promise.resolve());
export const unregisterAllTasksAsync = jest.fn(() => Promise.resolve());
export const getTaskName = jest.fn();
