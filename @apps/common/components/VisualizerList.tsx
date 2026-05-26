import React from 'react';
import { Div } from '@shared/bridges/UIBridge';
import VisualizerBox from '@sit-val/components/VisualizerBox';

interface VisualizerListProps {
  tools: Array<{ id: number, Component: React.ComponentType<any> }>;
  data: any;
  onRemove: (id: number) => void;
}

export const VisualizerList: React.FC<VisualizerListProps> = ({ tools, data, onRemove }) => (
  <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
    {tools.map(tool => (
      <VisualizerBox key={tool.id} onRemove={() => onRemove(tool.id)}>
        <tool.Component data={data} />
      </VisualizerBox>
    ))}
  </Div>
);