<script>
	import { VERDICT_LABELS, formatHour, formatValue } from '$lib/forecastDisplay';
	import RecommendedTimes from './RecommendedTimes.svelte';

	/**
	 * 관측지 후보 상위 3곳을 장소 특성과 예보 근거와 함께 보여주는 카드입니다.
	 * @type {{ card: { targetDate: string, targetTimes: string[], candidateCount: number, summary: string, locations: object[] } }}
	 */
	let { card } = $props();

	// 값이 있는 장소 지표만 골라 보여줍니다.
	function placeMetrics(location) {
		return [
			location.distanceKm !== null && location.distanceKm !== undefined
				? { label: '거리', value: `${location.distanceKm}km` }
				: null,
			location.elevationM ? { label: '고도', value: `${location.elevationM}m` } : null,
			location.lightPollutionScore ? { label: '광해', value: `${location.lightPollutionScore}/10` } : null,
			location.bortleClass ? { label: 'Bortle', value: location.bortleClass } : null,
			location.sqmMagArcsec2 ? { label: 'SQM', value: location.sqmMagArcsec2 } : null,
			location.opennessScore ? { label: '개방감', value: `${location.opennessScore}/10` } : null,
			location.accessScore ? { label: '접근성', value: `${location.accessScore}/10` } : null
		].filter(Boolean);
	}
</script>

