import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Div, InputNumber, Select, vars } from '@shared/bridges/UIBridge';
import RunnerInput from '@sit-val/components/RunnerInput';
import BatterInput from '@sit-val/components/BatterInput';
import { db } from '../../services/db';
import { ListItemCard } from '../../common/components/ListItemCard';
import { LineupPlayerDisplay } from '../hooks/useLineupPageModel';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { ExtendedBatterStats, Player, YearlyPlayer } from '@packages/sit-val/types/Database';
import * as Hangul from 'hangul-js';

interface LineupInlineEditorProps {
  section?: 'lineup' | 'player' | 'runner';
  lineupName: string;
  setLineupName: (val: string) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  availablePlayers: LineupPlayerDisplay[];
  setAvailablePlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
  currentLineupPlayers: LineupPlayerDisplay[];
  setCurrentLineupPlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
  lineupOrder: string[];
  setLineupOrder: React.Dispatch<React.SetStateAction<string[]>>;
  lineupRunnerStats: RunnerStats;
  setLineupRunnerStats: (val: RunnerStats) => void;
  handleSave: () => Promise<void>;
  isSaveDisabled: boolean;
}

export const LineupInlineEditor: React.FC<LineupInlineEditorProps> = ({
  section = 'lineup',
  lineupName,
  setLineupName,
  selectedYear,
  setSelectedYear,
  availablePlayers,
  setAvailablePlayers,
  currentLineupPlayers,
  setCurrentLineupPlayers,
  lineupOrder,
  setLineupOrder,
  lineupRunnerStats,
  setLineupRunnerStats,
  handleSave,
  isSaveDisabled,
}) => {
  const [editingYearlyPlayerId, setEditingYearlyPlayerId] = useState<string | null>(null);
  const [editingPlayerStats, setEditingPlayerStats] = useState<BatterStatsData | null>(null);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [allSearchablePlayers, setAllSearchablePlayers] = useState<LineupPlayerDisplay[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  useEffect(() => {
    db.getAllYearlyPlayersWithNames().then((data) => {
      setAllSearchablePlayers(data.sort((a, b) => b.year - a.year));
    });
  }, []);

  const startEditPlayer = (yearlyPlayerId: string, stats: BatterStatsData) => {
    setEditingYearlyPlayerId(yearlyPlayerId);
    setEditingPlayerStats(stats);
    setSelectedPlayerId(yearlyPlayerId);
  };

  const lineupPlayersForEdit = useMemo(
    () => currentLineupPlayers.filter((player) => !player.id.startsWith('placeholder')),
    [currentLineupPlayers]
  );

  useEffect(() => {
    if (section !== 'player') return;
    if (selectedPlayerId && lineupPlayersForEdit.some((player) => player.id === selectedPlayerId)) return;
    const fallbackPlayer = lineupPlayersForEdit[0];
    if (fallbackPlayer) {
      startEditPlayer(fallbackPlayer.id, fallbackPlayer.stats);
    } else {
      setSelectedPlayerId('');
      setEditingYearlyPlayerId(null);
      setEditingPlayerStats(null);
    }
  }, [lineupPlayersForEdit, section, selectedPlayerId]);

  const syncEditedPlayerStats = useCallback((yearlyPlayerId: string, nextStats: BatterStatsData) => {
    setAvailablePlayers((prev) =>
      prev.map((player) =>
        player.id === yearlyPlayerId
          ? { ...player, stats: { ...player.stats, ...nextStats } as ExtendedBatterStats }
          : player
      )
    );
    setCurrentLineupPlayers((prev) =>
      prev.map((player) =>
        player.id === yearlyPlayerId
          ? { ...player, stats: { ...player.stats, ...nextStats } as ExtendedBatterStats }
          : player
      )
    );
  }, [setAvailablePlayers, setCurrentLineupPlayers]);

  const handleSaveEditedPlayerStats = useCallback(async () => {
    if (!editingYearlyPlayerId || !editingPlayerStats) return alert('저장할 데이터가 없습니다.');
    const originalYearlyPlayer = availablePlayers.find((player) => player.id === editingYearlyPlayerId);
    if (!originalYearlyPlayer) return alert('원본 선수를 찾을 수 없습니다.');

    const dataToSave: Omit<YearlyPlayer, 'creatorId'> = {
      ...originalYearlyPlayer,
      stats: { ...editingPlayerStats, r: 0, rbi: 0 } as ExtendedBatterStats
    };

    try {
      await db.saveYearlyPlayer(dataToSave);
      const updatedPlayers = await db.getPlayersWithYearlyStats(selectedYear);
      setAvailablePlayers(updatedPlayers);
      setEditingYearlyPlayerId(null);
      setEditingPlayerStats(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '선수 저장에 실패했습니다.');
    }
  }, [availablePlayers, editingPlayerStats, editingYearlyPlayerId, selectedYear, setAvailablePlayers]);

  const handleEditingPlayerStatsChange = useCallback((nextStats: BatterStatsData) => {
    setEditingPlayerStats(nextStats);
    if (!editingYearlyPlayerId) return;
    syncEditedPlayerStats(editingYearlyPlayerId, nextStats);
  }, [editingYearlyPlayerId, syncEditedPlayerStats]);

  const filteredSearchPlayers = useMemo(() => {
    const term = playerSearchTerm.trim();
    if (!term) return allSearchablePlayers.slice(0, 50);
    const lowerTerm = term.toLowerCase();
    return allSearchablePlayers.filter((player) =>
      (player.name && Hangul.search(player.name, term) >= 0) ||
      (player.year && player.year.toString().includes(lowerTerm)) ||
      (player.id && player.id.toLowerCase().includes(lowerTerm))
    ).slice(0, 100);
  }, [allSearchablePlayers, playerSearchTerm]);

  const handleSelectPlayer = (selectedPlayer: LineupPlayerDisplay) => {
    if (activeSlotIndex === null) return;

    setAvailablePlayers((prev) => {
      if (prev.find((player) => player.id === selectedPlayer.id)) return prev;
      return [...prev, selectedPlayer];
    });

    const nextOrder = [...lineupOrder];
    nextOrder[activeSlotIndex] = selectedPlayer.id;
    setLineupOrder(nextOrder);
    setCurrentLineupPlayers((prev) => prev.map((player, index) => index === activeSlotIndex ? selectedPlayer : player));
  };

  const handleCreateAndSelectNewPlayer = async () => {
    if (activeSlotIndex === null) return;
    const nameToUse = newPlayerName || playerSearchTerm || `새 선수 ${Date.now()}`;
    const newPlayerId = `new-player-${Date.now()}`;
    await db.addPlayer({ id: newPlayerId, name: nameToUse } as Player);
    const user = await db.getCurrentUser();
    const defaultStats: BatterStatsData = { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0 };
    const newYearlyPlayer: YearlyPlayer & { name: string } = {
      id: `${newPlayerId}-${selectedYear}-${Date.now()}`,
      playerId: newPlayerId,
      name: nameToUse,
      year: selectedYear,
      yearlyTeamIds: [],
      stats: { ...defaultStats, pa: 0, r: 0, rbi: 0 } as ExtendedBatterStats,
      creatorId: user?.id || 'unknown',
    };
    await db.saveYearlyPlayer(newYearlyPlayer);
    setAvailablePlayers((prev) => [...prev, newYearlyPlayer as LineupPlayerDisplay]);
    handleSelectPlayer(newYearlyPlayer as LineupPlayerDisplay);
  };

  const handleChoosePlayerForEdit = useCallback((yearlyPlayerId: string) => {
    setSelectedPlayerId(yearlyPlayerId);
    const player = currentLineupPlayers.find((candidate) => candidate.id === yearlyPlayerId);
    if (!player) {
      setEditingYearlyPlayerId(null);
      setEditingPlayerStats(null);
      return;
    }
    startEditPlayer(player.id, player.stats);
  }, [currentLineupPlayers]);

  return (
    <Div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {section === 'lineup' ? (
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <label style={{ minWidth: '88px' }}>라인업 이름</label>
              <InputNumber type="text" value={lineupName} onChange={(e) => setLineupName(e.target.value)} />
            </Div>
            <Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
              <label style={{ minWidth: '88px' }}>연도</label>
              <InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
            </Div>
          </Div>
          <Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} disabled={isSaveDisabled}>저장</Button>
          </Div>
        </Div>
      ) : null}

      {section === 'lineup' ? (
        <>
          <Div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong>타순 설정</strong>
            {lineupOrder.map((_, idx) => {
              const player = currentLineupPlayers[idx];
              const isEditingSlot = activeSlotIndex === idx;

              return (
                <Div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ListItemCard style={{ padding: '12px', borderRadius: '10px' }}>
                    <Div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                      <Div style={{
                        backgroundColor: vars.secondary,
                        color: 'white',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>{idx + 1}</Div>
                      <Div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{player?.name || '선수 선택'}</span>
                        <span style={{ fontSize: '12px', opacity: 0.5 }}>({player?.year || selectedYear})</span>
                      </Div>
                    </Div>
                    <Div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                      <Button onClick={() => {
                        setActiveSlotIndex(isEditingSlot ? null : idx);
                        setPlayerSearchTerm('');
                        setNewPlayerName('');
                      }}>
                        {isEditingSlot ? '선택 닫기' : '선수 추가'}
                      </Button>
                    </Div>
                  </ListItemCard>

                  {isEditingSlot ? (
                    <Div style={{ border: `1px solid ${vars.surface}`, borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input
                        placeholder="선수 이름 검색..."
                        value={playerSearchTerm}
                        onChange={(e) => setPlayerSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
                      />
                      <Div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <Button onClick={handleCreateAndSelectNewPlayer}>임시 선수 추가</Button>
                        {filteredSearchPlayers.map((searchPlayer) => (
                          <ListItemCard key={searchPlayer.id} onClick={() => handleSelectPlayer(searchPlayer)} style={{ marginBottom: '4px' }}>
                            <Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Div style={{ backgroundColor: vars.surface, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: vars.primary }}>
                                {searchPlayer.year}
                              </Div>
                              <span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{searchPlayer.name}</span>
                            </Div>
                            <span style={{ fontSize: '11px', color: vars.text, opacity: 0.4 }}>{searchPlayer.id.split('-')[0]}...</span>
                          </ListItemCard>
                        ))}
                        {playerSearchTerm.trim() !== '' && filteredSearchPlayers.length === 0 ? (
                          <Div style={{ padding: '16px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>'{playerSearchTerm}' 선수를 찾을 수 없습니다.</p>
                            <input
                              value={newPlayerName || playerSearchTerm}
                              onChange={(e) => setNewPlayerName(e.target.value)}
                              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <Button onClick={handleCreateAndSelectNewPlayer}>새 선수 생성 및 선택</Button>
                          </Div>
                        ) : null}
                      </Div>
                    </Div>
                  ) : null}
                </Div>
              );
            })}
          </Div>

        </>
      ) : null}

      {section === 'player' ? (
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <strong>선수 정보 편집</strong>
          {lineupPlayersForEdit.length === 0 ? (
            <p>라인업에 선수를 먼저 추가해주세요.</p>
          ) : (
            <>
              <Select
                value={selectedPlayerId}
                onChange={(e) => handleChoosePlayerForEdit(e.target.value)}
                options={lineupPlayersForEdit.map((player, index) => ({
                  label: `${index + 1}번 ${player.name} (${player.year})`,
                  value: player.id,
                }))}
              />
              {editingPlayerStats ? (
                <>
                  <BatterInput initialStats={editingPlayerStats} onDataChange={handleEditingPlayerStatsChange} />
                  <Div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button onClick={handleSave} disabled={isSaveDisabled}>라인업 저장</Button>
                    <Button onClick={handleSaveEditedPlayerStats}>선수 스탯 저장</Button>
                  </Div>
                </>
              ) : null}
            </>
          )}
        </Div>
      ) : null}

      {section === 'runner' ? (
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <strong>주자 설정</strong>
          <RunnerInput initialStats={lineupRunnerStats} onDataChange={setLineupRunnerStats} />
          <Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} disabled={isSaveDisabled}>저장</Button>
          </Div>
        </Div>
      ) : null}
    </Div>
  );
};
