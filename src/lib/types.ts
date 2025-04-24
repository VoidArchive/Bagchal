export type Player = 'GOAT' | 'TIGER';
export type GamePhase = 'PLACEMENT' | 'MOVEMENT';
export type PieceType = Player | null;

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

export interface GameState {
	board: PieceType[];
	turn: Player;
	phase: GamePhase;
	goatsPlaced: number;
	goatsCaptured: number;
	winner: Player | null;
	selectedPieceId: number | null;
	validMoves: number[];
	message: string;
}

export interface CaptureInfo {
	destinationId: number;
	jumpedGoatId: number;
}
