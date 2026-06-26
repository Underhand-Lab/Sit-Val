import React, { forwardRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';

interface ScrollDivProps extends ScrollViewProps {
  style?: any;
}

const ScrollDiv = forwardRef<ScrollView, ScrollDivProps>(({ children, style, ...props }, ref) => (
  <ScrollView ref={ref} style={style} {...props}>
    {children}
  </ScrollView>
));

ScrollDiv.displayName = 'ScrollDiv';
export default ScrollDiv;
