import type { GameState, Point, Line, CaptureInfo } from './types';
import { GOAT_CAPTURE_LIMIT, PLAYER_TYPES } from './constants';

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
	const pointMap = new Map<string, Point>();
	for (const p of points) {
		pointMap.set(`${p.x},${p.y}`, p);
	}

	const adjacency = new Map<number, Set<number>>();

	for (const line of lines) {
		const p1 = pointMap.get(`${line.x1},${line.y1}`);
		const p2 = pointMap.get(`${line.x2},${line.y2}`);
		if (!p1 || !p2) continue;

		if (!adjacency.has(p1.id)) adjacency.set(p1.id, new Set());
		if (!adjacency.has(p2.id)) adjacency.set(p2.id, new Set());

		adjacency.get(p1.id)!.add(p2.id);
		adjacency.get(p2.id)!.add(p1.id);
	}

	// Convert Set to Array
	const adjacencyMap = new Map<number, number[]>();
	for (const [id, neighbors] of adjacency.entries()) {
		adjacencyMap.set(id, Array.from(neighbors));
	}

	console.log('Build adjacency map: ', adjacencyMap);
	return adjacencyMap;
}

// Assuming adjacencyMap is passed or accessible
export function getAdjacentPoints(pointId: number, adjacencyMap: Map<number, number[]>): number[] {
	return adjacencyMap.get(pointId) ?? [];
}

// --- Move Calculation ---
// export function calculateValidTigerMoves(
// 	tigerId: number,
// 	gameState: GameState,
// 	points: Point[],
// 	adjacencyMap: Map<number, number[]>
// ): { validDestinationIds: number[]; validCaptureInfos: CaptureInfo[] } {
// 	const validDestinationIds: number[] = [];
// 	const validCaptureInfos: CaptureInfo[] = [];
// 	const adjacentIds = getAdjacentPoints(tigerId, adjacencyMap);

// 	for (const adjId of adjacentIds) {
// 		const pieceAtAdj = gameState.board[adjId];

// 		if (pieceAtAdj === null) {
// 			validDestinationIds.push(adjId);
// 		} else if (pieceAtAdj === PLAYER_TYPES.GOAT) {
// 			const startPoint = points[tigerId];
// 			const goatPoint = points[adjId];
// 			if (!startPoint || !goatPoint) continue;
// 			const pointsAdjacentToGoat = getAdjacentPoints(adjId, adjacencyMap);
// 			for (const potentialDestId of pointsAdjacentToGoat) {
// 				if (potentialDestId === tigerId) continue;
// 				const destinationPoint = points[potentialDestId];
// 				if (!destinationPoint) continue;
// 				const isDestEmpty = gameState.board[potentialDestId] === null;
// 				if (isDestEmpty) {
// 					const dx_tiger_goat = goatPoint.x - startPoint.x;
// 					const dy_tiger_goat = goatPoint.y - startPoint.y;
// 					const dx_goat_dest = destinationPoint.x - goatPoint.x;
// 					const dy_goat_dest = destinationPoint.y - goatPoint.y;
// 					const isStraightLine = dx_tiger_goat === dx_goat_dest && dy_tiger_goat === dy_goat_dest;
// 					if (isStraightLine) {
// 						if (!validDestinationIds.includes(potentialDestId)) {
// 							validDestinationIds.push(potentialDestId);
// 						}
// 						const captureExists = validCaptureInfos.some(
// 							(info) => info.destinationId === potentialDestId && info.jumpedGoatId === adjId
// 						);
// 						if (!captureExists) {
// 							validCaptureInfos.push({ destinationId: potentialDestId, jumpedGoatId: adjId });
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return { validDestinationIds, validCaptureInfos };
// }
export function calculateValidTigerMoves(
	tigerId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]>
): { validDestinationIds: number[]; validCaptureInfos: CaptureInfo[] } {
	const validDestinations = new Set<number>();
	const validCaptures: CaptureInfo[] = [];

	const tigerPos = points[tigerId];
	if (!tigerPos) return { validDestinationIds: [], validCaptureInfos: [] };

	for (const adjId of getAdjacentPoints(tigerId, adjacencyMap)) {
		const adjPiece = gameState.board[adjId];

		// Simple move
		if (adjPiece === null) {
			validDestinations.add(adjId);
			continue;
		}

		// Potential capture
		if (adjPiece === PLAYER_TYPES.GOAT) {
			const goatPos = points[adjId];
			if (!goatPos) continue;

			const dx = goatPos.x - tigerPos.x;
			const dy = goatPos.y - tigerPos.y;

			for (const destId of getAdjacentPoints(adjId, adjacencyMap)) {
				if (destId === tigerId) continue;
				const destPos = points[destId];
				if (!destPos) continue;

				const dx2 = destPos.x - goatPos.x;
				const dy2 = destPos.y - goatPos.y;

				if (dx === dx2 && dy === dy2 && gameState.board[destId] === null) {
					validDestinations.add(destId);
					if (
						!validCaptures.some(
							(info) => info.destinationId === destId && info.jumpedGoatId === adjId
						)
					) {
						validCaptures.push({ destinationId: destId, jumpedGoatId: adjId });
					}
				}
			}
		}
	}

	console.log(`Tiger ${tigerId} valid moves:`, [...validDestinations]);
	return {
		validDestinationIds: Array.from(validDestinations),
		validCaptureInfos: validCaptures
	};
}

