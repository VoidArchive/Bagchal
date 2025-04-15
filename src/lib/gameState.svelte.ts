import type { GameState, PieceType } from './types';
import {
	TOTAL_POINTS,
	TIGER_START_POSITIONS,
	PLAYER_TYPES,
	GAME_PHASES
	// TOTAL_GOATS, // Needed for reset
	// GOAT_CAPTURE_LIMIT // Needed for reset? Not really, but good to import if logic was here
} from './constants';

// Initial setup logic
const getInitialBoard = (): PieceType[] => {
	const board: PieceType[] = Array(TOTAL_POINTS).fill(null);
	TIGER_START_POSITIONS.forEach((id) => (board[id] = PLAYER_TYPES.TIGER));
	return board;
};

export const gameState = $state<GameState>({
	board: getInitialBoard(),
	turn: PLAYER_TYPES.GOAT,
	phase: GAME_PHASES.PLACEMENT,
	goatsPlaced: 0,
	goatsCaptured: 0,
	winner: null,
	selectedPieceId: null,
	validMoves: []
});

export function resetGame() {
	console.log('Resetting game from gameState store...');
	// Re-assign properties of the $state object
	gameState.board = getInitialBoard();
	gameState.turn = PLAYER_TYPES.GOAT;
	gameState.phase = GAME_PHASES.PLACEMENT;
	gameState.goatsPlaced = 0;
	gameState.goatsCaptured = 0;
	gameState.winner = null;
	gameState.selectedPieceId = null;
	gameState.validMoves = [];
}
