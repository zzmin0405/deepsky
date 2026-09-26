<script>
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import { saveUserLocation, requestCurrentPosition } from '$lib/browserLocation';
	import { locations } from '$lib/constants/locations.js';
	import { formatHour } from '$lib/forecastDisplay';
	import { findClosestLocation } from '$lib/geo';
	import { kstNow } from '$lib/kst';
	import ForecastTimeline from '$lib/components/home/ForecastTimeline.svelte';
	import LocationPicker from '$lib/components/home/LocationPicker.svelte';
	import RiseSetCard from '$lib/components/home/RiseSetCard.svelte';

	const provinces = [...new Set(locations.map((location) => location.province))];
	// 서버(SSR)와 브라우저의 시간대와 관계없이 한국 시각을 표시합니다.
	const currentDate = kstNow();

	let province = $state('');
	let city = $state('');
	// 응답을 통째로 바꿔 끼우기만 하므로 깊은 반응성이 필요 없는 raw state로 둡니다.
	let forecast = $state.raw(null);
	let recommendedPlace = $state.raw(null);
	let isLoading = $state(false);
	let forecastMessage = $state('');
	let recommendationError = $state('');

	// 화면에 쓰이지 않는 흐름 제어용 값이라 반응형으로 만들지 않습니다.
	let hasManualSelection = false;
	let forecastRequestId = 0;

	let cities = $derived(
		locations.filter((location) => location.province === province).map((location) => location.city)
	);

	async function fetchForecast(location) {
		const requestId = ++forecastRequestId;
		isLoading = true;
		forecastMessage = '';

		try {
			const params = new URLSearchParams({ province: location.province, city: location.city });
			const response = await fetch(`/api/forecast?${params}`);
			const data = await response.json().catch(() => ({}));
			// 더 나중에 보낸 요청이 있으면 늦게 도착한 이전 응답은 버립니다.
			if (requestId !== forecastRequestId) return;

			if (!response.ok || !Array.isArray(data.days)) {
				throw new Error(data.message || '예보 데이터를 가져오지 못했습니다.');
			}
			forecast = data;
		} catch (error) {
			if (requestId !== forecastRequestId) return;
			console.error('Error fetching forecast:', error);
			forecast = null;
			forecastMessage = error.message || '예보 데이터를 가져오지 못했습니다.';
		} finally {
			if (requestId === forecastRequestId) isLoading = false;
		}
	}

	async function lookupSelectedLocation() {
		hasManualSelection = true;
		recommendedPlace = null;
		recommendationError = '';

		if (!province || !city) {
			forecastMessage = '광역시/도와 시/군/구를 선택해 주세요.';
			return;
		}

		const location = locations.find((item) => item.province === province && item.city === city);
		if (!location) {
			forecastMessage = '선택한 지역을 찾지 못했습니다.';
			return;
		}

		await fetchForecast(location);
	}

	async function recommendLocation() {
		hasManualSelection = true;
		isLoading = true;
		recommendedPlace = null;
		recommendationError = '';
		forecastMessage = '';

		try {
			const response = await fetch('/api/recommendations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: '오늘 별 관측 장소 추천해줘' })
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok || !data.locations?.length) {
				throw new Error(data.message || '추천 지역을 찾지 못했습니다.');
			}

			const [best] = data.locations;
			province = best.province;
			city = best.city;
			await fetchForecast(best);
			recommendedPlace = best;
		} catch (error) {
			console.error('Error fetching weather recommendation:', error);
			recommendationError = error.message || '추천 지역을 불러오지 못했습니다.';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		// 위치 권한 응답을 기다리는 동안에도 직접 지역을 골라 조회할 수 있도록 버튼은 잠그지 않습니다.
		const coordinates = await requestCurrentPosition({
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
		});
		if (!coordinates) return;

		saveUserLocation(coordinates);
		// 권한 응답 전에 사용자가 직접 조회했다면 그 선택을 덮어쓰지 않습니다.
		if (hasManualSelection) return;

		const closest = findClosestLocation(coordinates.latitude, coordinates.longitude, locations);
		if (!closest) return;

		province = closest.province;
		city = closest.city;
		await fetchForecast(closest);
	});
</script>

<main>
	<section class="home-hero">
		<p class="eyebrow">Astronomy Weather Guide</p>
		<h1 class="head">전국 천문관측 가능 여부 조회</h1>
		<p class="hero-copy">지역과 시간을 고르면 구름, 강수, 습도 흐름을 한눈에 확인할 수 있습니다.</p>
	</section>

	<div class="current-date-time">
		{format(currentDate, 'yyyy년 M월 d일 HH:mm')}
	</div>

	<LocationPicker
		{provinces}
		{cities}
		bind:province
		bind:city
		{isLoading}
		onlookup={lookupSelectedLocation}
		onrecommend={recommendLocation}
	/>

	{#if recommendationError}
		<p class="home-status error" role="alert">{recommendationError}</p>
	{:else if forecastMessage}
		<p class="home-status error" role="alert">{forecastMessage}</p>
	{:else if recommendedPlace}
		<p class="home-status recommended" role="status">
			추천 관측지: <strong>{recommendedPlace.name}</strong>
			(예보 기준 {recommendedPlace.province} {recommendedPlace.city})
			{#if recommendedPlace.recommendedTimes?.length}
				· 추천 시간 {recommendedPlace.recommendedTimes.map(formatHour).join(', ')}
			{/if}
		</p>
	{:else if !forecast && !isLoading}
		<p class="home-status">
			지역을 고른 뒤 날씨 조회를 누르세요. 위치 권한을 허용하면 가까운 지역 예보를 바로 보여드려요.
		</p>
	{/if}

	{#if forecast}
		<ForecastTimeline {forecast} />
	{/if}

	<RiseSetCard />
</main>

<style>
	:global(main) {
		overflow-x: hidden;
	}

	.home-hero {
		width: min(980px, 100%);
		margin: 0 auto 24px;
		text-align: center;
	}

	.eyebrow {
		margin: 0 0 10px;
		color: #93c5fd;
		font-size: 0.85rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	.hero-copy {
		max-width: 620px;
		margin: 14px auto 0;
		color: #cbd5e1;
		font-size: 1.04rem;
		line-height: 1.65;
	}

	.home-status {
		width: min(920px, 100%);
		margin: -8px auto 20px;
		color: #cbd5e1;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.6;
		text-align: center;
	}

	.home-status.error {
		color: #fca5a5;
	}

	.home-status.recommended strong {
		color: #ffffff;
	}
</style>
