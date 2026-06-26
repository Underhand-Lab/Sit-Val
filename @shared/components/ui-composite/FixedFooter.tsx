import React, { forwardRef } from 'react';
import { Div } from '@shared/bridges/UIBridge';
import { flattenStyle } from './style';

const FixedFooter = forwardRef<any, any>(({ children, style, ...props }, ref) => (
  <Div ref={ref} style={flattenStyle([{ width: '100%', paddingVertical: 20 }, style])} {...props}>
    {children}
  </Div>
));

FixedFooter.displayName = 'FixedFooter';
export default FixedFooter;
