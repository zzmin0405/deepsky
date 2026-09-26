<script>
	import { onMount } from 'svelte';

	const DAYS = ['오늘', '내일', '모레'];
	const EMPTY_TIMES = { sunrise: '-', sunset: '-', moonrise: '-', moonset: '-' };

	let times = $state.raw(null);
	let failed = $state(false);
	let selectedDay = $state(0);
	let requestId = 0;

	// 날짜 버튼을 빠르게 바꿔 눌러도 마지막으로 누른 날짜의 응답만 반영합니다.
	async function load(dayIndex) {
		selectedDay = dayIndex;
		const currentRequest = ++requestId;

		try {
			const response = await fetch(`/api/rise-set?day=${dayIndex}`);
			const data = await response.json().catch(() => ({}));
			if (currentRequest !== requestId) return;
			if (!response.ok || data.error) {
				throw new Error(data.message || '출몰시각 정보를 가져오지 못했습니다.');
			}

			times = data;
			failed = false;
		} catch (error) {
			if (currentRequest !== requestId) return;
			console.error('Error fetching rise/set times:', error);
			times = EMPTY_TIMES;
			failed = true;
		}
	}

	onMount(() => {
		load(0);
	});

	let items = $derived(
		times
			? [
					{ label: '일출 시각', value: times.sunrise, icon: '🌅', tone: 'sun' },
					{ label: '일몰 시각', value: times.sunset, icon: '🌇', tone: 'sun' },
					{ label: '월출 시각', value: times.moonrise, icon: null, tone: 'moon' },
					{ label: '월몰 시각', value: times.moonset, icon: null, tone: 'moon' }
				]
			: []
	);
</script>

{#if times}
	<div class="moon-info-container">
		<h2 class="moon-info-title">일출몰/월출몰 정보 (서울)</h2>

		<div class="date-buttons">
			{#each DAYS as label, index (label)}
				<button type="button" class:selected={selectedDay === index} onclick={() => load(index)}>
					{label}
				</button>
			{/each}
		</div>

		{#if failed}
			<p class="moon-error" role="status">출몰시각 정보를 불러오지 못했어요.</p>
		{/if}

		<div class="moon-info-items">
			{#each items as item (item.label)}
				<div class="moon-info-item">
					<div class="moon-info-icon {item.tone}">
						{#if item.icon}
							<span class="icon-emoji">{item.icon}</span>
						{:else}
							<i class="fas fa-moon"></i>
						{/if}
					</div>
					<div class="moon-info-details">
						<div class="moon-info-label">{item.label}</div>
						<div class="moon-info-value">{item.value}</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.moon-info-container {
		background:
			linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 64, 175, 0.82)),
			#0f172a;
		color: #ffffff;
	}

	.moon-info-title {
		color: #fff;
		margin-bottom: 18px;
	}

	.moon-info-container .date-buttons {
		margin-bottom: 25px;
	}

	.moon-info-container .date-buttons button {
		background: rgba(255, 255, 255, 0.15);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 8px 20px;
	}

	.moon-info-container .date-buttons button.selected {
		background: rgba(255, 255, 255, 0.3);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.moon-error {
		margin: -12px 0 18px;
		color: #fecaca;
		font-size: 0.92rem;
		font-weight: 600;
		text-align: center;
	}

	.moon-info-items {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.moon-info-item {
		min-width: 0;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.1);
		border-radius: var(--radius);
		padding: 15px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		backdrop-filter: blur(5px);
		transition:
			transform 0.3s,
			box-shadow 0.3s;
	}

	.moon-info-item:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
	}

	.moon-info-icon {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 10px;
		font-size: 1.5em;
	}

	.moon-info-icon.sun {
		background: rgba(255, 193, 7, 0.3);
		color: #ffd54f;
	}

	.moon-info-icon.moon {
		background: rgba(156, 39, 176, 0.3);
		color: #ce93d8;
	}

	.icon-emoji {
		font-size: 1.45rem;
		margin-bottom: 5px;
	}

	.moon-info-details {
		width: 100%;
	}

	.moon-info-label {
		color: #cbd5e1;
		font-size: 0.86rem;
		font-weight: 700;
		margin-bottom: 5px;
	}

	.moon-info-value {
		font-size: 1.25rem;
		font-weight: 800;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 768px) {
		.moon-info-items {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 520px) {
		.moon-info-items {
			grid-template-columns: 1fr;
		}
	}
</style>
