<script>
	import { onMount } from 'svelte';
	import { locationStore, province, city } from '../stores/locationStore';
	import { getWeather } from '$lib/api/weather';
	import { writable } from 'svelte/store';
	import { format, addDays } from 'date-fns';
	import { getMoonRiseSet } from '$lib/api/moonRiseSet';

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

  onMount(() => {
    updateMoonData('today');
  });
	let weatherData = null;
	let selectedDay = 'today';
	let selectedTime = null;
	let isObservable = null;
	let isLoading = false;
	let currentDate = new Date();
   
	const provinces = [...new Set($locationStore.locations.map(loc => loc.province))];
	$: cities = $locationStore.locations
	  .filter(loc => loc.province === $province)
	  .map(loc => loc.city);
   
	async function getWeatherAndCheckObservable() {
	  if (!$province || !$city) {
		alert('광역시/도와 시/군/구를 선택해주세요.');
		return;
	  }
   
	  isLoading = true;
   
	  const location = $locationStore.locations.find(
		loc =>
		  loc.province === $province &&
		  loc.city === $city
	  );
   
	  if (!location) {
		console.log('선택된 지역의 위치 정보를 찾을 수 없습니다.');
		weatherData = null;
		isObservable = null;
		isLoading = false;
		return;
	  }
   
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

let isDragging = false;
let startX;
let scrollLeft;

function handleMouseDown(e) {
  isDragging = true;
  const timeline = e.currentTarget;
  startX = e.pageX - timeline.offsetLeft;
  scrollLeft = timeline.scrollLeft;
  timeline.style.cursor = 'grabbing';
}

function handleMouseMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const timeline = e.currentTarget;
  const x = e.pageX - timeline.offsetLeft;
  const walk = (x - startX) * 2;
  timeline.scrollLeft = scrollLeft - walk;
}

function handleMouseUp(e) {
  isDragging = false;
  e.currentTarget.style.cursor = 'grab';
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

</script>
   
   <main>
	<h1 class="head">DeepSky - 전국 천문관측 가능 여부 조회</h1>
   
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
		  조회
		{/if}
	  </button>
	</div>
   
	{#if weatherData}
	  <div class="weather-info-container">
		<h2 class="date-info">날짜별 날씨 정보</h2>
		<div class="selected-location">
		  {$province} {$city}
		</div>
		<div class="date-buttons">
		  <button class:selected={selectedDay === 'today'} on:click={() => selectedDay = 'today'}>오늘</button>
		  <button class:selected={selectedDay === 'tomorrow'} on:click={() => selectedDay = 'tomorrow'}>내일</button>
		  <button class:selected={selectedDay === 'dayAfterTomorrow'} on:click={() => selectedDay = 'dayAfterTomorrow'}>모레</button>
		</div>

		<div class="weather-timeline-container">
		  <div class="weather-timeline" 
			on:mousedown={handleMouseDown}
			on:mousemove={handleMouseMove}
			on:mouseup={handleMouseUp}
			on:mouseleave={handleMouseUp}
			style="overflow-x: auto; cursor: grab;">
			<div class="timeline-hours">
			  {#each ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'] as time}
				{@const targetDate = format(addDays(currentDate, selectedDay === 'today' ? 0 : selectedDay === 'tomorrow' ? 1 : 2), 'yyyyMMdd')}
				{@const weatherInfo = weatherData.filter(data => data.fcstDate === targetDate && data.fcstTime === time + '00')}
				{@const sky = weatherInfo.find(w => w.category === 'SKY')?.fcstValue}
				{@const pty = weatherInfo.find(w => w.category === 'PTY')?.fcstValue}
				<div class="timeline-column" class:selected={selectedTime === time + '00'} on:click={() => getWeatherInfo(selectedDay, time + '00')}>
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
				</div>
			  {/each}
			</div>
		  </div>
		</div>
	  </div>
	{/if}

	  
	  {#if moonData}
	  <div class="moon-info-container">
		<h2 class="moon-info-title">월출몰 및 천문박명 정보 (서울)</h2>

		<div class="date-buttons">
			<button class:selected={selectedMoonDay === 'today'} on:click={() => updateMoonData('today')}>오늘</button>
			<button class:selected={selectedMoonDay === 'tomorrow'} on:click={() => updateMoonData('tomorrow')}>내일</button>
			<button class:selected={selectedMoonDay === 'dayAfterTomorrow'} on:click={() => updateMoonData('dayAfterTomorrow')}>모레</button>
		  </div>
		  <div class="moon-info-items">
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
  .weather-timeline-container {
    margin-top: 20px;
    width: 100%;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .weather-timeline {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    padding: 15px;
    user-select: none;
    -webkit-user-select: none;
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
    gap: 15px;
  }

  .timeline-column {
    min-width: 100px;
    padding: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fafafa;
    touch-action: pan-y pinch-zoom;
  }

  .timeline-column:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .timeline-column.selected {
    background-color: #e3f2fd;
    border-color: #2196f3;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  }

  .time-header {
    font-weight: bold;
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #eee;
    color: #1976d2;
    font-size: 1.1em;
  }

  .weather-data-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    text-align: center;
  }

  .weather-data-item:last-child {
    border-bottom: none;
  }

  .data-label {
    color: #757575;
    font-size: 0.85em;
    margin-bottom: 4px;
  }

  .data-value {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95em;
  }

  .date-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    justify-content: center;
  }

  .date-buttons button {
    padding: 8px 20px;
    border: none;
    border-radius: 20px;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .date-buttons button.selected {
    background: #2196f3;
    color: white;
    box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
  }

  .selected-location {
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 15px;
  }

  .date-info {
    text-align: center;
    color: #1976d2;
    margin-bottom: 15px;
  }

  .weather-icon {
    font-size: 1.5em;
    margin-bottom: 5px;
  }
</style>
