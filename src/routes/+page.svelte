<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameState, Point, Line, PieceType, CaptureInfo } from '$lib/types';
	import {
		buildAdjacencyMap,
		calculateValidGoatMoves,
		calculateValidTigerMoves,
		generateLines,
		generatePoints,
		makeInitialBoard,
		checkIfTigersAreTrapped,
		executeMove,
		resetGame
	} from '$lib/game';
	import Board from '$lib/components/Board.svelte';

	const points: Point[] = generatePoints();
	const lines: Line[] = generateLines(points);
	const adjacency = buildAdjacencyMap(points, lines);

	const initialBoard: PieceType[] = makeInitialBoard();

	let gameState = $state<GameState>({
		board: initialBoard,
		turn: 'GOAT',
		phase: 'PLACEMENT',
		goatsPlaced: 0,
		goatsCaptured: 0,
		winner: null,
		selectedPieceId: null,
		validMoves: [],
		message: ''
	});

	onMount(() => resetGame(gameState, points));

	// 1. Intermediate derived value for tiger move calculation result
	let derivedTigerMoveResult = $derived.by(() => {
		const sel = gameState.selectedPieceId;
		// Only calculate if it's Tiger's turn and a piece is selected
		if (gameState.turn === 'TIGER' && sel !== null) {
			return calculateValidTigerMoves(gameState, sel, adjacency, points);
		}
		// Return a default structure if not applicable
		return { destinations: [] as number[], captures: [] as CaptureInfo[] };
	});

	// 2. Derive valid move *destinations* (for highlighting)
	let validMoves = $derived.by(() => {
		const sel = gameState.selectedPieceId;
		if (sel === null) {
			return []; // No selection, no valid moves
		}

		if (gameState.turn === 'GOAT') {
			// Calculate goat moves directly
			return calculateValidGoatMoves(gameState, sel, adjacency);
		} else {
			// Tiger's turn
			// Use the intermediate derived result
			return derivedTigerMoveResult.destinations;
		}
	});

	// 3. Derive the current *capture info* separately
	let currentTigerCaptures = $derived.by(() => {
		// Only relevant during Tiger's turn when a piece is selected
		if (gameState.turn === 'TIGER' && gameState.selectedPieceId !== null) {
			// Use the intermediate derived result
			return derivedTigerMoveResult.captures;
		}
		return []; // Return empty array otherwise
	});

	// --- FIX ENDS HERE ---

	function handlePointClick(id: number) {
		console.log(
			`Click on ID: ${id}, Current Turn: ${gameState.turn}, Phase: ${gameState.phase}, Selected: ${gameState.selectedPieceId}`
		);

		if (gameState.winner) {
			console.log('Game already won, ignoring click.');
			return;
		}

		const pieceAtClickId = gameState.board[id];
		const currentlySelectedId = gameState.selectedPieceId;

		// --- GOAT'S TURN ---
		if (gameState.turn === 'GOAT') {
			// --- PLACEMENT PHASE ---
			if (gameState.phase === 'PLACEMENT') {
				if (pieceAtClickId === null) {
					// Clicked valid empty spot
					// 1. Place the goat
					gameState.board[id] = 'GOAT';
					gameState.goatsPlaced++;
					console.log(`Goat placed at ${id}. Total placed: ${gameState.goatsPlaced}`);

					// 2. Check for Goat Win by Trapping (immediately after placing)
					//    No need to wait for 20, a trap could happen earlier theoretically
					console.log('Checking for trap after placement...');
					if (checkIfTigersAreTrapped(gameState, adjacency, points)) {
						console.log('Goats Win! Tigers detected as trapped after placement.');
						gameState.winner = 'GOAT';
						// Do not proceed to phase change or turn switch if win occurred
					}

					// 3. Change phase if 20 goats are placed AND no winner yet
					if (!gameState.winner && gameState.goatsPlaced >= 20) {
						gameState.phase = 'MOVEMENT';
						console.log('Goat phase changed to MOVEMENT.');
					}

					// 4. Switch turn ONLY if no winner was determined by the trap check
					if (!gameState.winner) {
						console.log('Switching turn to TIGER.');
						gameState.turn = 'TIGER';
					} else {
						console.log(`Winner (${gameState.winner}) found during placement, not switching turn.`);
					}

					// 5. Reset selection
					gameState.selectedPieceId = null;
				}
				// Ignore clicks on existing pieces during placement
				return; // End goat placement turn processing
			}
			// --- MOVEMENT PHASE ---
			else {
				// MOVEMENT phase
				if (pieceAtClickId === 'GOAT') {
					// Selecting a goat
					gameState.selectedPieceId = id;
				} else if (
					pieceAtClickId === null &&
					currentlySelectedId !== null &&
					validMoves.includes(id)
				) {
					// Moving a goat
					// Pass adjacency and points - executeMove checks for trap win after move
					executeMove(gameState, currentlySelectedId, id, null, adjacency, points);
				} else {
					// Invalid click
					gameState.selectedPieceId = null; // Deselect
				}
				return; // End goat movement processing
			}
		}

		// --- TIGER'S TURN --- (Logic from previous correct version)
		if (gameState.turn === 'TIGER') {
			if (pieceAtClickId === 'TIGER') {
				// Selecting a tiger
				gameState.selectedPieceId = id;
			} else if (
				pieceAtClickId === null &&
				currentlySelectedId !== null &&
				validMoves.includes(id)
			) {
				// Moving/Capturing
				const captureInfo = currentTigerCaptures.find((c) => c.destinationId === id);
				const jumpedGoatId = captureInfo ? captureInfo.jumpedGoatId : null;
				// Pass adjacency and points - executeMove checks for tiger capture win
				executeMove(gameState, currentlySelectedId, id, jumpedGoatId, adjacency, points);
			} else {
				// Invalid click
				if (currentlySelectedId !== null) {
					gameState.selectedPieceId = null; // Deselect
				}
			}
			return; // End tiger turn processing
		}
	}

	function handleReset() {
		resetGame(gameState, points);
	}
</script>

<main
	class="flex min-h-screen flex-col items-center bg-gradient-to-br from-green-200 via-green-100 to-yellow-50 py-12"
>
	<h1 class="text-emereld-800 mb-8 text-5xl font-extrabold">Bagchal</h1>

	<div class="relative rounded-3xl bg-white p-6 shadow-2xl">
		<Board {lines} {points} {gameState} {validMoves} {handlePointClick} />
	</div>

	<div class="mt-6 flex space-x-6 text-lg text-gray-700">
		<div><span class="font-semibold">Turn:</span> {gameState.turn}</div>
		<div><span class="font-semibold">Phase:</span> {gameState.phase}</div>
		<div><span class="font-semibold">Placed:</span> {gameState.goatsPlaced}/20</div>
		<div><span class="font-semibold">Captured:</span> {gameState.goatsCaptured}</div>
	</div>

	<button
		onclick={handleReset}
		class="mt-6 rounded-full bg-emerald-600 px-6 py-2 text-white transition hover:bg-emerald-700"
	>
		New Game
	</button>

	{#if gameState.winner}
		<div class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
			<div class="mx-auto max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl">
				<h2 class="mb-4 text-4xl font-bold text-green-600">🎉 {gameState.winner} Wins!</h2>
				<button
					onclick={handleReset}
					class="mt-4 rounded-lg bg-indigo-600 px-8 py-3 text-white transition hover:bg-indigo-700"
				>
					Play Again
				</button>
			</div>
		</div>
	{/if}
</main>
