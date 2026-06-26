import React, { forwardRef, type ReactNode, type HTMLAttributes } from 'react';

interface ScrollDivProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  style?: any;
}

const ScrollDiv = forwardRef<HTMLDivElement, ScrollDivProps>(({ children, style, ...props }, ref) => (
  <div ref={ref} style={{ overflow: 'auto', ...style }} {...props}>
    {children}
  </div>
));

ScrollDiv.displayName = 'ScrollDiv';
export default ScrollDiv;
