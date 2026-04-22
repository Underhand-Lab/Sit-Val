import React, { forwardRef } from 'react';

const Box = forwardRef(({ children, style, ...props }, ref) => (
    <div 
        ref={ref} 
        style={{ ...styles.footer, ...style }} 
        {...props}
    >
        {children}
    </div>
));

const styles = {
    footer: {
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        padding: '20px 20px',
        width: 'calc(100% - 40px)',
    },
};

Box.displayName = 'Box';
export default Box;