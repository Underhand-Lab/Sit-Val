import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Box, FixedFooter, Button } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import Popup from '@shared/components/Modal';

interface LineupInfoPageProps {
	id: string;
	lineupName: string;
	selectedYear: number;
	activeTools: Array<{ id: number, Component: React.ComponentType<any> }>;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (Component: React.ComponentType<any>) => void;
	toolOptions: Array<{ name: string, Component: React.ComponentType<any> }>;
	onRemoveTool: (id: number) => void;
}

const LineupInfoPage: React.FC<LineupInfoPageProps> = ({
	id, lineupName, selectedYear, activeTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions, onRemoveTool
}) => {
	const navigate = useNavigate();
	return (
		<Div id="wrapper">
			<PageHeader
				title={`${lineupName} (${selectedYear})`}
				subTitle={id}
				isEditMode={false}
				onEditToggle={() => navigate(`/lineup/new?from=${id}`)}
				onSave={() => { }}
				showSave={false}
			/>
			<VisualizerList tools={activeTools} data={vizData} onRemove={onRemoveTool} />
			<Popup isOpen={isToolMenuOpen} onClose={() => setIsToolMenuOpen(false)} title="분석 도구 추가">
				<Div className="tool-grid">
					{toolOptions.map(option => (
						<Button key={option.name} onClick={() => addTool(option.Component)}>{option.name}</Button>
					))}
				</Div>
			</Popup>
			<FixedFooter>
				<Box className="container">
					<Div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
						<Button onClick={() => navigate('/lineup')}>목록</Button>
						<Button onClick={() => setIsToolMenuOpen(true)}>도구 추가</Button>
					</Div>
				</Box>
			</FixedFooter>
		</Div>
	);
};
export default LineupInfoPage;