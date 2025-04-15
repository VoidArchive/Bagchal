<script lang="ts">
	import { onMount } from 'svelte';
	import type { Point, Line, PieceType, Player, GamePhase, GameState } from '$lib/types';
	import Board from '$lib/components/Board.svelte';
	import {
		buildAdjacencyMap,
		getAdjacentPoints, // Keep if needed directly here, maybe not
		calculateValidTigerMoves,
		calculateValidGoatMoves,
		executeTigerMove,
		executeGoatMove,
		getPointCoords // Keep point generation here for now
	} from '$lib/gameLogic';

	// --- Constants and Static Data Generation ---
	const boardSize: number = 500;
	const points: Point[] = [];
	const lines: Line[] = [];

	// Point Generation
	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 5; x++) {
			points.push({ id: y * 5 + x, x: 50 + x * 100, y: 50 + y * 100 });
		}
	}
	// Line Generation (using getPointCoords defined within this script for now)
	function getCoordsForLines(x: number, y: number): Point | null {
		// Local version for init
		if (x < 0 || x > 4 || y < 0 || y > 4) return null;
		return points[y * 5 + x];
	}
	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 5; x++) {
			const start = getCoordsForLines(x, y);
			if (!start) continue;
			const right = getCoordsForLines(x + 1, y);
			if (right) lines.push({ x1: start.x, y1: start.y, x2: right.x, y2: right.y });
			const down = getCoordsForLines(x, y + 1);
			if (down) lines.push({ x1: start.x, y1: start.y, x2: down.x, y2: down.y });
			const diag1 = getCoordsForLines(x + 1, y + 1);
			if (diag1 && (x + y) % 2 === 0)
				lines.push({ x1: start.x, y1: start.y, x2: diag1.x, y2: diag1.y });
			const diag2 = getCoordsForLines(x - 1, y + 1);
			if (diag2 && (x + y) % 2 === 0)
				lines.push({ x1: start.x, y1: start.y, x2: diag2.x, y2: diag2.y });
		}
	}
	// --- End Constants and Data Generation ---

	// --- Adjacency Map (will be built in onMount) ---
	// Use a regular Map now, as it's built once and passed around.
	// No need for $state unless the map itself needed to be reactive to changes.
	let adjacencyMap = new Map<number, number[]>();

	// --- Game State ---
	const initialBoard: PieceType[] = Array(25).fill(null);
	initialBoard[0] = 'TIGER';
	initialBoard[4] = 'TIGER';
	initialBoard[20] = 'TIGER';
	initialBoard[24] = 'TIGER';

	let gameState = $state<GameState>({
		board: [...initialBoard], // Use spread to avoid modifying initialBoard later if resetting
		turn: 'GOAT',
		phase: 'PLACEMENT',
		goatsPlaced: 0,
		goatsCaptured: 0,
		winner: null,
		selectedPieceId: null,
		validMoves: []
	});
	// --- End Game State ---

	// --- Lifecycle ---
	onMount(() => {
		// Build adjacency map once the component is mounted
		adjacencyMap = buildAdjacencyMap(lines, points);
	});

	// --- Event Handlers Orchestration ---
	function onPointClick(pointId: number) {
		console.log(`Page received click for point: ${pointId}`);
		if (gameState.winner) return;

		if (gameState.turn === 'GOAT') {
			handleGoatTurn(pointId);
		} else if (gameState.turn === 'TIGER') {
			handleTigerTurn(pointId);
		}
	}

	function handleGoatTurn(pointId: number): void {
		if (gameState.phase === 'PLACEMENT') {
			if (gameState.board[pointId] !== null) return;
			// Direct state mutation is fine because it's $state
			gameState.board[pointId] = 'GOAT';
			gameState.goatsPlaced += 1;
			if (gameState.goatsPlaced >= 20) gameState.phase = 'MOVEMENT';
			gameState.turn = 'TIGER';
			gameState.selectedPieceId = null;
			gameState.validMoves = [];
		} else {
			// Movement
			const clickedPiece = gameState.board[pointId];
			if (gameState.selectedPieceId === null) {
				// Selecting a goat
				if (clickedPiece === 'GOAT') {
					gameState.selectedPieceId = pointId;
					gameState.validMoves = calculateValidGoatMoves(pointId, gameState, adjacencyMap);
				}
			} else {
				// Goat selected, attempting move or deselect
				if (pointId === gameState.selectedPieceId) {
					// Deselect
					gameState.selectedPieceId = null;
					gameState.validMoves = [];
				} else if (clickedPiece === 'GOAT') {
					// Select other goat
					gameState.selectedPieceId = pointId;
					gameState.validMoves = calculateValidGoatMoves(pointId, gameState, adjacencyMap);
				} else if (clickedPiece === null && gameState.validMoves.includes(pointId)) {
					// Execute move
					executeGoatMove(gameState.selectedPieceId, pointId, gameState, points, adjacencyMap);
				}
			}
		}
	}

	function handleTigerTurn(pointId: number): void {
		const clickedPiece = gameState.board[pointId];
		if (gameState.selectedPieceId === null) {
			// Selecting a tiger
			if (clickedPiece === 'TIGER') {
				gameState.selectedPieceId = pointId;
				const { validDestinationIds } = calculateValidTigerMoves(
					pointId,
					gameState,
					points,
					adjacencyMap
				);
				gameState.validMoves = validDestinationIds;
			}
		} else {
			// Tiger selected, attempting move/deselect
			if (pointId === gameState.selectedPieceId) {
				// Deselect
				gameState.selectedPieceId = null;
				gameState.validMoves = [];
			} else if (clickedPiece === 'TIGER') {
				// Select other tiger
				gameState.selectedPieceId = pointId;
				const { validDestinationIds } = calculateValidTigerMoves(
					pointId,
					gameState,
					points,
					adjacencyMap
				);
				gameState.validMoves = validDestinationIds;
			} else if (clickedPiece === null && gameState.validMoves.includes(pointId)) {
				// Execute move
				executeTigerMove(gameState.selectedPieceId, pointId, gameState, points, adjacencyMap);
			}
		}
	}
	// --- End Event Handlers ---

	// --- Reset Function ---
	function resetGame() {
		console.log('Resetting game...');
		// Use $state setters for deep reactivity if needed, but direct assignment works for top-level reset
		gameState.board = [...initialBoard]; // Reset board
		gameState.turn = 'GOAT';
		gameState.phase = 'PLACEMENT';
		gameState.goatsPlaced = 0;
		gameState.goatsCaptured = 0;
		gameState.winner = null;
		gameState.selectedPieceId = null;
		gameState.validMoves = [];
	}
