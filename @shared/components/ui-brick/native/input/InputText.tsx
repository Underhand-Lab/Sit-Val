import React, { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import vars from '../../variables';

const InputText = forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => (
  <TextInput ref={ref} placeholderTextColor={vars.text} style={[{ backgroundColor: vars.surface, color: vars.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, style]} {...props} />
));

InputText.displayName = 'InputText';
export default InputText;
