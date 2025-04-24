<script lang="ts">
	import type { GameState, Line, Point } from '$lib/types';

	interface prop {
		points: Point[];
		lines: Line[];
		gameState: GameState;
		validMoves: number[];
		handlePointClick: (id: number) => void;
	}
	let { lines, points, gameState, validMoves, handlePointClick }: prop = $props();
</script>

<svg
	width="100%"
	viewBox="0 0 500 500"
	class="mx-auto block rounded-lg border border-gray-300 bg-white shadow-lg"
>
	<!-- Board Background -->
	<rect width="100%" height="100%" fill="#f9fafb" />
	<!-- Board Line -->
	{#each lines as line}
		<line
			x1={line.x1}
			y1={line.y1}
			x2={line.x2}
			y2={line.y2}
			class="stoke-2 stroke-gray-400"
		/>{/each}
	<!-- Points -->

	{#each points as { id, x, y }}
		{@const piece = gameState.board[id]}
		{@const selected = gameState.selectedPieceId === id}
		{@const valid = validMoves.includes(id)}

		{#if piece === 'TIGER'}
			<g transform={`translate(${x}, ${y})`}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<text
					x={0}
					y={5}
					font-size="40"
					text-anchor="middle"
					class="cursor-pointer select-none"
					tabindex="0"
					role="button"
					aria-label={`Point ${id}`}
					onclick={() => handlePointClick(id)}
				>
					🐯
				</text>
			</g>
		{:else if piece === 'GOAT'}
			<g transform={`translate(${x}, ${y})`}>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<text
					x={0}
					y={5}
					font-size="40"
					text-anchor="middle"
					class="cursor-pointer select-none"
					tabindex="0"
					role="button"
					aria-label={`Point ${id}`}
					onclick={() => handlePointClick(id)}
				>
					🐐
				</text>
			</g>
		{:else}
			<!-- Empty Point-->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<circle
				cx={x}
				cy={y}
				r="12"
				stroke="gray"
				stroke-width="1"
				class={valid ? 'cursor-pointer fill-red-200' : 'fill-white'}
				aria-label={`Point ${id}`}
				role="button"
				tabindex="0"
				onclick={() => handlePointClick(id)}
			/>
		{/if}
	{/each}
</svg>
