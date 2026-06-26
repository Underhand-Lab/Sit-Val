import React, { forwardRef, useMemo } from 'react';
import { Pressable, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import vars from '../variables';

interface ButtonProps extends PressableProps {
  children?: React.ReactNode;
  noHover?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(({ children, style, noHover, ...props }, ref) => {
  const baseStyle = useMemo(
    () => ({ backgroundColor: vars.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }),
    []
  );

  return (
    <Pressable ref={ref} style={({ pressed }) => [baseStyle, !noHover && pressed && { opacity: 0.85 }, style]} {...props}>
      {typeof children === 'string' ? <Text style={{ color: '#fff', fontFamily: vars.font }}>{children}</Text> : children}
    </Pressable>
  );
});

Button.displayName = 'Button';
export default Button;
