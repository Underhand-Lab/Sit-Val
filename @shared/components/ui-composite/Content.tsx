import React, { forwardRef } from 'react';
import { ScrollDiv } from '@shared/bridges/UIBridge';
import { flattenStyle } from './style';

const Content = forwardRef<any, any>(({ children, style, ...props }, ref) => (
  <ScrollDiv ref={ref} style={flattenStyle([{ flex: 1, width: '100%' }, style])} {...props}>
    {children}
  </ScrollDiv>
));

Content.displayName = 'Content';
export default Content;
