import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, FixedFooter, Button, vars } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../features/visualizer/components/VisualizerList';

interface LeagueInfoPageProps {
	id: string;
	leagueIdInput: string;
	selectedYear: number;
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const LeagueInfoPage: React.FC<LeagueInfoPageProps> = ({
	id, leagueIdInput, selectedYear, activeTools, setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions
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

			<Div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<VisualizerList 
					tools={activeTools} 
					data={vizData} 
					onToolsSync={setActiveTools}
					toolOptions={toolOptions}
					onAddTool={addTool}
					isToolMenuOpen={isToolMenuOpen}
					setIsToolMenuOpen={setIsToolMenuOpen}
					storageKey="league-visualizer-layout"
				/>
			</Div>

			<FixedFooter style={{ backgroundColor: vars.box, borderTop: `1px solid ${vars.surface}` }}>
				<Div style={{ display: 'flex', gap: '10px', padding: '15px', justifyContent: 'center' }}>
					<Button onClick={() => navigate('/league')}>목록</Button>
				</Div>
			</FixedFooter>
		</Div>
	);
};

export default LeagueInfoPage;