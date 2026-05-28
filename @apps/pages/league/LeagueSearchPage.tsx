import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, vars } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { YearlyLeague } from '@packages/sit-val/types/Database';
import { DataManagementView } from '../../common/components/DataManagementView';

const LeagueSearchPage: React.FC = () => {
	const navigate = useNavigate();
	const [leagues, setLeagues] = useState<YearlyLeague[]>(db.getSyncCache('yearlyLeagues_kbo') || []);
	const [isLoading, setIsLoading] = useState(leagues.length === 0);

	const loadLeagues = useCallback(async () => {
		try {
			setIsLoading(true);
			const data = await db.getYearlyLeagues('kbo');
			setLeagues(data);
		} catch (e) {
			console.error("데이터 로드 실패:", e);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadLeagues();
	}, [loadLeagues]);

	// ListItemCard 컴포넌트를 LeagueSearchPage 내부에 정의하여 hover 및 삭제 기능을 적용합니다.
	const ListItemCard: React.FC<{
		children: React.ReactNode;
		onClick: () => void;
	}> = ({ children, onClick }) => {
		const [isHovered, setIsHovered] = useState(false);

		return (
			<Div
				onClick={onClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				style={{
					padding: '16px',
					backgroundColor: vars.box,
					borderRadius: '12px',
					cursor: 'pointer',
					border: `1px solid ${vars.surface}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					transition: 'all 0.2s ease-in-out', // 부드러운 전환 효과
					transform: isHovered ? 'translateY(-3px)' : 'translateY(0)', // 마우스 오버 시 살짝 위로 이동
					boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none', // 마우스 오버 시 그림자 효과
				}}
			>
				{children}
			</Div>
		);
	};

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