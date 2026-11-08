import React from 'react';

interface MockTextElementProps {
  ref?: React.Ref<unknown>;
}

const MockText = ({
  children,
  ref,
  ...props
}: {
  children?: React.ReactNode;
  ref?: React.Ref<unknown>;
}) =>
  React.createElement<MockTextElementProps>(
    'Text',
    ref == null ? props : { ...props, ref },
    children,
  );

export default MockText;
