<script>
	import { formatValue, isNightTime, weatherIcon } from '$lib/forecastDisplay';

	/**
	 * 시간대별 예보 표의 한 칸입니다. 예보가 없는 시간은 값 대신 '-'를 보여줍니다.
	 * @type {{ hour: string, row?: object | null, selected?: boolean, onselect: (time: string) => void }}
	 */
	let { hour, row = null, selected = false, onselect } = $props();

	let time = $derived(`${hour}00`);
	let night = $derived(isNightTime(time));
</script>

<button
	type="button"
	class="timeline-column"
	class:selected
	data-time={time}
	onclick={() => onselect(time)}
>
	<div class="time-header">{hour}시</div>
	<div class="observable-slot">
		{#if row}
			{#if night}
				<span class="observable-badge" class:good={row.observable} class:bad={!row.observable}>
					{row.observable ? '관측 유리' : '관측 불리'}
				</span>
			{:else}
				<span class="observable-badge">낮 시간</span>
			{/if}
		{/if}
	</div>
	<div class="weather-data-item">
		<span class="data-label">기온</span>
		<span class="data-value">{formatValue(row?.temperature, '°C')}</span>
	</div>
	<div class="weather-data-item">
		<span class="weather-icon">{weatherIcon(row, time)}</span>
		<span class="data-label">하늘상태</span>
		<span class="data-value">{formatValue(row?.skyText)}</span>
	</div>
	<div class="weather-data-item">
		<span class="data-label">강수형태</span>
		<span class="data-value">{formatValue(row?.precipitationText)}</span>
	</div>
	<div class="weather-data-item">
		<span class="data-label">강수확률</span>
		<span class="data-value">{formatValue(row?.precipitationProbability, '%')}</span>
	</div>
	<div class="weather-data-item">
		<span class="data-label">강수량</span>
		<!-- 기상청 값("강수없음", "1mm 미만", "30.0~50.0mm" 등)을 해당 시간 그대로 보여줍니다. -->
		<span class="data-value">{formatValue(row?.precipitationAmount)}</span>
	</div>
	<div class="weather-data-item">
		<span class="data-label">적설량</span>
		<span class="data-value">{formatValue(row?.snowfall)}</span>
	</div>
	<div class="weather-data-item">
		<span class="data-label">습도</span>
		<span class="data-value">{formatValue(row?.humidity, '%')}</span>
	</div>
</button>

<style>
	.timeline-column {
		width: 126px;
		min-width: 126px;
		height: auto;
		min-height: 0;
		padding: 14px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.3s ease;
		background: #ffffff;
		color: var(--text);
		text-align: initial;
		box-shadow: none;
		touch-action: pan-x;
		user-select: none;
	}

	:global(.weather-timeline.dragging) .timeline-column {
		pointer-events: none;
	}

	.timeline-column:hover {
		transform: translateY(-2px);
		border-color: var(--primary);
		box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
	}

	.timeline-column.selected {
		background-color: var(--primary-soft);
		border-color: var(--primary);
		box-shadow: 0 12px 26px rgba(37, 99, 235, 0.18);
	}

	.timeline-column:hover,
	.timeline-column:focus-visible {
		background: #ffffff;
	}

	.time-header {
		font-weight: 800;
		text-align: center;
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--line);
		color: var(--primary-strong);
		font-size: 1.05rem;
	}

	.observable-slot {
		display: flex;
		justify-content: center;
		min-height: 24px;
		margin-bottom: 6px;
	}

	.observable-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 9px;
		border-radius: 999px;
		background: #f1f5f9;
		color: var(--muted);
		font-size: 0.76rem;
		font-weight: 800;
	}

	.observable-badge.good {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.observable-badge.bad {
		background: #fee2e2;
		color: var(--danger);
	}

	.weather-data-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 54px;
		padding: 7px 0;
		border-bottom: 1px solid #eef2f7;
		text-align: center;
	}

	.weather-data-item:last-child {
		border-bottom: none;
	}

	.data-label {
		color: var(--muted);
		font-size: 0.78rem;
		margin-bottom: 4px;
		font-weight: 600;
	}

	.data-value {
		font-weight: 800;
		color: var(--text);
		font-size: 0.92rem;
	}

	.weather-icon {
		font-size: 1.45rem;
		margin-bottom: 5px;
	}

	@media (max-width: 520px) {
		.timeline-column {
			width: 118px;
			min-width: 118px;
			padding: 12px;
		}
	}
</style>
