<script lang="ts">
	import type { Point, Line, PieceType, Player } from '$lib/types';

	interface Props {
		points: Point[];
		lines: Line[];
		boardState: PieceType[];
		selectedPieceId: number | null;
		validMoves: number[];
		turn: Player; // Needed for highlighting logic
		phase: string; // Needed for cursor logic
		boardSize?: number; // Make size optional, provide default
		onPointClick: (pointId: number) => void; // Callback prop
	}

	let {
		points,
		lines,
		boardState,
		selectedPieceId,
		validMoves,
		turn,
		phase,
		boardSize = 500, // Default size if not provided
		onPointClick
	}: Props = $props();
</script>

<svg
	width="100%"
	viewBox="0 0 {boardSize} {boardSize}"
	style="border: 1px solid black; max-width: 600px; display: block; margin: auto;"
>
	<rect width="100%" height="100%" fill="#eee" />

	<!-- Lines -->
	{#each lines as line, i (i)}
		<line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="gray" stroke-width="2" />
	{/each}

	<!-- Points / Pieces / Highlights -->
	{#each points as point (point.id)}
		{@const piece = boardState[point.id]}
		{@const isSelected = point.id === selectedPieceId}
		{@const isValidMove = validMoves.includes(point.id)}

		{#if piece === 'TIGER'}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				onclick={() => onPointClick(point.id)}
				cx={point.x}
				cy={point.y}
				r="15"
				fill="darkorange"
				stroke={isSelected && turn === 'TIGER' ? 'red' : 'black'}
				stroke-width={isSelected && turn === 'TIGER' ? 4 : 2}
				class="piece tiger"
				style:cursor={turn === 'TIGER' ? 'pointer' : 'default'}
			/>
		{:else if piece === 'GOAT'}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				onclick={() => onPointClick(point.id)}
				cx={point.x}
				cy={point.y}
				r="12"
				fill="dodgerblue"
				stroke={isSelected && turn === 'GOAT' ? 'lime' : 'black'}
				stroke-width={isSelected && turn === 'GOAT' ? 4 : 2}
				class="piece goat"
				style:cursor={phase === 'MOVEMENT' && turn === 'GOAT' ? 'pointer' : 'default'}
			/>
		{:else}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<circle
				onclick={() => onPointClick(point.id)}
				cx={point.x}
				cy={point.y}
				r={isValidMove ? 10 : 8}
				fill={isValidMove ? (turn === 'TIGER' ? 'lightcoral' : 'lightgreen') : 'white'}
				stroke="darkgray"
				stroke-width="1"
				class="empty-point"
				style:cursor={isValidMove ? 'pointer' : 'default'}
			/>
		{/if}
	{/each}
</svg>

<style>
	/* Minimal styles specific to board presentation */
	.piece {
		/* Base piece style if any */
	}
	.empty-point {
		transition: fill 0.2s ease;
	}
	.empty-point:hover {
		/* Optional: General hover only if not a valid move? */
		/* fill: #f8f8f8; */
	}
	.empty-point[fill^='light'] {
		/* Style valid moves */
		stroke: #555;
		stroke-width: 1.5px;
	}
</style>
