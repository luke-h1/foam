import { LayoutProps, SpacingProps } from '@shopify/restyle';
import { ReactNode } from 'react';
import { Theme } from '../styles/theme';
import Box from './Box';
import TextInput, { TextInputProps } from './TextInput';

export interface TextFieldProps
  extends SpacingProps<Theme>,
    LayoutProps<Theme> {
  beforeInput?: ReactNode;
  afterInput?: ReactNode;
  textInputProps?: Omit<TextInputProps, 'editable'>;
}

const TextField = ({
  beforeInput,
  afterInput,
  textInputProps,
}: TextFieldProps) => {
  return (
    <Box flexDirection="row" alignItems="center">
      {!!beforeInput && (
        <Box margin="sToM" marginRight="none">
          {beforeInput}
        </Box>
      )}
      <TextInput
        flex={1}
        paddingHorizontal="sToM"
        paddingVertical="sToM"
        {...textInputProps}
      />
      {!!afterInput && (
        <Box margin="sToM" marginLeft="none">
          {afterInput}
        </Box>
      )}
    </Box>
  );
};
export default TextField;
