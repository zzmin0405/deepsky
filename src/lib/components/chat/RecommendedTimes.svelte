<script>
	import { formatHour } from '$lib/forecastDisplay';

	/** @type {{ times: string[], compact?: boolean }} */
	let { times, compact = false } = $props();
</script>

<div class="recommended-times" class:compact>
	<span>추천 시간</span>
	<div>
		{#each times as time (time)}
			<strong>{formatHour(time)}</strong>
		{/each}
	</div>
</div>

<style>
	.recommended-times {
		display: grid;
		gap: 8px;
		padding: 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #ffffff;
	}

	.recommended-times > span {
		color: var(--muted);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.recommended-times div {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.recommended-times strong {
		padding: 5px 9px;
		border-radius: 999px;
		background: var(--primary);
		color: #ffffff;
		font-size: 0.82rem;
	}

	.recommended-times.compact {
		padding: 9px;
	}

	.recommended-times.compact strong {
		padding: 4px 8px;
		font-size: 0.78rem;
	}
</style>
