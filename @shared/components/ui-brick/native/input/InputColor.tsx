import React from 'react';
import { Pressable, Text, View } from 'react-native';
import vars from '../../variables';

interface InputColorProps {
  label?: string;
  value: string;
  onChange: (newRgbaStr: string) => void;
}

const InputColor: React.FC<InputColorProps> = ({ label, value, onChange }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Pressable onPress={() => onChange(value)} style={{ width: 36, height: 36, borderRadius: 4, borderWidth: 2, borderColor: vars.surface, backgroundColor: value }} />
    {label ? <Text style={{ color: vars.text, fontFamily: vars.font, fontSize: 12, fontWeight: '700' }}>{label}</Text> : null}
  </View>
);

export default InputColor;
