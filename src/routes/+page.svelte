<script>
	import { onMount } from 'svelte';
	import { locationStore, province, city } from '../stores/locationStore';
	import { getWeather } from '$lib/api/weather';
	import { writable } from 'svelte/store';
	import { format, addDays } from 'date-fns';
	import { getMoonRiseSet } from '$lib/api/moonRiseSet';
	import { locations } from '$lib/constants/locations.js';

	let moonData = null;
	let selectedMoonDay = 'today';

	async function fetchMoonData(date) {
		try {
			moonData = await getMoonRiseSet(37, 127, date);
		} catch (error) {
			console.error('Error fetching moon data:', error);
			moonData = null;
		}
	}

	async function updateMoonData(day) {
		selectedMoonDay = day;
		const targetDate = new Date(currentDate);

		if (day === 'tomorrow') {
			targetDate.setDate(targetDate.getDate() + 1);
		} else if (day === 'dayAfterTomorrow') {
			targetDate.setDate(targetDate.getDate() + 2);
		}

		try {
			// 서울의 대략적인 좌표 사용
			moonData = await getMoonRiseSet(37.5665, 126.9780, targetDate);
			console.log('Moon data:', moonData); // 디버깅용
		} catch (error) {
			console.error('Error fetching moon data:', error);
			moonData = null;
		}
	}

	onMount(async () => {
		updateMoonData('today');

		if (typeof window !== 'undefined' && navigator.geolocation) {
			isLoading = true;
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const userLat = position.coords.latitude;
					const userLon = position.coords.longitude;
					localStorage.setItem(
						'deepsky:user-location',
						JSON.stringify({ latitude: userLat, longitude: userLon, updatedAt: Date.now() })
					);
					const closestLocation = findClosestLocation(userLat, userLon);

					if (closestLocation) {
						province.set(closestLocation.province);
						city.set(closestLocation.city);
						// Immediately fetch weather for the found location
						await fetchWeatherForLocation(closestLocation);
					} else {
						// If no location is found, initialize with default empty data
						initializeDefaultWeather();
					}
					isLoading = false;
				},
				(error) => {
					console.error('Error getting user location:', error);
					// On error, initialize with default empty data
					initializeDefaultWeather();
					isLoading = false;
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0
				}
			);
		} else {
			console.error('Geolocation is not supported by this browser.');
			// If geolocation is not supported, initialize with default empty data
			initializeDefaultWeather();
		}
	});

	// This new function handles the actual weather data fetching
	async function fetchWeatherForLocation(location) {
		if (!location) {
			console.log('Location information is missing.');
			weatherData = null;
			isObservable = null;
			isLoading = false;
			return;
		}

		isLoading = true;
		try {
			weatherData = await getWeather(location.latitude, location.longitude);
		} catch (error) {
			console.error('Error fetching weather data:', error);
			weatherData = null;
			isObservable = null;
		} finally {
			isLoading = false;
		}
	}

	function initializeDefaultWeather() {
		if (weatherData) return; // Already initialized

		const defaultWeatherData = [];
		const times = [
			'0000',
			'0100',
			'0200',
			'0300',
			'0400',
			'0500',
			'0600',
			'0700',
			'0800',
			'0900',
			'1000',
			'1100',
			'1200',
			'1300',
			'1400',
			'1500',
			'1600',
			'1700',
			'1800',
			'1900',
			'2000',
			'2100',
			'2200',
			'2300'
		];

		const today = format(currentDate, 'yyyyMMdd');
		const tomorrow = format(addDays(currentDate, 1), 'yyyyMMdd');
		const dayAfterTomorrow = format(addDays(currentDate, 2), 'yyyyMMdd');

		const dates = [today, tomorrow, dayAfterTomorrow];
		const categories = ['TMP', 'SKY', 'PTY', 'POP', 'PCP', 'SNO', 'REH'];

		dates.forEach((date) => {
			times.forEach((time) => {
				categories.forEach((category) => {
					defaultWeatherData.push({
						fcstDate: date,
						fcstTime: time,
						category: category,
						fcstValue: '-'
					});
				});
			});
		});

		weatherData = defaultWeatherData;
		selectedTime = '0000';
	}

	function getSquaredDistance(lat1, lon1, lat2, lon2) {
		const dx = lat1 - lat2;
		const dy = lon1 - lon2;
		return dx * dx + dy * dy;
	}

	function findClosestLocation(userLat, userLon) {
		let closest = null;
		let minDistance = Infinity;

		for (const loc of locations) {
			const distance = getSquaredDistance(userLat, userLon, loc.latitude, loc.longitude);
			if (distance < minDistance) {
				minDistance = distance;
				closest = loc;
			}
		}
		return closest;
	}

	let weatherData = null;
	let selectedDay = 'today';
	let selectedTime = null;
	let isObservable = null;
	let isLoading = false;
	let currentDate = new Date();
	let suppressTimelineClick = false;

	const provinces = [...new Set($locationStore.locations.map((loc) => loc.province))];
	$: cities = $locationStore.locations
		.filter((loc) => loc.province === $province)
		.map((loc) => loc.city);

	// This function is now used by the button click
	async function getWeatherAndCheckObservable() {
		if (!$province || !$city) {
			// alert('광역시/도와 시/군/구를 선택해주세요.');
			return;
		}

		const location = $locationStore.locations.find(
			(loc) => loc.province === $province && loc.city === $city
		);

		await fetchWeatherForLocation(location);
	}
   
	function getWeatherInfo(day, time) {
	  selectedDay = day;
	  selectedTime = time;
	  const targetDate = format(addDays(currentDate, day === 'today' ? 0 : day === 'tomorrow' ? 1 : 2), 'yyyyMMdd');
	  const weatherInfo = weatherData.filter(data => data.fcstDate === targetDate && data.fcstTime === time);
   
	  const sky = weatherInfo.find(w => w.category === 'SKY')?.fcstValue;
	  const pty = weatherInfo.find(w => w.category === 'PTY')?.fcstValue;
   
	  isObservable = sky <= 2 && pty <= 0;
	}
	
	function formatValue(value) {
	  return value !== undefined ? value : '-';
	}
   
	function formatSky(value) {
	  switch (value) {
		case '1':
		  return '맑음';
		case '2':
		  return '구름적음';
		case '3':
		  return '구름많음';
		case '4':
		  return '흐림';
		default:
		  return '-';
	  }
	}
   
	function formatPrecipitationType(value) {
	  switch (value) {
		case '0':
		  return '없음';
		case '1':
		  return '비';
		case '2':
		  return '비/눈';
		case '3':
		  return '눈';
		case '4':
		  return '소나기';
		default:
		  return '-';
	  }
	}
   
	function formatPrecipitation(value) {
  if (value === undefined) {
    return '-';
  } else if (parseFloat(value) < 1.0) {
    return '1.0mm 미만';
  } else {
    const targetDate = format(addDays(currentDate, selectedDay === 'today' ? 0 : selectedDay === 'tomorrow' ? 1 : 2), 'yyyyMMdd');
    const precipitationRange = weatherData
      .filter(data => data.fcstDate === targetDate && data.fcstTime === selectedTime && data.category === 'PCP')
      .map(data => parseFloat(data.fcstValue))
      .filter(value => !isNaN(value));

    if (precipitationRange.length > 0) {
      const minPrecipitation = Math.min(...precipitationRange);
    //   const maxPrecipitation = Math.max(...precipitationRange);
      return `${minPrecipitation.toFixed(1)}mm`;
    } else {
      return '강수없음';
    }
  }
}

