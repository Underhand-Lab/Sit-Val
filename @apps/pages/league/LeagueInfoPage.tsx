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
	activeTools: Array<{ id: string, name: string, Component: React.ComponentType<any> }>;
	onRemoveTool: (id: string) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { name: string, Component: React.ComponentType<any> }) => void;
	toolOptions: Array<{ name: string, Component: React.ComponentType<any> }>;
}

const LeagueInfoPage: React.FC<LeagueInfoPageProps> = ({
	id, leagueIdInput, selectedYear, activeTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions, onRemoveTool
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

			<VisualizerList 
				tools={activeTools} 
				data={vizData} 
				onRemove={onRemoveTool} 
				toolOptions={toolOptions}
				onAddTool={addTool}
			/>

			<FixedFooter>
				<Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
					<Button onClick={() => navigate('/league')}>목록</Button>
				</Div>
			</FixedFooter>
		</Div>
	);
};

export default LeagueInfoPage;