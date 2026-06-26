import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';
import vars from '../variables';

const H3 = forwardRef<Text, TextProps>(({ children, style, ...props }, ref) => (
  <Text ref={ref} style={[{ fontFamily: vars.font, fontSize: 20, color: vars.text }, style]} {...props}>
    {children}
  </Text>
));

H3.displayName = 'H3';
export default H3;
