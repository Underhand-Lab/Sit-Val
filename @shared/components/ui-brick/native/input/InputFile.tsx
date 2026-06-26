import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Button from '../Button';
import vars from '../../variables';

interface InputFileProps {
  style?: any;
  onPress?: () => void;
}

const InputFile = forwardRef<any, InputFileProps>(({ style, onPress }, ref) => {
  const innerRef = useRef(null);
  const [fileName] = useState('선택된 파일 없음');
  useImperativeHandle(ref, () => innerRef.current);
  const containerStyle = useMemo(() => [{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style], [style]);
  return (
    <View style={containerStyle}>
      <Button onPress={onPress} style={{ margin: 0 }}>
        파일 선택
      </Button>
      <Text style={{ color: vars.text, fontFamily: vars.font, fontSize: 13 }}>{fileName}</Text>
    </View>
  );
});

InputFile.displayName = 'InputFile';
export default InputFile;
