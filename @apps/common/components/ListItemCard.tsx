import React, { useState } from 'react';
import { Div, vars } from '@shared/bridges/UIBridge';

interface ListItemCardProps {
	children: React.ReactNode;
	onClick: () => void;
	style?: React.CSSProperties;
}

/**
 * 검색 결과 및 목록에서 공통으로 사용되는 카드 컴포넌트입니다.
 * 호버 시 부드러운 상승 애니메이션과 그림자 효과가 적용됩니다.
 */
export const ListItemCard: React.FC<ListItemCardProps> = ({ children, onClick, style }) => {
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
				transition: 'all 0.2s ease-in-out',
				transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
				boxShadow: isHovered ? '0 4px 8px rgba(0, 0, 0, 0.1)' : 'none',
				...style,
			}}
		>
			{children}
		</Div>
	);
};