export function calculateValidGoatMoves(
	goatId: number,
	gameState: GameState,
	adjacencyMap: Map<number, number[]>
): number[] {
	const board = gameState.board;

	if (!adjacencyMap.has(goatId)) return [];
	const validDestinationIds: number[] = [];

	for (const adjId of getAdjacentPoints(goatId, adjacencyMap)) {
		if (board[adjId] === null) {
			validDestinationIds.push(adjId);
		}
	}
	return validDestinationIds;
}

// --- Move Execution ---
export function executeTigerMove(
	fromId: number,
	toId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]>
): void {
	const isCapture = !getAdjacentPoints(fromId, adjacencyMap).includes(toId);

	// Update board
	gameState.board[toId] = PLAYER_TYPES.TIGER;
	gameState.board[fromId] = null;

	if (isCapture) {
		const startPoint = points[fromId];
		const endPoint = points[toId];
		if (!startPoint || !endPoint) return;
		const goatX = (startPoint.x + endPoint.x) / 2;
		const goatY = (startPoint.y + endPoint.y) / 2;
		const jumpedGoat = points.find((p) => Math.abs(p.x - goatX) < 1 && Math.abs(p.y - goatY) < 1);

		if (jumpedGoat && gameState.board[jumpedGoat.id] === PLAYER_TYPES.GOAT) {
			gameState.board[jumpedGoat.id] = null;
			gameState.goatsCaptured += 1;
			if (gameState.goatsCaptured >= GOAT_CAPTURE_LIMIT) {
				gameState.winner = PLAYER_TYPES.TIGER;
			}
		} else {
			console.error(`Capture move executed, failed to find goat at midpoint.`);
		}
	}

	// Finalize turn only if no winner
	if (!gameState.winner) {
		gameState.turn = PLAYER_TYPES.GOAT;
	}
	gameState.selectedPieceId = null;
	gameState.validMoves = [];
}

// export function executeTigerMove(
// 	fromId: number,
// 	toId: number,
// 	gameState: GameState,
// 	captureInfos: CaptureInfo[]
// ): void {
// 	// Update board
// 	gameState.board[toId] = PLAYER_TYPES.TIGER;
// 	gameState.board[fromId] = null;

// 	// Check if the move was a capture
// 	const captureInfo = captureInfos.find((info) => info.destinationId === toId);

// 	if (captureInfo) {
// 		const jumpedId = captureInfo.jumpedGoatId;
// 		if (gameState.board[jumpedId] === PLAYER_TYPES.GOAT) {
// 			gameState.board[jumpedId] = null;
// 			gameState.goatsCaptured += 1;

// 			if (gameState.goatsCaptured >= GOAT_CAPTURE_LIMIT) {
// 				gameState.winner = PLAYER_TYPES.TIGER;
// 			}
// 		} else {
// 			console.error(`Expected goat at ${jumpedId} during capture, but none found.`);
// 		}
// 	}

