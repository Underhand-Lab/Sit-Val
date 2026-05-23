import { RunnerStats } from '../../types/RunnerStats';

export interface GameState {
    out: number;
    b1: number;
    b2: number;
    b3: number;
}

export interface Transition {
    prob: number;
    outDelta: number;
    bases: [number, number, number]; // [1루, 2루, 3루]
    runs: number;
    isPB?: boolean; // V4 폭투 처리를 위한 임시 플래그
}

export type ActionType = 'bb' | 'so' | 'fo' | 'go' | '1B' | '2B' | '3B' | 'hr';

export interface ITransitionEngine {
    getTransitions(action: ActionType, state: GameState, r: RunnerStats): Transition[];
}