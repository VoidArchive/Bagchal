<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	// Import state and reset function
	import { gameState, resetGame } from '$lib/gameState.svelte';
	// Import types
	import type { Point, Line } from '$lib/types';
	// Import components and logic
	import Board from '$lib/components/Board.svelte';
	import {
		buildAdjacencyMap,
		calculateValidTigerMoves,
		calculateValidGoatMoves,
		executeTigerMove,
		executeGoatMove
		// getPointCoords // Not needed here anymore if generation is local
	} from '$lib/gameLogic';
	// Import constants
	import {
		SVG_BOARD_SIZE,
		SVG_POINT_OFFSET,
		SVG_POINT_DISTANCE,
		BOARD_DIMENSIONS,
		PLAYER_TYPES,
		GAME_PHASES,
		TOTAL_GOATS,
		BOARD_COLOR,
		FONT_FAMILY, // Needed for status display
		LINE_COLOR
	} from '$lib/constants';

	// --- Static Data Generation ---
	const points: Point[] = [];
	const lines: Line[] = [];

	// Point Generation
	for (let y = 0; y < BOARD_DIMENSIONS; y++) {
		for (let x = 0; x < BOARD_DIMENSIONS; x++) {
			points.push({
				id: y * BOARD_DIMENSIONS + x,
				x: SVG_POINT_OFFSET + x * SVG_POINT_DISTANCE,
				y: SVG_POINT_OFFSET + y * SVG_POINT_DISTANCE
			});
		}
	}
	// Line Generation
	function getCoordsForLines(x: number, y: number): Point | null {
		if (x < 0 || x >= BOARD_DIMENSIONS || y < 0 || y >= BOARD_DIMENSIONS) return null;
		return points[y * BOARD_DIMENSIONS + x];
	}
	for (let y = 0; y < BOARD_DIMENSIONS; y++) {
		for (let x = 0; x < BOARD_DIMENSIONS; x++) {
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
	// --- End Static Data Generation ---

	let adjacencyMap = new Map<number, number[]>();

	onMount(() => {
		// Build adjacency map once the component is mounted
		adjacencyMap = buildAdjacencyMap(lines, points);
	});

	// --- Event Handlers Orchestration ---
	function onPointClick(pointId: number) {
		if (gameState.winner || !adjacencyMap.size) return; // Don't process clicks if game over or map not ready

		if (gameState.turn === PLAYER_TYPES.GOAT) {
			handleGoatTurn(pointId);
		} else if (gameState.turn === PLAYER_TYPES.TIGER) {
			handleTigerTurn(pointId);
		}
	}

	function handleGoatTurn(pointId: number): void {
		if (gameState.phase === GAME_PHASES.PLACEMENT) {
			if (gameState.board[pointId] !== null) return;
			gameState.board[pointId] = PLAYER_TYPES.GOAT;
			gameState.goatsPlaced += 1;
			if (gameState.goatsPlaced >= TOTAL_GOATS) gameState.phase = GAME_PHASES.MOVEMENT;
			gameState.turn = PLAYER_TYPES.TIGER;
			gameState.selectedPieceId = null;
			gameState.validMoves = [];
		} else {
			// Movement Phase
			const clickedPiece = gameState.board[pointId];
			if (gameState.selectedPieceId === null) {
				if (clickedPiece === PLAYER_TYPES.GOAT) {
					gameState.selectedPieceId = pointId;
					gameState.validMoves = calculateValidGoatMoves(pointId, gameState, adjacencyMap);
				}
			} else {
				if (pointId === gameState.selectedPieceId) {
					gameState.selectedPieceId = null;
					gameState.validMoves = [];
				} else if (clickedPiece === PLAYER_TYPES.GOAT) {
					gameState.selectedPieceId = pointId;
					gameState.validMoves = calculateValidGoatMoves(pointId, gameState, adjacencyMap);
				} else if (clickedPiece === null && gameState.validMoves.includes(pointId)) {
					executeGoatMove(gameState.selectedPieceId, pointId, gameState, points, adjacencyMap);
				}
			}
		}
	}

	function handleTigerTurn(pointId: number): void {
		const clickedPiece = gameState.board[pointId];
		if (gameState.selectedPieceId === null) {
			if (clickedPiece === PLAYER_TYPES.TIGER) {
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
			if (pointId === gameState.selectedPieceId) {
				gameState.selectedPieceId = null;
				gameState.validMoves = [];
			} else if (clickedPiece === PLAYER_TYPES.TIGER) {
				gameState.selectedPieceId = pointId;
				const { validDestinationIds } = calculateValidTigerMoves(
					pointId,
					gameState,
					points,
					adjacencyMap
				);
				gameState.validMoves = validDestinationIds;
			} else if (clickedPiece === null && gameState.validMoves.includes(pointId)) {
				executeTigerMove(gameState.selectedPieceId, pointId, gameState, points, adjacencyMap);
			}
		}
	}
	// --- End Event Handlers ---
</script>

<main style="--main-bg:{BOARD_COLOR}; --main-font:{FONT_FAMILY}; --header-color:{LINE_COLOR};">
	<h1>Bagh Chal</h1>

	<Board
		{points}
		{lines}
		boardState={gameState.board}
		selectedPieceId={gameState.selectedPieceId}
		validMoves={gameState.validMoves}
		turn={gameState.turn}
		phase={gameState.phase}
		boardSize={SVG_BOARD_SIZE}
		{onPointClick}
	/>

	<div class="status">
		<p>Turn: <strong>{gameState.turn}</strong></p>
		<p>Phase: {gameState.phase}</p>
		<p>Goats Placed: {gameState.goatsPlaced} / {TOTAL_GOATS}</p>
		<p>Goats Captured: {gameState.goatsCaptured}</p>
		{#if gameState.winner}
			<p class="winner">{gameState.winner} Wins!</p>
			<button onclick={resetGame} style="margin-top: 15px;">Play Again?</button>
		{:else}
			<button onclick={resetGame} style="margin-top: 15px;">Restart Game</button>
		{/if}
	</div>
</main>

<style>
	main {
		text-align: center;
		font-family: var(--main-font);
		background-color: var(--main-bg);
		padding: 1em;
		min-height: 100vh;
		color: #333;
	}

	h1 {
		color: var(--header-color);
		margin-bottom: 1em;
	}
	.status {
		background-color: rgba(225, 225, 225, 0.8);
		border-radius: 5px;
		margin-top: 20px;
		box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
		color: #333;
		padding: 10px;
		border: 1px solid #ccc;
		display: inline-block;
		min-width: 150px; /* Ensure some width */
		vertical-align: top; /* Align with board if needed */
	}
	.status p {
		margin: 4px 0;
	}
	.winner {
		font-size: 1.5rem;
		color: green;
		font-weight: bold;
		margin-bottom: 10px;
	}
	button {
		padding: 8px 15px;
		font-size: 1rem;
		cursor: pointer;
		border: 1px solid #888;
		border-radius: 4px;
		background-color: #f0f0f0;
		color: #333;
		margin: 5px;
	}
	button:hover {
		background-color: #e0e0e0;
	}
</style>
