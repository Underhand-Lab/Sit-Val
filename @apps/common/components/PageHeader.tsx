import React from 'react';
import { Div, H3, Button } from '@shared/bridges/UIBridge';

interface PageHeaderProps {
  title: string;
  subTitle: string;
  isEditMode: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  showSave: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, isEditMode, onEditToggle, onSave, showSave }) => (
  <Div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Div style={{ flexShrink: 1, minWidth: 0 }}> {/* 텍스트 컨테이너가 줄어들 수 있도록 설정 */}
      <H3 style={{ margin: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>{title}</H3> {/* 제목 텍스트 줄 바꿈 허용 */}
      <p style={{ color: '#666', fontSize: '12px', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{subTitle}</p> {/* 부제목 텍스트 줄 바꿈 허용 */}
    </Div>
    <Div style={{ display: 'flex', gap: '8px' }}>
      {showSave && isEditMode && (
        <Button onClick={onSave} style={{ backgroundColor: '#4CAF50', color: 'white' }}>저장</Button>
      )}
      <Button 
        onClick={onEditToggle} 
        style={{ backgroundColor: isEditMode ? '#666' : '#2196F3', color: 'white' }}
      >
        {isEditMode ? '취소' : '편집'}
      </Button>
    </Div>
  </Div>
);