function formatSnowfall(value) {
  if (value === undefined) {
    return '-';
  } else if (parseFloat(value) < 1.0) {
    return '1.0cm 미만';
  } else {
    const targetDate = format(addDays(currentDate, selectedDay === 'today' ? 0 : selectedDay === 'tomorrow' ? 1 : 2), 'yyyyMMdd');
    const snowfallRange = weatherData
      .filter(data => data.fcstDate === targetDate && data.fcstTime === selectedTime && data.category === 'SNO')
      .map(data => parseFloat(data.fcstValue))
      .filter(value => !isNaN(value));

    if (snowfallRange.length > 0) {
      const minSnowfall = Math.min(...snowfallRange);
    //   const maxSnowfall = Math.max(...snowfallRange);
      return `${minSnowfall.toFixed(1)}cm`;
    } else {
      return '적설없음';
    }
  }
}

let recommendedLocation = null;
let recommendationError = '';

async function recommendLocation() {
  isLoading = true;
  recommendationError = '';

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

    recommendedLocation = data.locations[0];
    province.set(recommendedLocation.province);
    city.set(recommendedLocation.city);

    await fetchWeatherForLocation({
      province: recommendedLocation.province,
      city: recommendedLocation.city,
      latitude: recommendedLocation.latitude,
      longitude: recommendedLocation.longitude
    });
  } catch (error) {
    console.error('Error fetching weather recommendation:', error);
    recommendationError = error.message || '추천 지역을 불러오지 못했습니다.';
  } finally {
    isLoading = false;
  }
}


