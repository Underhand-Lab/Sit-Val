import React, { useState, useEffect, useMemo } from 'react';
import { Div, Box, Wrapper, H3, vars, Button } from '@shared/bridges/UIBridge';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import * as Hangul from 'hangul-js';
import { ListItemCard } from '../common/components/ListItemCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [leagues, setLeagues] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [lg, pl, li] = await Promise.all([
          db.getAllYearlyLeagues(),
          db.getAllYearlyPlayersWithNames(),
          (db as any).getAllYearlyLineups ? (db as any).getAllYearlyLineups() : [] // 라인업 가져오기 (메서드 존재 가정)
        ]);
        setLeagues(lg);
        setPlayers(pl);
        setLineups(li);
      } catch (e) {
        console.error("데이터 로드 중 오류:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const filterItem = (item: any, term: string) => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    const nameMatch = (item.name || item.leagueId || '') && Hangul.search(item.name || item.leagueId || '', term) >= 0;
    const yearMatch = item.year?.toString().includes(lowerTerm);
    return nameMatch || yearMatch;
  };

  const filteredLeagues = useMemo(() => leagues.filter(l => filterItem(l, searchTerm)).slice(0, 5), [leagues, searchTerm]);
  const filteredPlayers = useMemo(() => players.filter(p => filterItem(p, searchTerm)).slice(0, 5), [players, searchTerm]);
  const filteredLineups = useMemo(() => lineups.filter(l => filterItem(l, searchTerm)).slice(0, 5), [lineups, searchTerm]);

  const renderListSection = (title: string, items: any[], path: string, type: 'league' | 'player' | 'lineup') => (
    <Div style={{ width: '100%' }}>
      <Div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <H3 style={{ margin: 0 }}>{title}</H3>
        <Button onClick={() => navigate(`/${type}`)} style={{ padding: '4px 12px', fontSize: '12px' }}>전체보기</Button>
      </Div>
      <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.length > 0 ? items.map(item => (
          <ListItemCard key={item.id} onClick={() => navigate(`/${type}/${item.id}`)}>
            <Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Div style={{ 
                backgroundColor: vars.surface, 
                padding: '4px 8px', 
                borderRadius: '6px', 
                fontSize: '12px', 
                fontWeight: 'bold', 
                color: vars.primary 
              }}>{item.year}</Div>
              <span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{item.name || item.leagueId}</span>
            </Div>
            <span style={{ fontSize: '12px', color: vars.text, opacity: 0.4 }}>{item.id.split('-')[0]}...</span>
          </ListItemCard>
        )) : (
          <p style={{ opacity: 0.5, fontSize: '12px', textAlign: 'center' }}>데이터가 없습니다.</p>
        )}
      </Div>
    </Div>
  );

  return (
    <Div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      {/* 통합 검색 바 */}
      <Box style={{ padding: '20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        <H3 style={{ marginBottom: '20px' }}>어떤 분석을 찾으시나요?</H3>
        <input
          type="text"
          placeholder="리그, 선수, 라인업 검색 (이름 또는 연도)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: `1px solid ${vars.surface}`,
            backgroundColor: vars.background,
            color: vars.text,
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </Box>
      <Box className="container" style={{ width: '100%', boxSizing: 'border-box', padding: '30px' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '40px' }}>데이터를 불러오는 중...</p>
        ) : (
          <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {renderListSection('리그 분석', filteredLeagues, '/league', 'league')}
            <hr style={{ border: 'none', borderTop: `1px solid ${vars.surface}` }} />
            {renderListSection('선수 분석', filteredPlayers, '/player', 'player')}
            <hr style={{ border: 'none', borderTop: `1px solid ${vars.surface}` }} />
            {renderListSection('라인업 분석', filteredLineups, '/lineup', 'lineup')}
          </Div>
        )}
      </Box>
    </Div>
  );
};

export default HomePage;