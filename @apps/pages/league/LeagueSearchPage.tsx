import { YearlyLeague } from '@packages/sit-val/types/Database';
import { Div, vars } from '@shared/bridges/UIBridge';

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataManagementView } from '../../common/components/DataManagementView';
import { ListItemCard } from '../../common/components/ListItemCard';

import { db } from '../../services/db';

const LeagueSearchPage: React.FC = () => {
	const navigate = useNavigate();
	const [leagues, setLeagues] = useState<YearlyLeague[]>(db.getSyncCache('yearlyLeagues_kbo') || []);
	const [isLoading, setIsLoading] = useState(leagues.length === 0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const loadLeagues = useCallback(async () => {
		try {
			setIsLoading(true);
			setErrorMessage(null);
			const data = await db.getYearlyLeagues('kbo');
			setLeagues(data);
		} catch (e) {
			console.error("데이터 로드 실패:", e);
			setErrorMessage(e instanceof Error ? e.message : '리그 데이터를 읽는 중 알 수 없는 오류가 발생했습니다.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadLeagues();
	}, [loadLeagues]);

	const handleDeleteLeague = async (id: string) => {
		if (window.confirm('정말로 이 리그를 삭제하시겠습니까?')) {
			try {
				await db.deleteYearlyLeague(id);
				await loadLeagues(); // 목록 새로고침
			} catch (error: any) {
				alert(`삭제 실패: ${error.message}`);
			}
		}
	};

	return (
		<DataManagementView<YearlyLeague>
			title="리그"
			items={leagues}
			createPath="/league/new"
			isLoading={isLoading}
			errorMessage={errorMessage}
			onDeleteItem={handleDeleteLeague}
			renderItem={(l, isCreator, onDelete) => (
				<ListItemCard onClick={() => navigate(`/league/${l.id}`)}>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<Div style={{ backgroundColor: vars.surface, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: vars.primary }}>{l.year}</Div>
						<span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{l.leagueId}</span>
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
export default LeagueSearchPage;
