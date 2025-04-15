import { PLAYER_TYPES, GAME_PHASES } from './constants';

export interface Point {
	id: number;
	x: number;
	y: number;
}

export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}
// export type Player = 'GOAT' | 'TIGER';
export type Player = (typeof PLAYER_TYPES)[keyof typeof PLAYER_TYPES];
// export type GamePhase = 'PLACEMENT' | 'MOVEMENT';
export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES];

export type PieceType = Player | null;

export interface GameState {
	board: PieceType[];
	turn: Player;
	phase: GamePhase;
	goatsPlaced: number;
	goatsCaptured: number;
	winner: Player | null;
	selectedPieceId: number | null;
	validMoves: number[];
}

export interface CaptureInfo {
	destinationId: number;
	jumpedGoatId: number;
}
