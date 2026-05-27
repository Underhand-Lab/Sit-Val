import React from 'react';
import { Box, Div, Button, H3, vars } from '@shared/bridges/UIBridge';
import { useNavigate } from 'react-router-dom';

interface Props<T> {
  title: string;
  items: T[];
  createPath: string;
  renderItem: (item: T) => React.ReactNode;
}

export const DataManagementView = <T extends { id: string }>({ title, items, createPath, renderItem }: Props<T>) => {
  const navigate = useNavigate();
  return (
    <Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', width: '100%' }}>
      <Box>
        <H3>{title} 관리</H3>
        <Div style={{ display: 'flex', flexDirection: 'row', gap: '10px', padding: '10px'}}>
            <input type="text" placeholder="검색..."
            style={{ flex: 1,
              padding: '10px',
              boxSizing: 'border-box',
              border: `1px solid ${vars.surface}`,
              borderRadius: '10px',
              fontFamily: vars.font,
              color: vars.text,
              backgroundColor: vars.background
              }} />
            <Button onClick={() => navigate(createPath)} style={{ color: 'white', boxSizing: 'border-box' }}>새로 생성</Button>
        </Div>
      </Box>
      <Box>
        <H3>등록된 목록</H3>
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? <p>등록된 정보가 없습니다.</p> : items.map(item => <Div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>{renderItem(item)}</Div>)}
        </Div>
      </Box>
    </Div>
  );
};