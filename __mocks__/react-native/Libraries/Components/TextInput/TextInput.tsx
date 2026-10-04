import React from 'react';

type MockTextInputElementProps = {
  ref?: React.Ref<unknown>;
};

const MockTextInput = ({
  children,
  ref,
  ...props
}: {
  children?: React.ReactNode;
  ref?: React.Ref<unknown>;
}) =>
  React.createElement<MockTextInputElementProps>(
    'TextInput',
    ref == null ? props : { ...props, ref },
    children,
  );

export default MockTextInput;
