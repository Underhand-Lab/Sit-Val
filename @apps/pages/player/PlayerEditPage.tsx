import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, FixedFooter, Button, BottomSheet } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import BatterInput from '@sit-val/components/BatterInput';
import { db } from '../../services/db';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { BatterStatsData } from '@sit-val/types/BatterStats';

interface PlayerEditPageProps {
  id: string;
  playerYearlyStats: YearlyPlayer | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  currentBatterStats: BatterStatsData;
  setCurrentBatterStats: (stats: BatterStatsData) => void;
}

const PlayerEditPage: React.FC<PlayerEditPageProps> = ({ id, playerYearlyStats, playerName, setPlayerName, selectedYear, setSelectedYear, currentBatterStats, setCurrentBatterStats }) => {
  const navigate = useNavigate();
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isBatterInputOpen, setIsBatterInputOpen] = useState(false);

  const handleSave = useCallback(() => {
    const playerIdToUse = playerYearlyStats?.playerId || `player-${Date.now()}`;
    const dataToSave = { ...(playerYearlyStats || { playerId: playerIdToUse, yearlyTeamIds: [] }), id: id !== 'new' ? id! : '', year: selectedYear, stats: { ...currentBatterStats, r: 0, rbi: 0 }, name: playerName };
    try {
      const res = db.saveYearlyPlayer(dataToSave as any);
      navigate(`/player/${res.id}`);
    } catch (e: any) { alert(e.message); }
  }, [playerYearlyStats, currentBatterStats, selectedYear, playerName, id, navigate]);

  const isMetaValid = playerName.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

  return (
    <Div id="wrapper">
      <PageHeader title={`${playerName} (${selectedYear})`} subTitle={id} isEditMode={true} onEditToggle={() => navigate(-1)} onSave={handleSave} showSave={true} isSaveDisabled={!isMetaValid} />
      <FixedFooter>
        <Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
          <Button onClick={() => setIsMetaOpen(true)}>정보 설정</Button>
          <Button onClick={() => setIsBatterInputOpen(true)}>스탯 상세</Button>
        </Div>
      </FixedFooter>
      <BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`${playerName} 정보 설정`}>
        <Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Div>
            <label style={{ display: 'block', marginBottom: '5px' }}>선수 이름</label>
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </Div>
          <Div>
            <label style={{ display: 'block', marginBottom: '5px' }}>분석 연도</label>
            <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </Div>
          <Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '15px', width: '100%', backgroundColor: isMetaValid ? undefined : '#ccc' }}>확인</Button>
        </Div>
      </BottomSheet>
      <BottomSheet isOpen={isBatterInputOpen} onClose={() => setIsBatterInputOpen(false)} title="선수 스탯">
        <BatterInput initialStats={currentBatterStats} onDataChange={setCurrentBatterStats} />
        <Button onClick={() => { handleSave(); setIsBatterInputOpen(false); }} style={{ width: '100%', marginTop: '10px', backgroundColor: '#4CAF50', color: 'white' }}>저장</Button>
      </BottomSheet>
    </Div>
  );
};
export default PlayerEditPage;