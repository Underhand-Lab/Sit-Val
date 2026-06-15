import { YearlyLeague, YearlyPlayer } from '@packages/sit-val/types/Database';
import { Button, Div, FixedFooter, vars } from '@shared/bridges/UIBridge';
import { BatterStats } from '@sit-val/types/BatterStats';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';

interface PlayerInfoPageProps {
  id: string;
  playerName: string;
  playerInfo: YearlyPlayer | null;
  selectedYear: number;
  leagueData: YearlyLeague | null;
  activeTools: Array<{ type: string; name: string; Component: React.ComponentType<any>; props?: any }>;
  setActiveTools: (tools: any) => void;
  vizData: any;
  isToolMenuOpen: boolean;
  setIsToolMenuOpen: (val: boolean) => void;
  addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
  toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const PlayerInfoPage: React.FC<PlayerInfoPageProps> = ({
  id, playerName, playerInfo, selectedYear, leagueData, activeTools = [], setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions
}) => {
  const navigate = useNavigate();

  const commonItemProps = useMemo(() => ({
    batterStats: playerInfo?.stats ? new BatterStats(playerInfo.stats) : undefined
  }), [playerInfo]);

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
      <VisualizerList 
        tools={activeTools} 
        data={vizData} 
        commonItemProps={commonItemProps}
        onToolsSync={setActiveTools}
        toolOptions={toolOptions || []}
        onAddTool={addTool}
        isToolMenuOpen={isToolMenuOpen}
        setIsToolMenuOpen={setIsToolMenuOpen}
        storageKey="player-visualizer-layout"
      />
      <FixedFooter style={{ backgroundColor: vars.box, borderTop: `1px solid ${vars.surface}` }}>
        <Div style={{ display: 'flex', gap: '10px', padding: '15px', justifyContent: 'center' }}>
          <Button onClick={() => navigate('/player')}>목록</Button>
        </Div>
      </FixedFooter>
    </Div>
  );
};
export default PlayerInfoPage;