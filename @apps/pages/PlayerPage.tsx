import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Div, Button, FixedFooter, BottomSheet, H3 } from '@shared/bridges/UIBridge';
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer'; // Re-use PersonalVisualizer
import { db } from '../services/db';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { Player, YearlyPlayer, YearlyLeague } from '@packages/sit-val/types/Database'; // Correct import path
import * as TransitionEngine from '@sit-val/lib/transition-engine/';
import * as Calc from "@sit-val/lib/sabermetrics/calc";
import { calculateRE, RECalculationResult } from '../features/league/api/re-league';
import { RunnerStats } from '@sit-val/types/RunnerStats'; // PersonalVisualizer needs league runner stats
import { calculateBatterAbility } from '../common/api/stats';
import { PageHeader } from '../common/components/PageHeader';
import { VisualizerList } from '../common/components/VisualizerList';
import { DataManagementView } from '../common/components/DataManagementView';

const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, pa: 0 };

// Initial runner stats for calculation if league data is missing
const INITIAL_RUNNER_STATS: RunnerStats = {
  passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03,
  s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40,
  '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30,
  '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7,
  '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85,
  fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3
};

const PlayerPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const batterRef = useRef<BatterInputHandle>(null);
  const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);

  const [playerYearlyStats, setPlayerYearlyStats] = useState<YearlyPlayer | null>(null);
  const [playerInfo, setPlayerInfo] = useState<Player | null>(null);
  const [leagueData, setLeagueData] = useState<YearlyLeague | null>(null);
  const [currentBatterStats, setCurrentBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [vizData, setVizData] = useState<any>(null);
  const [isBatterInputOpen, setIsBatterInputOpen] = useState(false);
  const activeTools = useMemo(() => [{ id: 1, Component: PersonalVisualizer }], []);

  useEffect(() => {
    const targetId = id === 'new' ? searchParams.get('from') : id;
    if (!id) return;
    const data = targetId ? db.getYearlyPlayerById(targetId) : null;
    if (data) {
      setPlayerYearlyStats(data); setCurrentBatterStats(data.stats);
      setPlayerInfo((db.getPlayers()).find(p => p.id === data.playerId) || { id: data.playerId, name: '알 수 없음' });
      setLeagueData(db.getYearlyLeagues('kbo').find(l => l.year === data.year) || null);
    } else if (id === 'new') {
      setPlayerInfo({ id: 'new', name: '신규 분석' });
    }
    setIsEditMode(id === 'new');
  }, [id, searchParams]);

  const execute = useCallback(() => {
    if (!currentBatterStats || !leagueData) return setVizData(null);
    const ability = calculateBatterAbility(currentBatterStats);
    const ret = calculateRE(ability, INITIAL_RUNNER_STATS, transitionEngine);
    const lgBatter = { ...leagueData.stats, pa: leagueData.stats.pa || 1 };
    const weights = Calc.calculateWeightedRunValue(lgBatter, ret['runValue']);
    const lgWobaRaw = Calc.calculateCustomWOBA(weights, lgBatter);
    setVizData([ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], lgBatter)]);
  }, [currentBatterStats, leagueData, transitionEngine]);

  useEffect(() => { execute(); }, [execute]);

  const handleSave = useCallback(() => {
    const yearInput = prompt('연도', '2024'); if (!yearInput) return;
    const yearNum = parseInt(yearInput);
    const playerIdToUse = playerYearlyStats?.playerId || 'new-player';
    const dataToSave = { 
      ...(playerYearlyStats || { playerId: playerIdToUse, yearlyTeamIds: [] }), 
      id: id !== 'new' ? id! : '', year: yearNum, stats: { ...currentBatterStats, r: 0, rbi: 0 } 
    };
    try {
      const res = db.saveYearlyPlayer(dataToSave as any);
      navigate(`/player/${res.id}`); setIsEditMode(false);
    } catch (e: any) { alert(e.message); }
  }, [playerYearlyStats, currentBatterStats, id, navigate]);

  if (!id) return <DataManagementView title="선수" items={db.getData('yearlyPlayers')} createPath="/player/new" renderItem={(p) => <Button onClick={() => navigate(`/player/${p.id}`)}>{p.year} ID:{p.id}</Button>} />;
  if (id !== 'new' && !db.getYearlyPlayerById(id)) return <Div style={{ padding: '40px' }}>404 - 선수를 찾을 수 없습니다.</Div>;

  return (
    <Div id="wrapper">
      <PageHeader title={id === 'new' ? '신규 선수 분석' : `${playerInfo?.name || ''} (${playerYearlyStats?.year || ''})`} subTitle={id} isEditMode={isEditMode} onEditToggle={() => isEditMode ? navigate('/player') : navigate(`/player/new?from=${id}`)} onSave={handleSave} showSave={true} />
      <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
        {leagueData ? <VisualizerList tools={activeTools} data={vizData} onRemove={() => {}} /> : <Box><p>리그 데이터가 없어 확장 가치를 계산할 수 없습니다. 스탯을 편집하고 저장하세요.</p></Box>}
      </Div>
      <FixedFooter>
        <Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
          {isEditMode ? <Button onClick={() => setIsBatterInputOpen(true)}>스탯 상세</Button> : <Button onClick={() => navigate('/player')}>목록</Button>}
        </Div>
      </FixedFooter>
      <BottomSheet isOpen={isBatterInputOpen} onClose={() => setIsBatterInputOpen(false)} title="선수 스탯">
        <BatterInput initialStats={currentBatterStats} onDataChange={setCurrentBatterStats} />
        <Button onClick={() => { handleSave(); setIsBatterInputOpen(false); }} style={{ width: '100%', marginTop: '10px', backgroundColor: '#4CAF50', color: 'white' }}>저장</Button>
      </BottomSheet>
    </Div>
  );
};

export default PlayerPage;