</script>

<main>
	<h1>Bagh Chal</h1>

	<Board
		{points}
		{lines}
		boardState={gameState.board}
		selectedPieceId={gameState.selectedPieceId}
		validMoves={gameState.validMoves}
		turn={gameState.turn}
		phase={gameState.phase}
		{boardSize}
		{onPointClick}
	/>

	<div class="status">
		<p>Turn: <strong>{gameState.turn}</strong></p>
		<p>Phase: {gameState.phase}</p>
		<p>Goats Placed: {gameState.goatsPlaced} / 20</p>
		<p>Goats Captured: {gameState.goatsCaptured}</p>
		{#if gameState.winner}
			<p class="winner">{gameState.winner} Wins!</p>
		{:else}
			<!-- Add Restart Button -->
			<button onclick={resetGame} style="margin-top: 15px;">Restart Game</button>
		{/if}
		{#if gameState.winner}
			<!-- Also show Restart Button when game is over -->
			<button onclick={resetGame} style="margin-top: 15px;">Play Again?</button>
		{/if}
	</div>
</main>

<style>
	main {
		text-align: center;
		font-family: sans-serif;
	}
	.status {
		margin-top: 20px;
		padding: 10px;
		border: 1px solid #ccc;
		display: inline-block;
	}
	.winner {
		font-size: 1.5rem;
		color: green;
		font-weight: bold;
	}
	button {
		padding: 8px 15px;
		font-size: 1rem;
		cursor: pointer;
	}
</style>
