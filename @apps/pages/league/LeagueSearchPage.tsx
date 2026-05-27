import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, vars } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { YearlyLeague } from '@packages/sit-val/types/Database';
import { DataManagementView } from '../../common/components/DataManagementView';

const LeagueSearchPage: React.FC = () => {
	const navigate = useNavigate();
	const [leagues, setLeagues] = useState(db.getYearlyLeagues('kbo'));

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

	return (
		<DataManagementView
			title="리그"
			items={db.getYearlyLeagues('kbo')}
			createPath="/league/new"
			renderItem={(l) => <ListItemCard onClick={() => navigate(`/league/${l.id}`)}>{/* 기존 Div 내용을 children으로 전달 */}<Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Div style={{ backgroundColor: vars.surface, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: vars.primary }}>{l.year}</Div><span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{l.leagueId}</span></Div><span style={{ fontSize: '12px', color: vars.text, opacity: 0.4 }}>{l.id}</span></ListItemCard>}
		/>
	);
};
export default LeagueSearchPage;