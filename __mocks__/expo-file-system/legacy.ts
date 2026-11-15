// SAFETY: __mocks__/expo-file-system.ts defines __mockFileSystem with exactly this shape.
const { __mockFileSystem } = require('expo-file-system') as {
  __mockFileSystem: {
    deletePath: (uri: string) => void;
    listFileNames: (directoryUri: string) => string[];
  };
};

export const makeDirectoryAsync = jest.fn();

export const deleteAsync = jest.fn(async (uri: string) => {
  __mockFileSystem.deletePath(uri);
});

export const readDirectoryAsync = jest.fn(async (uri: string) =>
  __mockFileSystem.listFileNames(uri),
);
