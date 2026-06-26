import React, { forwardRef } from 'react';
import { Text, View, type TextInputProps, type ViewProps } from 'react-native';
import vars from '../variables';

interface SelectProps extends ViewProps {
  options?: (string | { label: string; value: string | number })[];
  children?: React.ReactNode;
}

const Select = forwardRef<View, SelectProps>(({ options, children, style, ...props }, ref) => (
  <View ref={ref} style={[{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: vars.surface }, style]} {...props}>
    {options
      ? options.map((opt) => (
          <Text key={typeof opt === 'string' ? opt : String(opt.value)} style={{ color: vars.text, fontFamily: vars.font }}>
            {typeof opt === 'string' ? opt : opt.label}
          </Text>
        ))
      : children}
  </View>
));

Select.displayName = 'Select';
export default Select;
