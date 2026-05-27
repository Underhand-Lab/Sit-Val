import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Div } from '@shared/bridges/UIBridge';
import { db } from '../services/db';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { Player, YearlyPlayer, YearlyLeague } from '@packages/sit-val/types/Database';
import * as TransitionEngine from '@sit-val/lib/transition-engine/';
import * as Calc from "@sit-val/lib/sabermetrics/calc";
import { calculateRE } from '../features/league/api/re-league';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { calculateBatterAbility } from '../common/api/stats';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer';

// 서브 페이지 임포트
import PlayerSearchPage from './player/PlayerSearchPage';
import PlayerInfoPage from './player/PlayerInfoPage';
import PlayerEditPage from './player/PlayerEditPage';

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
  const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);

  const [playerYearlyStats, setPlayerYearlyStats] = useState<YearlyPlayer | null>(null);
  const [playerInfo, setPlayerInfo] = useState<Player | null>(null);
  const [leagueData, setLeagueData] = useState<YearlyLeague | null>(null);
  const [currentBatterStats, setCurrentBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS);
  const [selectedYear, setSelectedYear] = useState<number>(2024), [playerName, setPlayerName] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [vizData, setVizData] = useState<any>(null);
  const activeTools = useMemo(() => [{ id: 1, Component: PersonalVisualizer }], []);

  useEffect(() => {
    const targetId = id === 'new' ? searchParams.get('from') : id;
    if (!id) return;
    const data = targetId ? db.getYearlyPlayerById(targetId) : null;
    if (data) {
      setPlayerYearlyStats(data); setCurrentBatterStats(data.stats); setSelectedYear(data.year);
      const info = (db.getPlayers()).find(p => p.id === data.playerId) || { id: data.playerId, name: (data as any).name || '알 수 없음' };
      setPlayerInfo(info); setPlayerName(info.name);
      setLeagueData(db.getYearlyLeagues('kbo').find(l => l.year === data.year) || null);
    } else if (id === 'new') {
      setPlayerInfo({ id: 'new', name: '신규 분석' }); setPlayerName('신규 분석');
    }
    setIsEditMode(id === 'new');
  }, [id, searchParams]);

  // RE 계산 로직은 공통으로 사용하므로 Entry에서 관리
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

  if (!id) return <PlayerSearchPage />;
  if (id !== 'new' && !db.getYearlyPlayerById(id)) return <Div style={{ padding: '40px' }}>404 - 선수를 찾을 수 없습니다.</Div>;

  return isEditMode ? (
    <PlayerEditPage 
      id={id}
      playerYearlyStats={playerYearlyStats}
      playerName={playerName} setPlayerName={setPlayerName}
      selectedYear={selectedYear} setSelectedYear={setSelectedYear}
      currentBatterStats={currentBatterStats} setCurrentBatterStats={setCurrentBatterStats}
    />
  ) : (
    <PlayerInfoPage 
      id={id}
      playerName={playerName}
      playerInfo={playerInfo}
      selectedYear={selectedYear}
      leagueData={leagueData}
      activeTools={activeTools}
      vizData={vizData}
    />
  );
};

export default PlayerPage;