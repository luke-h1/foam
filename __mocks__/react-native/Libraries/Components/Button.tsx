import React from 'react';

interface MockButtonElementProps {
  ref?: React.Ref<unknown>;
}

const MockButton = ({
  children,
  ref,
  ...props
}: {
  children?: React.ReactNode;
  ref?: React.Ref<unknown>;
}) =>
  React.createElement<MockButtonElementProps>(
    'Button',
    ref == null ? props : { ...props, ref },
    children,
  );

export default MockButton;
