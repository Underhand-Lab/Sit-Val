import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, Button, InputNumber } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import BatterInput from '@sit-val/components/BatterInput';
import RunnerInput from '@sit-val/components/RunnerInput';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { VisualizerList } from '../../features/visualizer/components/VisualizerList';

interface LeagueInfoPageProps {
	id: string;
	leagueIdInput: string;
	setLeagueIdInput: (val: string) => void;
	selectedYear: number;
	setSelectedYear: (val: number) => void;
	leagueBatterStats: BatterStatsData;
	setLeagueBatterStats: (val: BatterStatsData) => void;
	leagueRunnerStats: RunnerStats;
	setLeagueRunnerStats: (val: RunnerStats) => void;
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	handleSave: () => Promise<string | null>;
	isMetaValid: boolean;
	startInEditMode?: boolean;
}

const LeagueInfoPage: React.FC<LeagueInfoPageProps> = ({
	id, leagueIdInput, setLeagueIdInput, selectedYear, setSelectedYear,
	leagueBatterStats, setLeagueBatterStats, leagueRunnerStats, setLeagueRunnerStats,
	activeTools, setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions,
	handleSave, isMetaValid, startInEditMode = false
}) => {
	const navigate = useNavigate();
	const handleEditorSave = React.useCallback(async () => {
		try {
			const savedId = await handleSave();
			if (savedId) {
				navigate(`/league/${savedId}`);
			}
		} catch (error) {
			alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
		}
	}, [handleSave, navigate]);

	const editorToolOptions = React.useMemo(() => {
		const LeagueMetaEditor: React.FC = () => (
			<Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<Div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
						<label style={{ minWidth: '72px' }}>리그 명칭</label>
						<InputNumber type="text" value={leagueIdInput} onChange={(e) => setLeagueIdInput(e.target.value)} />
					</Div>
					<Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
						<label style={{ minWidth: '72px' }}>연도</label>
						<InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
					</Div>
				</Div>
				<Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button onClick={handleEditorSave} disabled={!isMetaValid}>저장</Button>
				</Div>
			</Div>
		);

		const LeagueBatterEditor: React.FC = () => (
			<Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<BatterInput initialStats={leagueBatterStats} onDataChange={setLeagueBatterStats} />
				<Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button onClick={handleEditorSave} disabled={!isMetaValid}>저장</Button>
				</Div>
			</Div>
		);

		const LeagueRunnerEditor: React.FC = () => (
			<Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<RunnerInput initialStats={leagueRunnerStats} onDataChange={setLeagueRunnerStats} />
				<Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button onClick={handleEditorSave} disabled={!isMetaValid}>저장</Button>
				</Div>
			</Div>
		);

		return [
			{ type: 'league-meta-editor', name: '기본 정보 편집', Component: LeagueMetaEditor },
			{ type: 'league-batter-editor', name: '타격 능력 편집', Component: LeagueBatterEditor },
			{ type: 'league-runner-editor', name: '주루 능력 편집', Component: LeagueRunnerEditor },
		];
	}, [handleEditorSave, isMetaValid, leagueBatterStats, leagueIdInput, leagueRunnerStats, selectedYear, setLeagueBatterStats, setLeagueIdInput, setLeagueRunnerStats, setSelectedYear]);

	const allToolOptions = React.useMemo(
		() => [...toolOptions, ...editorToolOptions],
		[editorToolOptions, toolOptions]
	);

	React.useEffect(() => {
		if (!startInEditMode) return;
		if (activeTools.some((tool) => tool.type.startsWith('league-') && tool.type.endsWith('-editor'))) return;
		setActiveTools([...activeTools, ...editorToolOptions]);
	}, [activeTools, editorToolOptions, setActiveTools, startInEditMode]);

	React.useEffect(() => {
		setActiveTools((prev: any[]) =>
			prev.map((tool) => {
				const latestOption = editorToolOptions.find((option) => option.type === tool.type);
				return latestOption ? { ...tool, ...latestOption } : tool;
			})
		);
	}, [editorToolOptions, setActiveTools]);

	return (
		<Div id="wrapper">
			<PageHeader
				title={`${leagueIdInput} (${selectedYear})`}
				subTitle={id}
			/>

			<Div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<VisualizerList 
					tools={activeTools} 
					data={vizData} 
					onToolsSync={setActiveTools}
					toolOptions={allToolOptions}
					onAddTool={addTool}
					isToolMenuOpen={isToolMenuOpen}
					setIsToolMenuOpen={setIsToolMenuOpen}
					storageKey="league-visualizer-layout"
				/>
			</Div>
		</Div>
	);
};

export default LeagueInfoPage;
