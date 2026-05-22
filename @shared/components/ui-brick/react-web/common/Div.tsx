import React, { forwardRef, ReactNode, HTMLAttributes } from 'react';
import vars from '../../variables';

interface DivProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

const Div = forwardRef<HTMLDivElement, DivProps>(({ children, style, ...props }, ref) => (
    <div ref={ref} style={{ color: vars.text, ...style}}{...props}>{children}</div>
));

Div.displayName = 'Div';

export default Div;