// 	if (!gameState.winner) {
// 		gameState.turn = PLAYER_TYPES.GOAT;
// 	}
// 	gameState.selectedPieceId = null;
// 	gameState.validMoves = [];
// }

// Pass gameState BY REFERENCE
export function executeGoatMove(
	fromId: number,
	toId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]> // Pass map
): void {
	// Returns void, modifies gameState
	if (gameState.board[toId] !== null || gameState.board[fromId] !== PLAYER_TYPES.GOAT) {
		return;
	}
	gameState.board[toId] = PLAYER_TYPES.GOAT;
	gameState.board[fromId] = null;

	// Check Goat Win Condition
	let allTigersBlocked = true;
	for (let i = 0; i < gameState.board.length; i++) {
		if (gameState.board[i] === PLAYER_TYPES.TIGER) {
			if (tigerHasAnyValidMoves(i, gameState, points, adjacencyMap)) {
				allTigersBlocked = false;
				break;
			} else {
				console.log(`Tiger ${i} is blocked`);
			}
		}
	}
	if (allTigersBlocked) {
		gameState.winner = PLAYER_TYPES.GOAT;
		console.log('GOATS WIN!');
	}

	// Finalize turn only if no winner
	if (!gameState.winner) {
		gameState.turn = PLAYER_TYPES.TIGER;
	}
	gameState.selectedPieceId = null;
	gameState.validMoves = [];
}

// --- Win Condition Check Helper ---
// Pass necessary info
// export function tigerHasAnyValidMoves(
// 	tigerId: number,
// 	gameState: GameState,
// 	points: Point[],
// 	adjacencyMap: Map<number, number[]>
// ): boolean {
// 	const adjacentIds = getAdjacentPoints(tigerId, adjacencyMap);
// 	for (const adjId of adjacentIds) {
// 		const pieceAtAdj = gameState.board[adjId];
// 		if (pieceAtAdj === null) return true;
// 		if (pieceAtAdj === PLAYER_TYPES.GOAT) {
// 			const startPoint = points[tigerId];
// 			const goatPoint = points[adjId];
// 			if (!startPoint || !goatPoint) continue;
// 			const pointsAdjacentToGoat = getAdjacentPoints(adjId, adjacencyMap);
// 			for (const potentialDestId of pointsAdjacentToGoat) {
// 				if (potentialDestId === tigerId) continue;
// 				const destinationPoint = points[potentialDestId];
// 				if (!destinationPoint) continue;
// 				if (gameState.board[potentialDestId] === null) {
// 					const dx_tiger_goat = goatPoint.x - startPoint.x;
// 					const dy_tiger_goat = goatPoint.y - startPoint.y;
// 					const dx_goat_dest = destinationPoint.x - goatPoint.x;
// 					const dy_goat_dest = destinationPoint.y - goatPoint.y;
// 					if (dx_tiger_goat === dx_goat_dest && dy_tiger_goat === dy_goat_dest) {
// 						return true; // Found capture
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return false; // No moves found
// }

export function tigerHasAnyValidMoves(
	tigerId: number,
	gameState: GameState,
	points: Point[],
	adjacencyMap: Map<number, number[]>
): boolean {
	const start = points[tigerId];
	if (!start) return false;

	for (const adjId of getAdjacentPoints(tigerId, adjacencyMap)) {
		const piece = gameState.board[adjId];

		// Normal move: empty adjacent space
		if (piece === null) return true;

		// Potential capture
		if (piece === PLAYER_TYPES.GOAT) {
			const goat = points[adjId];
			if (!goat) continue;

			const dx = goat.x - start.x;
			const dy = goat.y - start.y;

			const potentialCaptureX = goat.x + dx;
			const potentialCaptureY = goat.y + dy;

			// Find the destination point that lies beyond the goat
			const capturePoint = points.find(
				(p) =>
					p.x === potentialCaptureX &&
					p.y === potentialCaptureY &&
					gameState.board[p.id] === null &&
					getAdjacentPoints(adjId, adjacencyMap).includes(p.id)
			);

			if (capturePoint) return true; // Valid capture move
		}
	}

	return false;
}
