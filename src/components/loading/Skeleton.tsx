import { YStack } from 'tamagui';

export interface SkeletonProps {
  children: JSX.Element;
  contrast?: boolean;
  disabled?: boolean;
}

export default function Skeleton({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contrast,
  disabled,
}: SkeletonProps) {
  if (disabled) {
    return children;
  }

  return (
    <>
      {children}
      <YStack
        fullscreen
        backgroundColor="$neutral3"
        borderRadius="$rounded16"
        position="absolute"
        zIndex={1_000_000}
      />
    </>
  );
}
