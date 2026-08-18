import React from 'react';

type MockButtonElementProps = {
  ref?: React.Ref<unknown>;
};

const MockButton = React.forwardRef(
  (
    { children, ...props }: { children?: React.ReactNode },
    ref: React.Ref<unknown>,
  ) =>
    React.createElement<MockButtonElementProps>(
      'Button',
      ref == null ? props : { ...props, ref },
      children,
    ),
);

export default MockButton;
