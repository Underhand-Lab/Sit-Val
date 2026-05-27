import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Box, FixedFooter, Button } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import { Player, YearlyLeague } from '@packages/sit-val/types/Database';

interface PlayerInfoPageProps {
  id: string;
  playerName: string;
  playerInfo: Player | null;
  selectedYear: number;
  leagueData: YearlyLeague | null;
  activeTools: Array<{ id: number; Component: React.ComponentType<any> }>;
  vizData: any;
}

const PlayerInfoPage: React.FC<PlayerInfoPageProps> = ({ id, playerName, playerInfo, selectedYear, leagueData, activeTools, vizData }) => {
  const navigate = useNavigate();
  return (
    <Div id="wrapper">
      <PageHeader 
        title={`${playerName || playerInfo?.name || ''} (${selectedYear})`} 
        subTitle={id} 
        isEditMode={false} 
        onEditToggle={() => navigate(`/player/new?from=${id}`)} 
        onSave={() => {}} 
        showSave={false} 
      />
      <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        {leagueData ? <VisualizerList tools={activeTools} data={vizData} onRemove={() => {}} /> : <Box><p>리그 데이터가 없습니다.</p></Box>}
      </Div>
      <FixedFooter>
        <Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
          <Button onClick={() => navigate('/player')}>목록</Button>
        </Div>
      </FixedFooter>
    </Div>
  );
};
export default PlayerInfoPage;