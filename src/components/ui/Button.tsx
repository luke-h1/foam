import { ButtonProps, YStack, styled } from 'tamagui';

const BaseButton = styled(YStack, {
  alignItems: 'center',
  backgroundColor: '#6366F1',
  borderRadius: 24,
  justifyContent: 'center',
  padding: 16,
  shadowColor: '$color',
  shadowOffset: {
    height: 2,
    width: 0,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  hoverStyle: {
    backgroundColor: '#5a5fcf',
  },
});

const Button = ({ ...props }: ButtonProps) => {
  return <BaseButton {...props}>{props.children}</BaseButton>;
};

export default Button;
