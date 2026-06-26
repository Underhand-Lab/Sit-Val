import React, { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import vars from '../variables';

interface DivProps extends ViewProps {
  style?: any;
}

const Div = forwardRef<View, DivProps>(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[{ color: vars.text }, style]} {...props}>
    {children}
  </View>
));

Div.displayName = 'Div';
export default Div;
