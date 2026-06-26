import React, { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import vars from '../variables';

interface DivProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    style?: any;
}

const Div = forwardRef<HTMLDivElement, DivProps>(({ children, style, ...props }, ref) => (
    <div ref={ref} style={{ color: vars.text, ...(style || {}) }} {...props}>{children}</div>
));

Div.displayName = 'Div';

export default Div;
