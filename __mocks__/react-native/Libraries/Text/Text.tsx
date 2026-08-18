import React from 'react';

type MockTextElementProps = {
  ref?: React.Ref<unknown>;
};

const MockText = React.forwardRef(
  (
    { children, ...props }: { children?: React.ReactNode },
    ref: React.Ref<unknown>,
  ) =>
    React.createElement<MockTextElementProps>(
      'Text',
      ref == null ? props : { ...props, ref },
      children,
    ),
);

export default MockText;
