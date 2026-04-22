import React, { forwardRef } from 'react';
import vars from './Variables'

const Button = forwardRef(({ children, style, ...props }, ref) => (
    <button 
        ref={ref} 
        style={{ ...styles.button, ...style }}
        {...props}
    >
        {children}
    </button>
));

const styles = {
    button: {
        fontFamily: vars.font,
        fontSize: '15px',
        backgroundColor: vars.primary,
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '5px 10px',
        margin: '5px',
    },
};

Button.displayName = 'Button';
export default Button;