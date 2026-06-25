import React from 'react';
import { Div, vars } from '@shared/bridges/UIBridge';

interface StatusMessageProps {
  title: string;
  description?: string;
  tone?: 'default' | 'error';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ title, description, tone = 'default' }) => {
  const color = tone === 'error' ? '#c0392b' : vars.text;

  return (
    <Div style={{ padding: '40px 20px', textAlign: 'center', color }}>
      <Div style={{ fontSize: '16px', fontWeight: 600, marginBottom: description ? '8px' : 0 }}>{title}</Div>
      {description ? <Div style={{ fontSize: '13px', opacity: 0.7 }}>{description}</Div> : null}
    </Div>
  );
};
