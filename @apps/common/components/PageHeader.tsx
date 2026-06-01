import React from 'react';
import { Div, H3, Button, vars } from '@shared/bridges/UIBridge';

interface PageHeaderProps {
  title: string;
  subTitle: string;
  isEditMode: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  showSave: boolean;
  isSaveDisabled?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, isEditMode, onEditToggle, onSave, showSave, isSaveDisabled }) => (
  <Div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flex: 1 }}> {/* 텍스트 컨테이너가 줄어들 수 있도록 설정 */}
      <H3 style={{ margin: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>{title}</H3> {/* 제목 텍스트 줄 바꿈 허용 */}
      <p style={{ color: '#666', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subTitle}</p> {/* 부제목 텍스트 줄 바꿈 허용 */}
    </Div>
    <Div style={{ display: 'flex', gap: '8px' }}>
      {showSave && isEditMode && (
        <Button onClick={onSave} disabled={isSaveDisabled} style={{ backgroundColor: isSaveDisabled ? '#ccc' : vars.primary, color: 'white', cursor: isSaveDisabled ? 'not-allowed' : 'pointer' }}>저장</Button>
      )}
      <Button 
        onClick={onEditToggle} 
        style={{ backgroundColor: isEditMode ? '#666' : vars.primary, color: 'white' }}
      >
        {isEditMode ? '취소' : '편집'}
      </Button>
    </Div>
  </Div>
);