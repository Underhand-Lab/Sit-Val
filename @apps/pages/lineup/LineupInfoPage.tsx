import React from 'react';
import { Div } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../features/visualizer/components/VisualizerList';
import { LineupPlayerDisplay } from '../hooks/useLineupPageModel';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { LineupInlineEditor } from './LineupInlineEditor';

interface LineupInfoPageProps {
	id: string;
	lineupName: string;
	setLineupName: (val: string) => void;
	selectedYear: number;
	setSelectedYear: (val: number) => void;
	availablePlayers: LineupPlayerDisplay[];
	setAvailablePlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
	currentLineupPlayers: LineupPlayerDisplay[];
	setCurrentLineupPlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
	lineupOrder: string[];
	setLineupOrder: React.Dispatch<React.SetStateAction<string[]>>;
	lineupRunnerStats: RunnerStats;
	setLineupRunnerStats: (val: RunnerStats) => void;
	handleInlineSave: () => Promise<void>;
	isMetaValid: boolean;
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	isToolMenuOpen: boolean;
	setIsToolMenuOpen: (val: boolean) => void;
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	startInEditMode?: boolean;
}

const LineupInfoPage: React.FC<LineupInfoPageProps> = ({
	id, lineupName, setLineupName, selectedYear, setSelectedYear,
	availablePlayers, setAvailablePlayers, currentLineupPlayers, setCurrentLineupPlayers,
	lineupOrder, setLineupOrder, lineupRunnerStats, setLineupRunnerStats,
	handleInlineSave, isMetaValid,
	activeTools, setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions,
	startInEditMode = false
}) => {
	const editorToolOptions = React.useMemo(() => {
		const LineupEditor: React.FC = () => (
			<LineupInlineEditor
				section="lineup"
				lineupName={lineupName}
				setLineupName={setLineupName}
				selectedYear={selectedYear}
				setSelectedYear={setSelectedYear}
				availablePlayers={availablePlayers}
				setAvailablePlayers={setAvailablePlayers}
				currentLineupPlayers={currentLineupPlayers}
				setCurrentLineupPlayers={setCurrentLineupPlayers}
				lineupOrder={lineupOrder}
				setLineupOrder={setLineupOrder}
				lineupRunnerStats={lineupRunnerStats}
				setLineupRunnerStats={setLineupRunnerStats}
				handleSave={handleInlineSave}
				isSaveDisabled={!isMetaValid}
			/>
		);

		const PlayerEditor: React.FC = () => (
			<LineupInlineEditor
				section="player"
				lineupName={lineupName}
				setLineupName={setLineupName}
				selectedYear={selectedYear}
				setSelectedYear={setSelectedYear}
				availablePlayers={availablePlayers}
				setAvailablePlayers={setAvailablePlayers}
				currentLineupPlayers={currentLineupPlayers}
				setCurrentLineupPlayers={setCurrentLineupPlayers}
				lineupOrder={lineupOrder}
				setLineupOrder={setLineupOrder}
				lineupRunnerStats={lineupRunnerStats}
				setLineupRunnerStats={setLineupRunnerStats}
				handleSave={handleInlineSave}
				isSaveDisabled={!isMetaValid}
			/>
		);

		const LineupRunnerEditor: React.FC = () => (
			<LineupInlineEditor
				section="runner"
				lineupName={lineupName}
				setLineupName={setLineupName}
				selectedYear={selectedYear}
				setSelectedYear={setSelectedYear}
				availablePlayers={availablePlayers}
				setAvailablePlayers={setAvailablePlayers}
				currentLineupPlayers={currentLineupPlayers}
				setCurrentLineupPlayers={setCurrentLineupPlayers}
				lineupOrder={lineupOrder}
				setLineupOrder={setLineupOrder}
				lineupRunnerStats={lineupRunnerStats}
				setLineupRunnerStats={setLineupRunnerStats}
				handleSave={handleInlineSave}
				isSaveDisabled={!isMetaValid}
			/>
		);

		return [
			{ type: 'lineup-editor', name: '라인업 정보 편집', Component: LineupEditor },
			{ type: 'lineup-player-editor', name: '선수 정보 편집', Component: PlayerEditor },
			{ type: 'lineup-runner-editor', name: '주루 능력 편집', Component: LineupRunnerEditor },
		];
	}, [availablePlayers, currentLineupPlayers, handleInlineSave, isMetaValid, lineupName, lineupOrder, lineupRunnerStats, selectedYear, setAvailablePlayers, setCurrentLineupPlayers, setLineupName, setLineupOrder, setLineupRunnerStats, setSelectedYear]);

	const allToolOptions = React.useMemo(
		() => [...toolOptions, ...editorToolOptions],
		[editorToolOptions, toolOptions]
	);

	React.useEffect(() => {
		if (!startInEditMode) return;
		if (activeTools.some((tool) => ['lineup-editor', 'lineup-player-editor', 'lineup-runner-editor'].includes(tool.type))) return;
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
				title={`${lineupName} (${selectedYear})`}
				subTitle={id}
			/> 
			<VisualizerList 
				tools={activeTools} 
				data={vizData} 
				onToolsSync={setActiveTools}
				toolOptions={allToolOptions}
				onAddTool={addTool}
				isToolMenuOpen={isToolMenuOpen}
				setIsToolMenuOpen={setIsToolMenuOpen}
				storageKey="lineup-visualizer-layout"
			/>
		</Div>
	);
};
export default LineupInfoPage;
