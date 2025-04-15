<script lang="ts">
	// Type definitions
	interface Point {
		id: number;
		x: number;
		y: number;
	}

	interface Line {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}

	type Player = 'GOAT' | 'TIGER';
	type GamePhase = 'PLACEMENT' | 'MOVEMENT';
	type PieceType = Player | null;

	interface GameState {
		board: PieceType[];
		turn: Player;
		phase: GamePhase;
		goatsPlaced: number;
		goatsCaptured: number;
		winner: Player | null;
		selectedPieceID: number | null;
		validMoves: number[];
	}

	const boardSize: number = 500;
	const points: Point[] = [];
	const lines: Line[] = [];

	//  Point and Line Generation
	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 5; x++) {
			points.push({
				id: y * 5 + x,
				x: 50 + x * 100,
				y: 50 + y * 100
			});
		}
	}

	function getPointCoords(x: number, y: number): Point | null {
		if (x < 0 || x > 4 || y < 0 || y > 4) return null;
		return points[y * 5 + x];
	}

	for (let y = 0; y < 5; y++) {
		for (let x = 0; x < 5; x++) {
			const start = getPointCoords(x, y);
			if (!start) continue;

			// Horizontal Lines
			const right = getPointCoords(x + 1, y);
			if (right) lines.push({ x1: start.x, y1: start.y, x2: right.x, y2: right.y });

			// Vertical connections
			const down = getPointCoords(x, y + 1);
			if (down) lines.push({ x1: start.x, y1: start.y, x2: down.x, y2: down.y });

			// Diagonal connections
			const diag1 = getPointCoords(x + 1, y + 1);
			if (diag1 && (x + y) % 2 === 0) {
				lines.push({ x1: start.x, y1: start.y, x2: diag1.x, y2: diag1.y });
			}

			const diag2 = getPointCoords(x - 1, y + 1);
			if (diag2 && (x + y) % 2 === 0) {
				lines.push({ x1: start.x, y1: start.y, x2: diag2.x, y2: diag2.y });
			}
		}
	}

	const initialBoard: PieceType[] = Array(25).fill(null);
	initialBoard[0] = 'TIGER';
	initialBoard[4] = 'TIGER';
	initialBoard[20] = 'TIGER';
	initialBoard[24] = 'TIGER';

	let gameState = $state<GameState>({
		board: initialBoard,
		turn: 'GOAT',
		phase: 'PLACEMENT',
		goatsPlaced: 0,
		goatsCaptured: 0,
		winner: null,
		selectedPieceID: null,
		validMoves: []
	});
</script>

<main>
	<h1>Baghchal</h1>

	<svg
		width="80%"
		viewBox="0 0 {boardSize} {boardSize}"
		style="border: 1px solid black; max-width:600px; display:block; margin:auto;"
	>
		<!-- Board background -->
		<rect width="100%" height="100%" fill="#eee" />
		<!-- line will go here -->
		{#each lines as line, i (i)}
			<line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="gray" stroke-width="2" />
		{/each}

		<!-- Points -->
		{#each points as point (point.id)}
			{@const piece = gameState.board[point.id]}
			{#if piece === 'TIGER'}
				<circle
					cx={point.x}
					cy={point.y}
					r="15"
					fill="darkorange"
					stroke="black"
					stroke-width="2"
				/>
			{:else if piece === 'GOAT'}
				<circle
					cx={point.x}
					cy={point.y}
					r="12"
					fill="dodgerblue"
					stroke="black"
					stroke-width="2"
				/>
			{:else}
				<circle cx={point.x} cy={point.y} r="8" fill="white" stroke="darkgray" stroke-width="1" />
			{/if}
		{/each}
	</svg>

	<div class="status">
		<p>Turn: <strong>{gameState.turn}</strong></p>
		<p>Phase: {gameState.phase}</p>
		<p>Goats Placed: {gameState.goatsPlaced} / 20</p>
		<p>Goats Captured: {gameState.goatsCaptured}</p>
		{#if gameState.winner}
			<p class="winner">{gameState.winner} Wins!</p>
		{/if}
	</div>
</main>

<style>
	main {
		text-align: center;
		font-family: sans-serif;
	}
</style>
