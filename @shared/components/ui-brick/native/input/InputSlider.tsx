import React from 'react';
import { GestureResponderEvent, Pressable, View } from 'react-native';
import vars from '../../variables';

interface InputSliderProps {
  min: number | string;
  max: number | string;
  step?: number | string;
  value: number;
  onChange: (value: number) => void;
  style?: any;
}

const InputSlider: React.FC<InputSliderProps> = ({ min, max, step = 1, value, onChange, style }) => {
  const nMin = Number(min);
  const nMax = Number(max);
  const nStep = Number(step);
  const range = nMax - nMin;
  const pct = range <= 0 ? 0 : ((value - nMin) / range) * 100;
  const setFromX = (e: GestureResponderEvent) => {
    const width = (e.currentTarget as any)?.measure ? 1 : 1;
    const next = Math.max(nMin, Math.min(nMax, value + nStep));
    onChange(next);
  };
  return (
    <Pressable onPress={setFromX} style={[{ height: 24, justifyContent: 'center' }, style]}>
      <View style={{ position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: vars.surface }} />
      <View style={{ position: 'absolute', left: 0, width: `${pct}%` as any, height: 6, borderRadius: 3, backgroundColor: vars.primary }} />
      <View style={{ position: 'absolute', left: `${pct}%` as any, width: 16, height: 16, borderRadius: 8, backgroundColor: vars.primary, borderWidth: 2, borderColor: vars.box, transform: [{ translateX: -8 }] }} />
    </Pressable>
  );
};

export default InputSlider;
