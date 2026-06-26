import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';
import vars from '../variables';

const H1 = forwardRef<Text, TextProps>(({ children, style, ...props }, ref) => (
  <Text ref={ref} style={[{ fontFamily: vars.font, fontSize: 28, color: vars.text }, style]} {...props}>
    {children}
  </Text>
));

H1.displayName = 'H1';
export default H1;
