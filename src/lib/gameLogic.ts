// src/lib/gameLogic.ts
import type { GameState, Point, Line, CaptureInfo } from './types';

// --- Point/Coord Helper ---
export function getPointCoords(x: number, y: number, points: Point[]): Point | null {
	if (x < 0 || x > 4 || y < 0 || y > 4) return null;
	const index = y * 5 + x;
	// Add bounds check for safety, although logic should prevent out of bounds
	if (index < 0 || index >= points.length) return null;
	return points[index];
}

// --- Adjacency Logic ---
export function buildAdjacencyMap(lines: Line[], points: Point[]): Map<number, number[]> {
	const map = new Map<number, number[]>();
	for (const line of lines) {
		const p1 = points.find((p) => p.x === line.x1 && p.y === line.y1);
		const p2 = points.find((p) => p.x === line.x2 && p.y === line.y2);
		if (p1 && p2) {
			const list1 = map.get(p1.id) ?? [];
			const list2 = map.get(p2.id) ?? [];
			if (!list1.includes(p2.id)) list1.push(p2.id);
			if (!list2.includes(p1.id)) list2.push(p1.id);
			map.set(p1.id, list1);
			map.set(p2.id, list2);
		}
	}
	console.log('Adjacency map built: ', map);
	return map;
}

// Assuming adjacencyMap is passed or accessible
export function getAdjacentPoints(pointId: number, adjacencyMap: Map<number, number[]>): number[] {
	return adjacencyMap.get(pointId) ?? [];
}

// --- Move Calculation ---
export function calculateValidTigerMoves(
	tigerId: number,
	gameState: GameState, // Pass state
	points: Point[],
	adjacencyMap: Map<number, number[]>
): { validDestinationIds: number[]; validCaptureInfos: CaptureInfo[] } {
	// Return results
	const validDestinationIds: number[] = [];
	const validCaptureInfos: CaptureInfo[] = [];
	const adjacentIds = getAdjacentPoints(tigerId, adjacencyMap);

	for (const adjId of adjacentIds) {
		const pieceAtAdj = gameState.board[adjId];

		if (pieceAtAdj === null) {
			validDestinationIds.push(adjId);
		} else if (pieceAtAdj === 'GOAT') {
			const startPoint = points[tigerId];
			const goatPoint = points[adjId];
			if (!startPoint || !goatPoint) continue;
			const pointsAdjacentToGoat = getAdjacentPoints(adjId, adjacencyMap);
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
						if (!validDestinationIds.includes(potentialDestId)) {
							validDestinationIds.push(potentialDestId);
						}
						const captureExists = validCaptureInfos.some(
							(info) => info.destinationId === potentialDestId && info.jumpedGoatId === adjId
						);
						if (!captureExists) {
							validCaptureInfos.push({ destinationId: potentialDestId, jumpedGoatId: adjId });
						}
					}
				}
			}
		}
	}
	console.log(`Valid moves calculated for tiger ${tigerId}:`, validDestinationIds);
	return { validDestinationIds, validCaptureInfos };
}

export function calculateValidGoatMoves(
	goatId: number,
	gameState: GameState, // Pass state
	adjacencyMap: Map<number, number[]>
): number[] {
	// Return results
	const validDestinationIds: number[] = [];
	const adjacentIds = getAdjacentPoints(goatId, adjacencyMap);
	for (const adjId of adjacentIds) {
		if (gameState.board[adjId] === null) {
			validDestinationIds.push(adjId);
		}
	}
	console.log(`Valid moves calculated for goat ${goatId}:`, validDestinationIds);
	return validDestinationIds;
}

// --- Move Execution ---
// Pass gameState BY REFERENCE to modify it directly
export function executeTigerMove(
	fromId: number,
	toId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]>
): void {
	// Returns void, modifies gameState
	console.log(`Executing tiger move from ${fromId} to ${toId}`);
	const isCapture = !getAdjacentPoints(fromId, adjacencyMap).includes(toId);

	// Update board
	gameState.board[toId] = 'TIGER';
	gameState.board[fromId] = null;

	if (isCapture) {
		const startPoint = points[fromId];
		const endPoint = points[toId];
		if (!startPoint || !endPoint) return;
		const goatX = (startPoint.x + endPoint.x) / 2;
		const goatY = (startPoint.y + endPoint.y) / 2;
		const jumpedGoat = points.find((p) => Math.abs(p.x - goatX) < 1 && Math.abs(p.y - goatY) < 1);

		if (jumpedGoat && gameState.board[jumpedGoat.id] === 'GOAT') {
			gameState.board[jumpedGoat.id] = null;
			gameState.goatsCaptured += 1;
			if (gameState.goatsCaptured >= 5) {
				gameState.winner = 'TIGER';
				console.log('TIGERS WIN!');
			}
		} else {
			console.error(`Capture move executed, failed to find goat at midpoint.`);
		}
	}

	// Finalize turn only if no winner
	if (!gameState.winner) {
		gameState.turn = 'GOAT';
	}
	gameState.selectedPieceId = null;
	gameState.validMoves = [];
}

// Pass gameState BY REFERENCE
export function executeGoatMove(
	fromId: number,
	toId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]> // Pass map
): void {
	// Returns void, modifies gameState
	console.log(`Executing goat move from ${fromId} to ${toId}`);
	if (gameState.board[toId] !== null || gameState.board[fromId] !== 'GOAT') {
		return;
	}
	gameState.board[toId] = 'GOAT';
	gameState.board[fromId] = null;

	// Check Goat Win Condition
	let allTigersBlocked = true;
	for (let i = 0; i < gameState.board.length; i++) {
		if (gameState.board[i] === 'TIGER') {
			// Use the standalone check function, passing necessary info
			if (tigerHasAnyValidMoves(i, gameState, points, adjacencyMap)) {
				allTigersBlocked = false;
				break;
			} else {
				console.log(`Tiger ${i} is blocked`);
			}
		}
	}
	if (allTigersBlocked) {
		gameState.winner = 'GOAT';
		console.log('GOATS WIN!');
	}

	// Finalize turn only if no winner
	if (!gameState.winner) {
		gameState.turn = 'TIGER';
	}
	gameState.selectedPieceId = null;
	gameState.validMoves = [];
}

// --- Win Condition Check Helper ---
// Pass necessary info
export function tigerHasAnyValidMoves(
	tigerId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]>
): boolean {
	const adjacentIds = getAdjacentPoints(tigerId, adjacencyMap);
	for (const adjId of adjacentIds) {
		const pieceAtAdj = gameState.board[adjId];
		if (pieceAtAdj === null) return true;
		if (pieceAtAdj === 'GOAT') {
			const startPoint = points[tigerId];
			const goatPoint = points[adjId];
			if (!startPoint || !goatPoint) continue;
			const pointsAdjacentToGoat = getAdjacentPoints(adjId, adjacencyMap);
			for (const potentialDestId of pointsAdjacentToGoat) {
				if (potentialDestId === tigerId) continue;
				const destinationPoint = points[potentialDestId];
				if (!destinationPoint) continue;
				if (gameState.board[potentialDestId] === null) {
					const dx_tiger_goat = goatPoint.x - startPoint.x;
					const dy_tiger_goat = goatPoint.y - startPoint.y;
					const dx_goat_dest = destinationPoint.x - goatPoint.x;
					const dy_goat_dest = destinationPoint.y - goatPoint.y;
					if (dx_tiger_goat === dx_goat_dest && dy_tiger_goat === dy_goat_dest) {
						return true; // Found capture
					}
				}
			}
		}
	}
	return false; // No moves found
}
