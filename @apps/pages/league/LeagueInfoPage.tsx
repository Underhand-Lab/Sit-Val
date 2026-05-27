import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, FixedFooter, Button } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import Popup from '@shared/components/Modal';

interface LeagueInfoPageProps {
	id: string;
	leagueIdInput: string;
	selectedYear: number;
	activeTools: any[];
	onRemoveTool: (id: number) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (Component: React.ComponentType<any>) => void;
	toolOptions: Array<{ name: string, Component: React.ComponentType<any> }>;
}

const LeagueInfoPage: React.FC<LeagueInfoPageProps> = ({
	id, leagueIdInput, selectedYear, activeTools, onRemoveTool, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions
}) => {
	const navigate = useNavigate();
	return (
		<Div id="wrapper">
			<PageHeader
				title={`${leagueIdInput} (${selectedYear})`}
				subTitle={id}
				isEditMode={false}
				onEditToggle={() => navigate(`/league/new?from=${id}`)}
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
				<Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
					<Button onClick={() => navigate('/league')}>목록</Button>
					<Button onClick={() => setIsToolMenuOpen(true)}>도구</Button>
				</Div>
			</FixedFooter>
		</Div>
	);
};

export default LeagueInfoPage;