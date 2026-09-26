<script>
	import { draggableScroll } from '$lib/actions/draggableScroll';
	import { HOURS, favorableNightTimes, formatHour, isNightTime } from '$lib/forecastDisplay';
	import TimelineColumn from './TimelineColumn.svelte';

	/**
	 * 오늘·내일·모레 시간대별 예보 표입니다.
	 * @type {{ forecast: { location: { province: string, city: string }, days: { date: string, label: string, rows: object[] }[] } }}
	 */
	let { forecast } = $props();

	// 새 예보가 오면 데이터가 있는 첫 날짜로 돌아갑니다. 사용자가 날짜나 시간을 누르면 그 값으로 덮어씁니다.
	let selection = $derived({
		dayIndex: Math.max(0, forecast.days.findIndex((day) => day.rows.length)),
		time: null
	});

	let timeline = $state();
	let day = $derived(forecast.days[selection.dayIndex] ?? null);
	// 날짜를 바꾸거나 새 예보가 오면 새 값이 됩니다. 시간 칸만 누를 때는 그대로라 스크롤을 건드리지 않습니다.
	let scrollTarget = $derived(day ? { day, time: day.rows.map((row) => row.time).sort()[0] } : null);

	// 오늘 예보는 지난 시간이 비어 있으므로 예보가 있는 첫 시간이 보이도록 표를 옮깁니다.
	$effect(() => {
		if (!timeline || !scrollTarget?.time) return;
		const column = timeline.querySelector(`[data-time="${scrollTarget.time}"]`);
		if (!column) return;
		const padding = Number.parseFloat(getComputedStyle(timeline).paddingLeft) || 0;
		timeline.scrollLeft +=
			column.getBoundingClientRect().left - timeline.getBoundingClientRect().left - padding;
	});
	let rowsByTime = $derived(new Map((day?.rows ?? []).map((row) => [row.time, row])));
	let hasNightRows = $derived((day?.rows ?? []).some((row) => isNightTime(row.time)));
	let goodTimes = $derived(favorableNightTimes(day?.rows ?? []));

	function selectDay(dayIndex) {
		selection = { ...selection, dayIndex };
	}

	function selectTime(time) {
		selection = { ...selection, time };
	}
</script>

<div class="weather-info-container">
	<h2 class="date-info">날짜별 날씨 정보</h2>
	<div class="selected-location">{forecast.location.province} {forecast.location.city}</div>

	<div class="date-buttons">
		{#each forecast.days as forecastDay, index (forecastDay.date)}
			<button type="button" class:selected={selection.dayIndex === index} onclick={() => selectDay(index)}>
				{forecastDay.label}
			</button>
		{/each}
		<span class="scroll-hint">날씨가 보이지 않는다면 옆으로 넘겨주세요 !</span>
	</div>

	{#if day}
		<p class="night-summary" role="status">
			{#if goodTimes.length}
				{day.label} 밤·새벽 중 관측 유리 시간:
				<strong class="observation-possible">{goodTimes.map(formatHour).join(', ')}</strong>
			{:else if hasNightRows}
				<strong class="observation-impossible">{day.label} 밤·새벽 시간대는 관측에 불리한 예보입니다.</strong>
			{:else}
				{day.label} 밤·새벽 시간대 예보가 없습니다.
			{/if}
		</p>
	{/if}

	<div class="weather-timeline-container">
		<div
			class="weather-timeline"
			bind:this={timeline}
			use:draggableScroll
			role="region"
			aria-label="시간대별 날씨 정보"
		>
			<div class="timeline-hours">
				{#each HOURS as hour (hour)}
					<TimelineColumn
						{hour}
						row={rowsByTime.get(`${hour}00`)}
						selected={selection.time === `${hour}00`}
						onselect={selectTime}
					/>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.night-summary {
		margin: 0 0 4px;
		color: var(--muted-strong);
		font-size: 0.95rem;
		font-weight: 700;
		text-align: center;
	}

	.weather-timeline-container {
		margin-top: 20px;
		width: 100%;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface-soft);
	}

	.weather-timeline {
		overflow-x: auto;
		overflow-y: hidden;
		white-space: nowrap;
		-webkit-overflow-scrolling: touch;
		padding: 16px;
		user-select: none;
		-webkit-user-select: none;
		overscroll-behavior-x: contain;
		touch-action: pan-x;
		cursor: grab;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.weather-timeline::-webkit-scrollbar {
		display: none;
	}

	:global(.weather-timeline.dragging) {
		cursor: grabbing;
	}

	.timeline-hours {
		display: flex;
		gap: 12px;
		width: max-content;
	}
</style>
