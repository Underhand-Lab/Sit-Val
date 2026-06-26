import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import vars from '../../variables';

interface InputCheckboxProps {
  label?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

const InputCheckbox: React.FC<InputCheckboxProps> = ({ label, value = false, onValueChange }) => {
  const control = <Switch value={value} onValueChange={onValueChange} trackColor={{ false: vars.background, true: vars.primary }} />;
  if (!label) return control;
  return (
    <Pressable onPress={() => onValueChange?.(!value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {control}
      <Text style={{ color: vars.text, fontFamily: vars.font }}>{label}</Text>
    </Pressable>
  );
};

export default InputCheckbox;
