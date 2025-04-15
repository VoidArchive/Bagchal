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

	interface CaptureInfo {
		destinationId: number;
		jumpedGoatId: number;
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

	const adjacencyMap = $state(new Map<number, number[]>());

	function buildAdjacencyMap() {
		adjacencyMap.clear();
		for (const line of lines) {
			const p1 = points.find((p) => p.x === line.x1 && p.y === line.y1);
			const p2 = points.find((p) => p.x === line.x2 && p.y === line.y2);

			if (p1 && p2) {
				const list1 = adjacencyMap.get(p1.id) ?? [];
				const list2 = adjacencyMap.get(p2.id) ?? [];
				if (!list1.includes(p2.id)) list1.push(p2.id);
				if (!list2.includes(p1.id)) list2.push(p1.id);
				adjacencyMap.set(p1.id, list1);
				adjacencyMap.set(p2.id, list2);
			}
		}
		console.log('Adjacency map built: ', adjacencyMap);
	}

	// call this is onmount. for now here to check
	buildAdjacencyMap();

	function getAdjacentPoints(pointId: number): number[] {
		return adjacencyMap.get(pointId) ?? [];
	}

	function calculateValidTigerMoves(tigerId: number) {
		const validDestinationIds: number[] = [];
		const validCaptureInfos: CaptureInfo[] = [];
		gameState.validMoves = [];
		const adjacentIds = getAdjacentPoints(tigerId);
		console.log(`Calculating moves for Tiger ${tigerId}. Adjacent:`, adjacentIds); // Log adjacent points

		for (const adjId of adjacentIds) {
			const pieceAtAdj = gameState.board[adjId];
			console.log(`  Checking adjacent point ${adjId}. Piece: ${pieceAtAdj}`); // Log piece check

			if (pieceAtAdj === null) {
				console.log(`    Found simple move to ${adjId}`);
				validDestinationIds.push(adjId);
			} else if (pieceAtAdj === 'GOAT') {
				console.log(`    --- Potential Capture ---`);
				console.log(`    Tiger at ${tigerId}, Goat at ${adjId}`);
				const startPoint = points[tigerId];
				const goatPoint = points[adjId];

				if (!startPoint || !goatPoint) continue;

				// Find points adjacent to the GOAT
				const pointsAdjacentToGoat = getAdjacentPoints(adjId);
				console.log(`    Points adjacent to Goat ${adjId}:`, pointsAdjacentToGoat);

				for (const potentialDestId of pointsAdjacentToGoat) {
					console.log(`      Checking potential destination ${potentialDestId}`);
					// Skip if the potential destination is the starting point itself
					if (potentialDestId === tigerId) {
						console.log(`        Skipping: Destination is the start point.`);
						continue;
					}

					const destinationPoint = points[potentialDestId];
					if (!destinationPoint) {
						console.log(`        Skipping: Destination point object not found.`); // Should not happen
						continue;
					}

					// Check if destination is empty
					const isDestEmpty = gameState.board[potentialDestId] === null;
					console.log(`        Is destination ${potentialDestId} empty? ${isDestEmpty}`);

					if (isDestEmpty) {
						// Check if the points form a straight line (Tiger -> Goat -> Destination)
						// We can check this by comparing the differences in x and y coordinates
						const dx_tiger_goat = goatPoint.x - startPoint.x;
						const dy_tiger_goat = goatPoint.y - startPoint.y;
						const dx_goat_dest = destinationPoint.x - goatPoint.x;
						const dy_goat_dest = destinationPoint.y - goatPoint.y;

						const isStraightLine = dx_tiger_goat === dx_goat_dest && dy_tiger_goat === dy_goat_dest;
						console.log(
							`        Is straight line (T:${tigerId} -> G:${adjId} -> D:${potentialDestId})? ${isStraightLine}`
						);

						if (isStraightLine) {
							console.log(`        >>> Valid capture found! Destination: ${potentialDestId}`);
							if (!validDestinationIds.includes(potentialDestId)) {
								// Avoid duplicates if multiple paths lead there (unlikely)
								validDestinationIds.push(potentialDestId);
							}
							// Find if already exists before pushing
							const captureExists = validCaptureInfos.some(
								(info) => info.destinationId === potentialDestId && info.jumpedGoatId === adjId
							);
							if (!captureExists) {
								validCaptureInfos.push({ destinationId: potentialDestId, jumpedGoatId: adjId });
							}
						}
					} else {
						console.log(`        Destination ${potentialDestId} is not empty.`);
					}
				}
				console.log(`    -------------------------`);
			}
		}
		gameState.validMoves = validDestinationIds;
		console.log(`Valid moves for tiger ${tigerId}:`, validDestinationIds);
	}

	function calculateValidGoatMoves(goatId: number): void {
		const validDestinationIds: number[] = [];
		gameState.validMoves = [];

		const adjacentIds = getAdjacentPoints(goatId);

		for (const adjId of adjacentIds) {
			if (gameState.board[adjId] === null) {
				validDestinationIds.push(adjId);
			}
		}
		gameState.validMoves = validDestinationIds;
	}

	function executeMove(fromId: number, toId: number): void {
		console.log(`Executing move from ${fromId} to ${toId}`);
		const isCapture = !getAdjacentPoints(fromId).includes(toId); // Simple check: if not adjacent, must be capture

		// Update board
		gameState.board[toId] = 'TIGER';
		gameState.board[fromId] = null;

		if (isCapture) {
			// Find the jumped goat
			const startPoint = points[fromId];
			const endPoint = points[toId];
			const goatX = (startPoint.x + endPoint.x) / 2;
			const goatY = (startPoint.y + endPoint.y) / 2;
			const jumpedGoat = points.find((p) => p.x === goatX && p.y === goatY);

			if (jumpedGoat && gameState.board[jumpedGoat.id] === 'GOAT') {
				gameState.board[jumpedGoat.id] = null; // Remove goat
				gameState.goatsCaptured += 1;
				console.log(`Captured goat at ${jumpedGoat.id}`);

				// --- Check Win Condition ---
				if (gameState.goatsCaptured >= 5) {
					gameState.winner = 'TIGER';
					console.log('TIGERS WIN!');
				}
			} else {
				// This shouldn't happen if calculateValidTigerMoves is correct, but good to log
				console.error('Capture move detected, but no goat found at expected position.');
			}
		}

		gameState.turn = 'GOAT';

		gameState.selectedPieceID = null;
		gameState.validMoves = [];
	}

	function tigerHasAnyValidMoves(tigerId: number): boolean {
		const adjacentIds = getAdjacentPoints(tigerId);

		for (const adjId of adjacentIds) {
			const pieceAtAdj = gameState.board[adjId];

			if (pieceAtAdj === null) {
				// Found a simple move
				return true; // Tiger can move
			} else if (pieceAtAdj === 'GOAT') {
				// Check for capture possibility
				const startPoint = points[tigerId];
				const goatPoint = points[adjId];
				if (!startPoint || !goatPoint) continue;

				const pointsAdjacentToGoat = getAdjacentPoints(adjId);
				for (const potentialDestId of pointsAdjacentToGoat) {
					if (potentialDestId === tigerId) continue;

					const destinationPoint = points[potentialDestId];
					if (!destinationPoint) continue;

					const isDestEmpty = gameState.board[potentialDestId] === null;

					if (isDestEmpty) {
						const dx_tiger_goat = goatPoint.x - startPoint.x;
						const dy_tiger_goat = goatPoint.y - startPoint.y;
						const dx_goat_dest = destinationPoint.x - goatPoint.x;
						const dy_goat_dest = destinationPoint.y - goatPoint.y;
						const isStraightLine = dx_tiger_goat === dx_goat_dest && dy_tiger_goat === dy_goat_dest;

						if (isStraightLine) {
							// Found a capture move
							return true; // Tiger can move
						}
					}
				}
			}
		}
		// If we went through all adjacent points and found no simple moves or captures
		return false; // This tiger is blocked
	}

	function executeGoatMove(fromId: number, toId: number): void {
		if (gameState.board[toId] !== null || gameState.board[fromId] !== 'GOAT') {
			console.error('Invalid state for goat move execution');
			return;
		}

		gameState.board[toId] = 'GOAT';
		gameState.board[fromId] = null;

		let allTigersBlocked = true; // Assume blocked initially
		console.log('Checking if all tigers are now blocked...');
		for (let i = 0; i < gameState.board.length; i++) {
			if (gameState.board[i] === 'TIGER') {
				if (tigerHasAnyValidMoves(i)) {
					// Use the helper function
					console.log(`  Tiger ${i} can still move. Game continues.`);
					allTigersBlocked = false; // Found a tiger that can move
					break; // No need to check other tigers
				} else {
					console.log(`  Tiger ${i} is blocked.`);
				}
			}
		}

		if (allTigersBlocked) {
			gameState.winner = 'GOAT';
			console.log('GOATS WIN! All Tigers are blocked.');
		}
		// --- End Goat Win Condition Check ---

		if (!gameState.winner) {
			gameState.turn = 'TIGER';
		}
		gameState.selectedPieceID = null;
		gameState.validMoves = [];
	}

	function handlePointClick(pointId: number) {
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
			gameState.board[pointId] = 'GOAT';
			gameState.goatsPlaced += 1;

			if (gameState.goatsPlaced >= 20) {
				gameState.phase = 'MOVEMENT';
			}
			gameState.turn = 'TIGER';
			gameState.selectedPieceID = null;
			gameState.validMoves = [];
		} else {
			const clickedPiece = gameState.board[pointId];

			if (gameState.selectedPieceID === null) {
				if (clickedPiece === 'GOAT') {
					gameState.selectedPieceID = pointId;
					// calculate valid goat moves
					calculateValidGoatMoves(pointId);
				}
			} else {
				if (pointId === gameState.selectedPieceID) {
					gameState.selectedPieceID = null;
					gameState.validMoves = [];
				} else if (clickedPiece === 'GOAT') {
					//
					gameState.selectedPieceID = pointId;
					calculateValidGoatMoves(pointId);
				} else if (clickedPiece === null) {
					//attempting to move.
					if (gameState.validMoves.includes(pointId)) {
						executeGoatMove(gameState.selectedPieceID, pointId);
					}
				}
			}
		}
	}

	function handleTigerTurn(pointId: number): void {
		const clickedPiece = gameState.board[pointId];

		if (gameState.selectedPieceID == null) {
			if (clickedPiece === 'TIGER') {
				gameState.selectedPieceID = pointId;
				// TODO: calculate valid move
				calculateValidTigerMoves(pointId);
			}
		} else {
			if (pointId === gameState.selectedPieceID) {
				gameState.selectedPieceID = null;
				gameState.validMoves = [];
				console.log('Deselected Tiger');
			} else if (clickedPiece === 'TIGER') {
				gameState.selectedPieceID = pointId;
				calculateValidTigerMoves(pointId);
			} else {
				console.log(
					`Attempting to move selected tiger (${gameState.selectedPieceID}) to ${pointId}`
				);
				if (clickedPiece === null && gameState.validMoves.includes(pointId)) {
					console.log(`Moving Tiger ${gameState.selectedPieceID} to ${pointId}`);
					executeMove(gameState.selectedPieceID, pointId);
				} else {
					console.log(`Invalid move attempt from ${gameState.selectedPieceID} to ${pointId}`);
				}
			}
		}
	}
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
			{@const isSelected = point.id === gameState.selectedPieceID}
			{@const isValidMove = gameState.validMoves.includes(point.id)}
			{#if piece === 'TIGER'}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<circle
					onclick={() => handlePointClick(point.id)}
					cx={point.x}
					cy={point.y}
					r="15"
					fill="darkorange"
					stroke={isSelected ? 'red' : 'black'}
					stroke-width={isSelected ? 4 : 2}
					class="piece tiger"
				/>
			{:else if piece === 'GOAT'}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<circle
					onclick={() => handlePointClick(point.id)}
					cx={point.x}
					cy={point.y}
					r="12"
					fill="dodgerblue"
					stroke={isSelected && gameState.turn === 'GOAT' ? 'lime' : 'black'}
					stroke-width={isSelected && gameState.turn === 'GOAT' ? 4 : 2}
					class="piece goat"
					style:cursor={gameState.phase === 'MOVEMENT' && gameState.turn === 'GOAT'
						? 'pointer'
						: 'default'}
				/>
			{:else}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<circle
					onclick={() => handlePointClick(point.id)}
					cx={point.x}
					cy={point.y}
					r={isValidMove ? 10 : 8}
					fill={isValidMove ? 'lightcoral' : 'white'}
					stroke="darkgray"
					stroke-width="1"
					class="empty-point"
				/>
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
</style>
