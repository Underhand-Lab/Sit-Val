import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Button, FixedFooter, BottomSheet } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput';
import Popup from '@shared/components/Modal';
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
	activeTools: Array<{ id: string, name: string, Component: React.ComponentType<any> }>;
	onRemoveTool: (id: string) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { name: string, Component: React.ComponentType<any> }) => void;
	toolOptions: Array<{ name: string, Component: React.ComponentType<any> }>;
}

const LeagueEditPage: React.FC<LeagueEditPageProps> = ({
	id, leagueIdInput, setLeagueIdInput, selectedYear, setSelectedYear,
	leagueBatterStats, setLeagueBatterStats, leagueRunnerStats, setLeagueRunnerStats,
	handleSave, isMetaValid, activeTools, vizData, isToolMenuOpen, setIsToolMenuOpen, 
	addTool, toolOptions, onRemoveTool
}) => {
	const navigate = useNavigate();
	const batterRef = useRef<BatterInputHandle>(null);
	const runnerRef = useRef<RunnerInputHandle>(null);

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

			<VisualizerList 
				tools={activeTools} 
				data={vizData} 
				onRemove={onRemoveTool} 
				toolOptions={toolOptions}
				onAddTool={addTool}
			/>

			<BottomSheet isOpen={isBatterOpen} onClose={() => setIsBatterOpen(false)} title="타격 설정">
				<BatterInput ref={batterRef} initialStats={leagueBatterStats} onDataChange={setLeagueBatterStats} />
			</BottomSheet>
			<BottomSheet isOpen={isRunnerOpen} onClose={() => setIsRunnerOpen(false)} title="주자 설정">
				<RunnerInput ref={runnerRef} initialStats={leagueRunnerStats} onDataChange={setLeagueRunnerStats} />
			</BottomSheet>
			<BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`리그 정보 설정`}>
				<Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<Div>
						<label style={{ display: 'block', marginBottom: '5px' }}>리그 명칭 (League ID)</label>
						<input type="text" value={leagueIdInput} onChange={(e) => setLeagueIdInput(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
					</Div>
					<Div>
						<label style={{ display: 'block', marginBottom: '5px' }}>연도 (Year)</label>
						<input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
					</Div>
					<Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '15px', width: '100%', backgroundColor: isMetaValid ? undefined : '#ccc', cursor: isMetaValid ? 'pointer' : 'not-allowed' }}>확인</Button>
				</Div>
			</BottomSheet>

			<FixedFooter>
				<Div style={{ display: 'flex', gap: '10px', padding: '10px', justifyContent: 'center' }}>
					<Button onClick={() => setIsMetaOpen(true)}>정보 설정</Button>
					<Button onClick={() => setIsBatterOpen(true)}>타격</Button>
					<Button onClick={() => setIsRunnerOpen(true)}>주자</Button>
				</Div>
			</FixedFooter>
		</Div>
	);
};

export default LeagueEditPage;