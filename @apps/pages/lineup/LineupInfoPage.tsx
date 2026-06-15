import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Box, FixedFooter, Button } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../features/visualizer/components/VisualizerList';
import Popup from '@shared/components/Modal';

interface LineupInfoPageProps {
	id: string;
	lineupName: string;
	selectedYear: number;
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const LineupInfoPage: React.FC<LineupInfoPageProps> = ({
	id, lineupName, selectedYear, activeTools, setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions
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
			<VisualizerList 
				tools={activeTools} 
				data={vizData} 
				onToolsSync={setActiveTools}
				toolOptions={toolOptions}
				onAddTool={addTool}
				isToolMenuOpen={isToolMenuOpen}
				setIsToolMenuOpen={setIsToolMenuOpen}
				storageKey="lineup-visualizer-layout"
			/>
			<FixedFooter>
				<Box className="container">
					<Div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
						<Button onClick={() => navigate('/lineup')}>목록</Button>
					</Div>
				</Box>
			</FixedFooter>
		</Div>
	);
};
export default LineupInfoPage;