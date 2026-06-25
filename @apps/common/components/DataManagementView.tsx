import React, { useState, useMemo, useEffect } from 'react';
import { Box, Div, Button, H3, vars } from '@shared/bridges/UIBridge';
import { useNavigate } from 'react-router-dom';
import * as Hangul from 'hangul-js';
import { db } from '../../services/db';
import { StatusMessage } from './StatusMessage';

interface Props<T> {
  title: string; // 페이지 제목
  items: (T & { creatorId?: string })[]; // 목록 아이템 (creatorId 포함 가능)
  createPath: string; // 새 항목 생성 경로
  renderItem: (item: T & { creatorId?: string }, isCreator: boolean, onDeleteItem: (id: string) => void) => React.ReactNode; // 아이템 렌더링 함수
  onDeleteItem?: (id: string) => void; // 아이템 삭제 콜백
  isLoading?: boolean; // 로딩 상태 추가
  errorMessage?: string | null;
}

export const DataManagementView = <T extends { id: string }>({ title, items, createPath, renderItem, onDeleteItem, isLoading, errorMessage }: Props<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return safeItems;

    const lowerSearch = trimmedSearch.toLowerCase();
    
    return safeItems.filter(item => {
      const target = item as any;
      
      // 한글 검색 (초성 및 비완성형 지원) - name, leagueId 필드에 대해 적용
      const nameMatch = target.name && Hangul.search(target.name, trimmedSearch) >= 0;
      const leagueIdMatch = target.leagueId && Hangul.search(target.leagueId, trimmedSearch) >= 0;

      // 숫자 및 영문/ID 검색 (기존 방식 유지)
      // toString()을 사용하여 숫자도 검색 가능하게 함
      // id는 항상 존재하므로 nullish 체크 불필요
      const yearMatch = target.year?.toString().includes(lowerSearch);
      const idMatch = target.id.toLowerCase().includes(lowerSearch);
      
      return nameMatch || yearMatch || idMatch || leagueIdMatch;
    });
  }, [items, searchTerm]);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    db.getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  return (
    <Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box', width: '100%' }}>
      <Box>
        <H3>{title} 관리</H3>
        <Div style={{ display: 'flex', flexDirection: 'row', gap: '10px', padding: '10px'}}>
            <Div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="검색(이름, 연도 등)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1,
                  padding: '10px',
                  paddingRight: '35px',
                  boxSizing: 'border-box',
                  border: `1px solid ${vars.surface}`,
                  borderRadius: '10px',
                  fontFamily: vars.font,
                  color: vars.text,
                  backgroundColor: vars.background,
                  width: '100%'
                }} 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: vars.text,
                    opacity: 0.5
                  }}
                >✕</button>
              )}
            </Div>
            <Button onClick={() => navigate(createPath)} style={{ color: 'white', boxSizing: 'border-box' }}>새로 생성</Button>
        </Div>
      </Box>
      
      <Box style={{ padding: '10px' }}>
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isLoading ? (
            <StatusMessage title="목록을 불러오는 중..." description="저장된 분석 데이터를 읽고 있습니다." />
          ) : errorMessage ? (
            <StatusMessage title="목록을 불러오지 못했습니다." description={errorMessage} tone="error" />
          ) : items.length === 0 ? (
            <StatusMessage title="등록된 정보가 없습니다." description="새로 생성 버튼으로 첫 분석을 추가할 수 있습니다." />
          ) : filteredItems.length === 0 ? (
            <StatusMessage title="검색 결과가 없습니다." description="이름, 연도, ID 키워드를 조금 바꿔서 다시 찾아보세요." />
          ) : (
            filteredItems.map(item => {
              const isCreator = currentUser && item.creatorId === currentUser.id;
              // onDeleteItem이 있을 경우에만 전달
              return <Div key={item.id}>{renderItem(item, isCreator, onDeleteItem || (() => {}))}</Div>
            })
          )}
        </Div>
      </Box>
    </Div>
  );
};
