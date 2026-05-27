import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Box, FixedFooter, Button, vars } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import { YearlyPlayer, YearlyLeague } from '@packages/sit-val/types/Database';

interface PlayerInfoPageProps {
  id: string;
  playerName: string;
  playerInfo: YearlyPlayer | null;
  selectedYear: number;
  leagueData: YearlyLeague | null;
  activeTools: Array<{ id: string; name: string; Component: React.ComponentType<any>; props?: any }>;
  vizData: any;
  onRemoveTool: (id: string) => void;
  isToolMenuOpen: boolean;
  setIsToolMenuOpen: (val: boolean) => void;
  addTool: (option: { name: string, Component: React.ComponentType<any>, props?: any }) => void;
  toolOptions: Array<{ name: string, Component: React.ComponentType<any>, props?: any }>;
}

const PlayerInfoPage: React.FC<PlayerInfoPageProps> = ({
  id, playerName, playerInfo, selectedYear, leagueData, activeTools = [], vizData, onRemoveTool, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions
}) => {
  const navigate = useNavigate();

  // 분석 도구들에 현재 선수의 스탯을 주입합니다.
  const toolsWithStats = useMemo(() => {
    return activeTools.map(tool => ({
      ...tool,
      props: { ...tool.props, batterStats: playerInfo?.stats }
    }));
  }, [activeTools, playerInfo]);

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
        tools={toolsWithStats} 
        data={vizData} 
        onRemove={onRemoveTool || (() => {})} 
        toolOptions={toolOptions || []}
        onAddTool={addTool}
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