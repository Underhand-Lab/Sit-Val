import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Button, FixedFooter, BottomSheet, vars, InputNumber } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import BatterInput from '@sit-val/components/BatterInput';
import RunnerInput from '@sit-val/components/RunnerInput';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';

interface LeagueEditPageProps {
	id: string;
	leagueIdInput: string;
	setLeagueIdInput: (val: string) => void;
	selectedYear: number;
	setSelectedYear: (val: number) => void;
	leagueBatterStats: BatterStatsData;
	setLeagueBatterStats: (val: BatterStatsData) => void;
	leagueRunnerStats: RunnerStats;
	setLeagueRunnerStats: (val: RunnerStats) => void;
	handleSave: () => void;
	isMetaValid: boolean;
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const LeagueEditPage: React.FC<LeagueEditPageProps> = ({
	id, leagueIdInput, setLeagueIdInput, selectedYear, setSelectedYear,
	leagueBatterStats, setLeagueBatterStats, leagueRunnerStats, setLeagueRunnerStats,
	handleSave, isMetaValid, activeTools, setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, 
	addTool, toolOptions
}) => {
	const navigate = useNavigate();

	const [isBatterOpen, setIsBatterOpen] = useState(false);
	const [isRunnerOpen, setIsRunnerOpen] = useState(false);
	const [isMetaOpen, setIsMetaOpen] = useState(false);

	return (
		<Div id="wrapper">
			<PageHeader
				title={`${leagueIdInput} (${selectedYear})`}
				subTitle={id}
				isEditMode={true}
				onEditToggle={() => navigate(-1)}
				onSave={handleSave}
				showSave={true}
				isSaveDisabled={!isMetaValid}
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

			<BottomSheet isOpen={isBatterOpen} onClose={() => setIsBatterOpen(false)} title="타격 설정">
				<BatterInput initialStats={leagueBatterStats} onDataChange={setLeagueBatterStats} />
				<Button onClick={() => setIsBatterOpen(false)} style={{ width: '100%', marginTop: '10px' }}>확인</Button>
			</BottomSheet>
			<BottomSheet isOpen={isRunnerOpen} onClose={() => setIsRunnerOpen(false)} title="주자 설정">
				<RunnerInput initialStats={leagueRunnerStats} onDataChange={setLeagueRunnerStats} />
				<Button onClick={() => setIsRunnerOpen(false)} style={{ width: '100%', marginTop: '10px' }}>확인</Button>
			</BottomSheet>
			<BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`리그 정보 설정`}>
				<Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
						<label style={{ display: 'block', marginBottom: '5px', minWidth: '100px' }}>리그 명칭</label>
						<InputNumber type="text" value={leagueIdInput} onChange={(e) => setLeagueIdInput(e.target.value)} />
					</Div>
					<Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
						<label style={{ display: 'block', marginBottom: '5px', minWidth: '100px' }}>연도 (Year)</label>
						<InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
					</Div>
					<Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '15px', width: '100%', backgroundColor: isMetaValid ? undefined : '#ccc', cursor: isMetaValid ? 'pointer' : 'not-allowed' }}>확인</Button>
				</Div>
			</BottomSheet>

			<FixedFooter style={{ backgroundColor: vars.box, borderTop: `1px solid ${vars.surface}` }}>
				<Div style={{ display: 'flex', gap: '10px', padding: '15px', justifyContent: 'center' }}>
					<Button onClick={() => setIsMetaOpen(true)}>정보 설정</Button>
					<Button onClick={() => setIsBatterOpen(true)}>타격</Button>
					<Button onClick={() => setIsRunnerOpen(true)}>주자</Button>
				</Div>
			</FixedFooter>
		</Div>
	);
};

export default LeagueEditPage;