<div class="recommendation-card">
	<div class="recommendation-hero">
		<div>
			<div class="recommendation-kicker">관측지 추천</div>
			<div class="recommendation-title">
				{card.targetDate}
				<span>{card.candidateCount}개 관측 장소 비교</span>
			</div>
		</div>
		<span class="time-pill">{card.targetTimes.map(formatHour).join(' · ')}</span>
	</div>

	<p class="recommendation-summary">{card.summary}</p>

	<div class="recommendation-list">
		{#each card.locations as location (location.rank)}
			<article class="recommendation-item">
				<div class="recommendation-rank">
					<strong>{location.rank}</strong>
					<span>{VERDICT_LABELS[location.verdict]}</span>
				</div>
				<div class="recommendation-body">
					<div class="recommendation-name-row">
						<h3>{location.location}</h3>
						<span class="score-badge">점수 {location.score}</span>
					</div>
					{#if location.weatherRegion}
						<div class="weather-region">예보 기준: {location.weatherRegion}</div>
					{/if}
					{#if location.tags?.length}
						<div class="place-tags">
							{#each location.tags as tag (tag)}
								<span>{tag}</span>
							{/each}
						</div>
					{/if}
					<div class="place-score-grid">
						{#each placeMetrics(location) as metric (metric.label)}
							<span>{metric.label} <strong>{metric.value}</strong></span>
						{/each}
					</div>
					{#if location.description}
						<p>{location.description}</p>
					{/if}
					<p>{location.summary}</p>

					{#if location.recommendedTimes.length}
						<RecommendedTimes times={location.recommendedTimes} compact />
					{/if}

					<div class="mini-weather-grid">
						{#each location.rows as row (row.time)}
							<div class="mini-weather-row" class:observable={row.observable}>
								<strong>{formatHour(row.time)}</strong>
								<span>{row.sky}</span>
								<span>강수 {formatValue(row.precipitationProbability, '%')}</span>
								<span>습도 {formatValue(row.humidity, '%')}</span>
							</div>
						{/each}
					</div>
				</div>
			</article>
		{/each}
	</div>
</div>

<style>
	.recommendation-card {
		display: grid;
		gap: 12px;
		margin-bottom: 12px;
	}

	.recommendation-hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
		padding: 15px;
		border-radius: var(--radius);
		background: linear-gradient(135deg, #eef6ff 0%, #f0fdfa 100%);
		border: 1px solid #dbeafe;
	}

	.recommendation-kicker {
		margin-bottom: 4px;
		color: var(--primary-strong);
		font-size: 0.78rem;
		font-weight: 800;
	}

	.recommendation-title {
		color: var(--text);
		font-size: 1.08rem;
		font-weight: 900;
	}

	.recommendation-title span {
		display: block;
		margin-top: 2px;
		color: var(--muted);
		font-size: 0.84rem;
		font-weight: 800;
	}

	.time-pill {
		flex: 0 0 auto;
		max-width: 220px;
		padding: 8px 10px;
		border-radius: 999px;
		background: #ffffff;
		color: var(--primary-strong);
		border: 1px solid #bfdbfe;
		font-size: 0.78rem;
		font-weight: 900;
		line-height: 1.35;
		text-align: center;
	}

	.recommendation-summary {
		margin: 0;
		padding: 0 4px;
		color: var(--text);
		font-weight: 700;
	}

	.recommendation-list {
		display: grid;
		gap: 10px;
	}

	.recommendation-item {
		display: grid;
		grid-template-columns: 70px minmax(0, 1fr);
		gap: 12px;
		padding: 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: #ffffff;
	}

	.recommendation-rank {
		display: grid;
		align-content: start;
		justify-items: center;
		gap: 6px;
	}

	.recommendation-rank strong {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: var(--primary);
		color: #ffffff;
		font-size: 1.05rem;
		font-weight: 900;
	}

	.recommendation-rank span {
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 900;
		text-align: center;
	}

	.recommendation-body {
		min-width: 0;
		display: grid;
		gap: 9px;
	}

	.recommendation-name-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.recommendation-name-row h3 {
		margin: 0;
		color: var(--text);
		font-size: 1rem;
		line-height: 1.25;
	}

	.score-badge {
		flex: 0 0 auto;
		padding: 5px 8px;
		border-radius: 999px;
		background: #eff6ff;
		color: var(--primary-strong);
		font-size: 0.76rem;
		font-weight: 900;
	}

	.weather-region {
		width: fit-content;
		padding: 5px 8px;
		border-radius: 8px;
		background: #f8fafc;
		color: var(--muted);
		border: 1px solid var(--line);
		font-size: 0.76rem;
		font-weight: 900;
	}

	.place-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.place-tags span {
		padding: 4px 7px;
		border-radius: 999px;
		background: #ecfeff;
		color: #0e7490;
		border: 1px solid #a5f3fc;
		font-size: 0.72rem;
		font-weight: 900;
	}

	.place-score-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 6px;
	}

	.place-score-grid span {
		display: grid;
		gap: 2px;
		padding: 7px 8px;
		border-radius: 8px;
		background: #f8fafc;
		color: var(--muted);
		border: 1px solid var(--line);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.place-score-grid strong {
		color: var(--text);
		font-size: 0.78rem;
	}

	.recommendation-body p {
		margin: 0;
		color: var(--muted-strong);
		font-size: 0.86rem;
		font-weight: 700;
		line-height: 1.5;
	}

	.mini-weather-grid {
		display: grid;
		gap: 6px;
	}

	.mini-weather-row {
		display: grid;
		grid-template-columns: 44px repeat(3, minmax(0, 1fr));
		gap: 6px;
		align-items: center;
		padding: 7px 8px;
		border-radius: 8px;
		background: #f8fafc;
		color: var(--muted-strong);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.mini-weather-row.observable {
		background: #ecfdf5;
		color: #047857;
	}

	.mini-weather-row strong {
		color: var(--text);
		font-size: 0.78rem;
	}

	@media (max-width: 600px) {
		.recommendation-hero {
			display: grid;
		}

		.time-pill {
			max-width: none;
			text-align: left;
		}

		.recommendation-item {
			grid-template-columns: 1fr;
		}

		.recommendation-rank {
			display: flex;
			align-items: center;
			justify-content: flex-start;
		}

		.mini-weather-row {
			grid-template-columns: 40px repeat(2, minmax(0, 1fr));
		}

		.mini-weather-row span:first-of-type {
			grid-column: span 2;
		}

		.place-score-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
