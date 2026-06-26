import React, { forwardRef } from 'react';
import { Div } from '@shared/bridges/UIBridge';
import vars from '../ui-brick/variables';
import { flattenStyle } from './style';

const baseStyle = {
  width: '100%',
  height: '100%',
  fontFamily: vars.font,
  alignItems: 'center',
  margin: 0,
  textAlign: 'center',
  lineHeight: '180%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  maxHeight: '100vh',
  wordBreak: 'keep-all',
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  paddingLeft: 'env(safe-area-inset-left, 0px)',
  paddingRight: 'env(safe-area-inset-right, 0px)',
};

const Wrapper = forwardRef<any, any>(({ children, style, ...props }, ref) => (
  <Div ref={ref} style={flattenStyle([baseStyle, { flex: 1, backgroundColor: vars.background }, style])} {...props}>
    {children}
  </Div>
));

Wrapper.displayName = 'Wrapper';
export default Wrapper;
