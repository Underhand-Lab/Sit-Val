import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, vars } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { DataManagementView } from '../../common/components/DataManagementView';
import { ListItemCard } from '../../common/components/ListItemCard';

const PlayerSearchPage: React.FC = () => {
	const navigate = useNavigate();
	const [players, setPlayers] = useState<(YearlyPlayer & { name: string })[]>(db.getSyncCache('allYearlyPlayersWithNames') || []);
	const [isLoading, setIsLoading] = useState(players.length === 0);

	const loadPlayers = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await db.getAllYearlyPlayersWithNames();
			setPlayers(data);
		} catch (e) {
			console.error("데이터 로드 실패:", e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPlayers();
	}, [loadPlayers]);

	const handleDeletePlayer = async (id: string) => {
		if (window.confirm('정말로 이 선수를 삭제하시겠습니까?')) {
			try {
				await db.deleteYearlyPlayer(id);
				await loadPlayers(); // 목록 새로고침
			} catch (error: any) {
				alert(`삭제 실패: ${error.message}`);
			}
		}
	};

	return (
		<DataManagementView
			title="선수"
			items={players as (YearlyPlayer & { creatorId?: string })[]}
			createPath="/player/new"
			isLoading={isLoading}
			onDeleteItem={handleDeletePlayer}
			renderItem={(p, isCreator, onDelete) => (
				<ListItemCard onClick={() => navigate(`/player/${p.id}`)}>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
						<Div style={{ backgroundColor: vars.surface, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: vars.primary }}>{p.year}</Div>
						<span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{p.name}</span>
					</Div>
					<span style={{ fontSize: '12px', color: vars.text, opacity: 0.4, marginRight: '10px' }}>{p.id}</span>
					{isCreator && (
						<button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }}>✕</button>
					)}
				</ListItemCard>
			)}
		/>
	);
};
export default PlayerSearchPage;