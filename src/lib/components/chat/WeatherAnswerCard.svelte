<script>
	import { VERDICT_LABELS, formatHour, formatValue } from '$lib/forecastDisplay';
	import RecommendedTimes from './RecommendedTimes.svelte';

	/**
	 * 한 지역의 예보로 관측 가능성을 판단한 결과 카드입니다.
	 * @type {{ card: { location: string, targetDate: string, verdict: 'good' | 'mixed' | 'bad', summary: string, matched: boolean, recommendedTimes: string[], rows: object[] } }}
	 */
	let { card } = $props();
</script>

<div class="weather-answer-card">
	<div class="weather-answer-top">
		<div>
			<div class="weather-answer-kicker">예보 기반 관측 판단</div>
			<div class="weather-answer-title">
				{card.location}
				<span>{card.targetDate}</span>
			</div>
		</div>
		<span class="verdict-badge {card.verdict}">{VERDICT_LABELS[card.verdict]}</span>
	</div>

	<p class="weather-answer-summary">{card.summary}</p>

	{#if card.recommendedTimes.length}
		<RecommendedTimes times={card.recommendedTimes} />
	{/if}

	<div class="weather-answer-grid">
		{#each card.rows as row (row.time)}
			<div class="weather-answer-row" class:observable={row.observable}>
				<div class="row-time">
					<strong>{formatHour(row.time)}</strong>
					<span>{row.observable ? '유리' : '불리'}</span>
				</div>
				<div class="row-metrics">
					<span>하늘 {row.sky}</span>
					<span>강수 {row.precipitation}</span>
					<span>확률 {formatValue(row.precipitationProbability, '%')}</span>
					<span>습도 {formatValue(row.humidity, '%')}</span>
				</div>
			</div>
		{/each}
	</div>

	{#if !card.matched}
		<p class="match-warning">지역명을 정확히 찾지 못해 기본 지역 기준으로 계산했어요.</p>
	{/if}
</div>

<style>
	.weather-answer-card {
		display: grid;
		gap: 12px;
		margin-bottom: 12px;
	}

	.weather-answer-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
		padding: 14px;
		border-radius: var(--radius);
		background: var(--surface-tint);
	}

	.weather-answer-kicker {
		margin-bottom: 4px;
		color: var(--primary-strong);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.weather-answer-title {
		color: var(--text);
		font-size: 1.05rem;
		font-weight: 800;
	}

	.weather-answer-title span {
		display: block;
		margin-top: 2px;
		color: var(--muted);
		font-size: 0.86rem;
		font-weight: 700;
	}

	.verdict-badge {
		flex: 0 0 auto;
		padding: 7px 10px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 900;
		white-space: nowrap;
	}

	.verdict-badge.good {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.verdict-badge.mixed {
		background: #fef3c7;
		color: #92400e;
	}

	.verdict-badge.bad {
		background: #fee2e2;
		color: var(--danger);
	}

	.weather-answer-summary {
		margin: 0;
		padding: 0 4px;
		color: var(--text);
		font-weight: 700;
	}

	.weather-answer-grid {
		display: grid;
		gap: 8px;
	}

	.weather-answer-row {
		display: grid;
		grid-template-columns: 86px minmax(0, 1fr);
		gap: 10px;
		align-items: center;
		padding: 10px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #ffffff;
	}

	.weather-answer-row.observable {
		border-color: rgba(15, 118, 110, 0.32);
		background: #f0fdfa;
	}

	.row-time {
		display: grid;
		gap: 2px;
	}

	.row-time strong {
		color: var(--text);
		font-size: 1rem;
	}

	.row-time span {
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.weather-answer-row.observable .row-time span {
		color: var(--accent);
	}

	.row-metrics {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px 8px;
		color: var(--muted-strong);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.match-warning {
		margin: 0;
		padding: 10px 12px;
		border-radius: var(--radius);
		background: #fff7ed;
		color: #9a3412;
		font-size: 0.86rem;
		font-weight: 700;
	}

	@media (max-width: 600px) {
		.weather-answer-top {
			display: grid;
		}

		.weather-answer-row {
			grid-template-columns: 1fr;
		}

		.row-metrics {
			grid-template-columns: 1fr;
		}
	}
</style>