function getWeatherIcon(sky, pty, time) {
  if (pty === '1') return '🌧️';
  if (pty === '2') return '🌨️';
  if (pty === '3') return '❄️';
  if (pty === '4') return '🌦️';
  
  const hour = parseInt(time);
  const isNight = hour < 6 || hour >= 19;  // 밤 시간대: 19시 ~ 06시
  
  switch (sky) {
    case '1': return isNight ? '🌙' : '☀️';
    case '2': return isNight ? '🌙' : '🌤️';
    case '3': return isNight ? '☁️' : '⛅';
    case '4': return '☁️';
    default: return '';
  }
}

function draggableScroll(node) {
  let isDragging = false;
  let hasDragged = false;
  let startX = 0;
  let startScrollLeft = 0;

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    isDragging = true;
    hasDragged = false;
    startX = event.clientX;
    startScrollLeft = node.scrollLeft;
    node.classList.add('dragging');
    node.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isDragging) return;

    const distance = event.clientX - startX;
    if (Math.abs(distance) > 4) {
      hasDragged = true;
      suppressTimelineClick = true;
      event.preventDefault();
    }

    node.scrollLeft = startScrollLeft - distance;
  }

  function finishDrag(event) {
    if (!isDragging) return;

    isDragging = false;
    node.classList.remove('dragging');
    node.releasePointerCapture?.(event.pointerId);

    if (hasDragged) {
      window.setTimeout(() => {
        suppressTimelineClick = false;
      }, 0);
    }
  }

  node.addEventListener('pointerdown', handlePointerDown);
  node.addEventListener('pointermove', handlePointerMove);
  node.addEventListener('pointerup', finishDrag);
  node.addEventListener('pointercancel', finishDrag);
  node.addEventListener('pointerleave', finishDrag);

  return {
    destroy() {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', finishDrag);
      node.removeEventListener('pointercancel', finishDrag);
      node.removeEventListener('pointerleave', finishDrag);
    }
  };
}

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
   
	<div class="location-select-container">
	  <div class="select-wrapper">
		<select bind:value={$province}>
		  <option value="">광역시/도 선택</option>
		  {#each provinces as province}
			<option>{province}</option>
		  {/each}
		</select>
	  </div>
   
	  <div class="select-wrapper">
		<select bind:value={$city}>
		  <option value="">시/군/구 선택</option>
		  {#each cities as city}
			<option>{city}</option>
		  {/each}
		</select>
	  </div>
   
	  <button class="JHbutton" on:click={getWeatherAndCheckObservable} disabled={isLoading}>
		{#if isLoading}
		  <i class="fas fa-spinner fa-spin"></i> 조회 중...
		{:else}
		  날씨 조회
		{/if}
	  </button>
    <button class="JHbutton" on:click={recommendLocation} disabled={isLoading}>
      {#if isLoading}
        <i class="fas fa-spinner fa-spin"></i> 추천 찾는 중...
      {:else}
        추천 지역
      {/if}
    </button>
	  {#if recommendationError}
		<p class="recommendation-error" role="alert">{recommendationError}</p>
	  {/if}
	</div>
   
	{#if weatherData}
	  <div class="weather-info-container">
		<h2 class="date-info">날짜별 날씨 정보</h2>
		<div class="selected-location">
		  {$province || '지역 미선택'} {$city || ''}
		</div>
		<div class="date-buttons">
		  <button class:selected={selectedDay === 'today'} on:click={() => selectedDay = 'today'}>오늘</button>
		  <button class:selected={selectedDay === 'tomorrow'} on:click={() => selectedDay = 'tomorrow'}>내일</button>
		  <button class:selected={selectedDay === 'dayAfterTomorrow'} on:click={() => selectedDay = 'dayAfterTomorrow'}>모레</button>
		  <span class="scroll-hint">날씨가 보이지 않는다면 옆으로 넘겨주세요 !</span>
		</div>

		<div class="weather-timeline-container">
		  <div class="weather-timeline"
			use:draggableScroll
			role="region"
			aria-label="시간대별 날씨 정보">
			<div class="timeline-hours">
			  {#each ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'] as time}
				{@const targetDate = format(addDays(currentDate, selectedDay === 'today' ? 0 : selectedDay === 'tomorrow' ? 1 : 2), 'yyyyMMdd')}
				{@const weatherInfo = weatherData ? weatherData.filter(data => data.fcstDate === targetDate && data.fcstTime === time + '00') : []}
				{@const sky = weatherInfo.find(w => w.category === 'SKY')?.fcstValue}
				{@const pty = weatherInfo.find(w => w.category === 'PTY')?.fcstValue}
				<button
					type="button"
					class="timeline-column"
					class:selected={selectedTime === time + '00'}
					on:click={() => {
						if (!suppressTimelineClick) getWeatherInfo(selectedDay, time + '00');
					}}
				>
				  <div class="time-header">{time}시</div>
				  <div class="weather-data-item">
					<span class="data-label">기온</span>
					<span class="data-value">{formatValue(weatherInfo.find(w => w.category === 'TMP')?.fcstValue)}°C</span>
				  </div>
				  <div class="weather-data-item">
					<span class="weather-icon">{getWeatherIcon(sky, pty, time)}</span>
					<span class="data-label">하늘상태</span>
					<span class="data-value">{formatSky(sky)}</span>
				  </div>
				  <div class="weather-data-item">
					<span class="data-label">강수형태</span>
					<span class="data-value">{formatPrecipitationType(weatherInfo.find(w => w.category === 'PTY')?.fcstValue)}</span>
				  </div>
				  <div class="weather-data-item">
					<span class="data-label">강수확률</span>
					<span class="data-value">{formatValue(weatherInfo.find(w => w.category === 'POP')?.fcstValue)}%</span>
				  </div>
				  <div class="weather-data-item">
					<span class="data-label">강수량</span>
					<span class="data-value">{formatPrecipitation(weatherInfo.find(w => w.category === 'PCP')?.fcstValue)}</span>
				  </div>
				  <div class="weather-data-item">
					<span class="data-label">적설량</span>
					<span class="data-value">{formatSnowfall(weatherInfo.find(w => w.category === 'SNO')?.fcstValue)}</span>
				  </div>
				  <div class="weather-data-item">
					<span class="data-label">습도</span>
					<span class="data-value">{formatValue(weatherInfo.find(w => w.category === 'REH')?.fcstValue)}%</span>
				  </div>
				</button>
			  {/each}
			</div>
		  </div>
		</div>
	  </div>
	{/if}

	  
	  {#if moonData}
	  <div class="moon-info-container">
		<h2 class="moon-info-title">일출몰/월출몰 정보 (서울)</h2>

		<div class="date-buttons">
			<button class:selected={selectedMoonDay === 'today'} on:click={() => updateMoonData('today')}>오늘</button>
			<button class:selected={selectedMoonDay === 'tomorrow'} on:click={() => updateMoonData('tomorrow')}>내일</button>
			<button class:selected={selectedMoonDay === 'dayAfterTomorrow'} on:click={() => updateMoonData('dayAfterTomorrow')}>모레</button>
		  </div>
		  <div class="moon-info-items">
			<div class="moon-info-item">
			  <div class="moon-info-icon">
				<span class="weather-icon">🌅</span>
			  </div>
			  <div class="moon-info-details">
				<div class="moon-info-label">일출 시각</div>
				<div class="moon-info-value">{moonData.sunrise}</div>
			  </div>
			</div>
			<div class="moon-info-item">
			  <div class="moon-info-icon">
				<span class="weather-icon">🌇</span>
			  </div>
			  <div class="moon-info-details">
				<div class="moon-info-label">일몰 시각</div>
				<div class="moon-info-value">{moonData.sunset}</div>
			  </div>
			</div>
			<div class="moon-info-item">
			  <div class="moon-info-icon">
				<i class="fas fa-moon"></i>
			  </div>
			  <div class="moon-info-details">
				<div class="moon-info-label">월출 시각</div>
				<div class="moon-info-value">{moonData.moonrise}</div>
			  </div>
			</div>
			<div class="moon-info-item">
			  <div class="moon-info-icon">
				<i class="fas fa-moon"></i>
			  </div>
			  <div class="moon-info-details">
				<div class="moon-info-label">월몰 시각</div>
				<div class="moon-info-value">{moonData.moonset}</div>
			  </div>
			</div>
		  </div>
	  </div>
	  {/if}
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
  }

  :global(.weather-timeline.dragging) {
    cursor: grabbing;
  }

  .weather-timeline::-webkit-scrollbar {
    display: none;
  }

  .weather-timeline {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .timeline-hours {
    display: flex;
    gap: 12px;
    width: max-content;
  }

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
    transition: transform 0.3s, box-shadow 0.3s;
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

  .moon-info-item:nth-child(1) .moon-info-icon,
  .moon-info-item:nth-child(2) .moon-info-icon {
    background: rgba(255, 193, 7, 0.3);
    color: #FFD54F;
  }

  .moon-info-item:nth-child(3) .moon-info-icon,
  .moon-info-item:nth-child(4) .moon-info-icon {
    background: rgba(156, 39, 176, 0.3);
    color: #CE93D8;
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

  @media (max-width: 768px) {
    .moon-info-items {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    
    .moon-info-item {
      width: auto;
    }
  }

  @media (max-width: 520px) {
    .timeline-column {
      width: 118px;
      min-width: 118px;
      padding: 12px;
    }

    .moon-info-items {
      grid-template-columns: 1fr;
    }
  }
</style>
