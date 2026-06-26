import React, { forwardRef } from 'react';
import { Div } from '@shared/bridges/UIBridge';
import vars from '../ui-brick/variables';
import { flattenStyle } from './style';

const Box = forwardRef<any, any>(({ children, style, ...props }, ref) => (
  <Div ref={ref} style={flattenStyle([{ backgroundColor: vars.box, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }, style])} {...props}>
    {children}
  </Div>
));

Box.displayName = 'Box';
export default Box;
