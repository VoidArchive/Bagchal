<!-- src/lib/components/Board.svelte -->
<script lang="ts">
	import type { Point, Line, PieceType, Player, GamePhase } from '$lib/types'; // Corrected phase type
	import {
		PIECE_COLOR,
		STROKE_COLOR,
		STROKE_WIDTH,
		PIECE_RADIUS,
		PLAYER_TYPES,
		GAME_PHASES,
		LINE_COLOR
	} from '$lib/constants';

	interface Props {
		points: Point[];
		lines: Line[];
		boardState: PieceType[];
		selectedPieceId: number | null;
		validMoves: number[];
		turn: Player;
		phase: GamePhase; // Use the type
		boardSize?: number;
		onPointClick: (pointId: number) => void;
	}

	let {
		points,
		lines,
		boardState,
		selectedPieceId,
		validMoves,
		turn,
		phase,
		boardSize = 500,
		onPointClick
	}: Props = $props();
</script>

<svg
	width="100%"
	viewBox="0 0 {boardSize} {boardSize}"
	style="border: 1px solid black; max-width: 600px; display: block; margin: auto;"
>
	<defs>
		<linearGradient id="tigerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:{PIECE_COLOR.TIGER_START};stop-opacity:1" />
			<stop offset="100%" style="stop-color:{PIECE_COLOR.TIGER_END};stop-opacity:1" />
		</linearGradient>
		<linearGradient id="goatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" style="stop-color:{PIECE_COLOR.GOAT_START};stop-opacity:1" />
			<stop offset="100%" style="stop-color:{PIECE_COLOR.GOAT_END};stop-opacity:1" />
		</linearGradient>
	</defs>

	<rect width="100%" height="100%" fill="#eee" />

	<!-- Lines -->
	{#each lines as line, i (i)}
		<line
			x1={line.x1}
			y1={line.y1}
			x2={line.x2}
			y2={line.y2}
			stroke={LINE_COLOR}
			stroke-width={STROKE_WIDTH.DEFAULT + 1}
			stroke-linecap="round"
		/>
	{/each}

	<!-- Points / Pieces / Highlights -->
	{#each points as point (point.id)}
		{@const piece = boardState[point.id]}
		{@const isSelected = point.id === selectedPieceId}
		{@const isValidMove = validMoves.includes(point.id)}
		{@const isMyTurn = piece === turn}
		{@const isPieceSelectable =
			(turn === PLAYER_TYPES.TIGER && piece === PLAYER_TYPES.TIGER) ||
			(turn === PLAYER_TYPES.GOAT && phase === GAME_PHASES.MOVEMENT && piece === PLAYER_TYPES.GOAT)}

		{#if piece === PLAYER_TYPES.TIGER}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				class:piece={true}
				class:tiger={true}
				class:selected={isSelected && isMyTurn}
				class:faded={selectedPieceId !== null && !isSelected && isMyTurn}
				cx={point.x}
				cy={point.y}
				r={PIECE_RADIUS.TIGER}
				fill="url(#tigerGradient)"
				stroke={isSelected && isMyTurn ? STROKE_COLOR.SELECTED_TIGER : STROKE_COLOR.DEFAULT}
				stroke-width={isSelected && isMyTurn ? STROKE_WIDTH.SELECTED : STROKE_WIDTH.DEFAULT}
				style:cursor={isPieceSelectable ? 'pointer' : 'default'}
				onclick={() => onPointClick(point.id)}
			/>
		{:else if piece === PLAYER_TYPES.GOAT}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				class:piece={true}
				class:goat={true}
				class:selected={isSelected && isMyTurn}
				class:faded={selectedPieceId !== null &&
					!isSelected &&
					isMyTurn &&
					phase === GAME_PHASES.MOVEMENT}
				cx={point.x}
				cy={point.y}
				r={PIECE_RADIUS.GOAT}
				fill="url(#goatGradient)"
				stroke={isSelected && isMyTurn ? STROKE_COLOR.SELECTED_GOAT : STROKE_COLOR.DEFAULT}
				stroke-width={isSelected && isMyTurn ? STROKE_WIDTH.SELECTED : STROKE_WIDTH.DEFAULT}
				style:cursor={isPieceSelectable ? 'pointer' : 'default'}
				onclick={() => onPointClick(point.id)}
			/>
		{:else}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				class="empty-point"
				class:valid-move={isValidMove}
				cx={point.x}
				cy={point.y}
				r={isValidMove ? PIECE_RADIUS.HIGHLIGHT : PIECE_RADIUS.EMPTY}
				fill={isValidMove
					? turn === PLAYER_TYPES.TIGER
						? PIECE_COLOR.VALID_MOVE_TIGER
						: PIECE_COLOR.VALID_MOVE_GOAT
					: PIECE_COLOR.EMPTY}
				stroke={isValidMove ? STROKE_COLOR.VALID_MOVE : STROKE_COLOR.EMPTY}
				stroke-width={isValidMove ? STROKE_WIDTH.VALID_MOVE : STROKE_WIDTH.EMPTY}
				style:cursor={isValidMove ? 'pointer' : 'default'}
				onclick={() => onPointClick(point.id)}
			/>
		{/if}
	{/each}
</svg>

<style>
	.piece {
		transition:
			opacity 0.3s ease,
			transform 0.1s ease,
			stroke 0.2s ease,
			stroke-width 0.2s ease;
		filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.3));
	}
	.piece.faded {
		opacity: 0.6;
	}

	.empty-point {
		transition:
			fill 0.2s ease,
			r 0.2s ease,
			stroke 0.2s ease,
			stroke-width 0.2s ease;
	}
</style>
