import React, { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import vars from '../../variables';

const InputNumber = forwardRef<TextInput, TextInputProps>(({ style, keyboardType = 'numeric', ...props }, ref) => (
  <TextInput ref={ref} keyboardType={keyboardType} placeholderTextColor={vars.text} style={[{ backgroundColor: vars.surface, color: vars.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, style]} {...props} />
));

InputNumber.displayName = 'InputNumber';
export default InputNumber;
