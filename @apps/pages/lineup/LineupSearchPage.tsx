import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, vars } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { YearlyLineup } from '@packages/sit-val/types/Database';
import { DataManagementView } from '../../common/components/DataManagementView';
import { ListItemCard } from '../../common/components/ListItemCard';

const LineupSearchPage: React.FC = () => {
	const navigate = useNavigate();
	const [lineups, setLineups] = useState<YearlyLineup[]>(db.getSyncCache('allYearlyLineups') || []);
	const [isLoading, setIsLoading] = useState(lineups.length === 0);

	const loadLineups = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await db.getAllYearlyLineups();
			setLineups(data);
		} catch (e) {
			console.error("데이터 로드 실패:", e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadLineups();
	}, [loadLineups]);

	const handleDeleteLineup = async (id: string) => {
		if (window.confirm('정말로 이 라인업을 삭제하시겠습니까?')) {
			try {
				await db.deleteYearlyLineup(id);
				await loadLineups(); // 목록 새로고침
			} catch (error: any) {
				alert(`삭제 실패: ${error.message}`);
			}
		}
	};

	return (
		<DataManagementView
			title="라인업"
			items={lineups}
			createPath="/lineup/new"
			isLoading={isLoading}
			onDeleteItem={handleDeleteLineup}
			renderItem={(l, isCreator, onDelete) => (
				<ListItemCard onClick={() => navigate(`/lineup/${l.id}`)}>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<Div style={{ backgroundColor: vars.surface, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: vars.primary }}>{l.year}</Div>
						<span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{l.name}</span>
					</Div>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
						<span style={{ fontSize: '12px', color: vars.text, opacity: 0.4 }}>{l.id}</span>
						{isCreator && (
							<button onClick={(e) => { e.stopPropagation(); onDelete(l.id); }} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }}>✕</button>
						)}
					</Div>
				</ListItemCard>
			)}
		/>
	);
};
export default LineupSearchPage;