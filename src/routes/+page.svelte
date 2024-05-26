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

  function updateMoonData(day) {
    selectedMoonDay = day;
    const targetDate = addDays(currentDate, day === 'today' ? 0 : day === 'tomorrow' ? 1 : 2);
    fetchMoonData(targetDate);
  }

  onMount(() => {
    fetchMoonData(currentDate);
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
		<div class="time-observation-container">
		  <div class="time-buttons">
			{#each ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'] as time}
			  <button class:selected={selectedTime === time + '00'} on:click={() => getWeatherInfo(selectedDay, time + '00')}>{time}시</button>
			{/each}
		  </div>
		  <div class="observation-container">
			<h3 class="observation-title">천문관측 가능 여부</h3>
			{#if selectedTime !== null && isObservable !== null}
			  {#if isObservable}
				<p class="observation-status observation-possible">관측에 적합한 날씨입니다. 즐거운 관측 되세요! 😊</p>
			  {:else}
				<p class="observation-status observation-impossible">구름이 많거나 눈/비가 올 것으로 예상되어 관측이 어려울 것 같습니다. 😓</p>
			  {/if}
			{:else}
			  <p class="observation-status">시간대를 선택하면 천문관측 가능 여부를 확인할 수 있습니다.</p>
			{/if}
		  </div>
		</div>
   
		{#if selectedTime !== null}
		{@const targetDate = format(addDays(currentDate, selectedDay === 'today' ? 0 : selectedDay === 'tomorrow' ? 1 : 2), 'yyyyMMdd')}
		{@const weatherInfo = weatherData.filter(data => data.fcstDate === targetDate && data.fcstTime === selectedTime)}
		  <div class="weather-details">
			<div class="weather-item">
			  <div class="weather-label">기온</div>
			  <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'TMP')?.fcstValue)}°C</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">하늘상태</div>
			  <div class="weather-value">{formatSky(weatherInfo.find(w => w.category === 'SKY')?.fcstValue)}</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">강수형태</div>
			  <div class="weather-value">{formatPrecipitationType(weatherInfo.find(w => w.category === 'PTY')?.fcstValue)}</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">강수확률</div>
			  <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'POP')?.fcstValue)}%</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">1시간 강수량</div>
			  <div class="weather-value">{formatPrecipitation(weatherInfo.find(w => w.category === 'PCP')?.fcstValue)}</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">1시간 신적설</div>
			  <div class="weather-value">{formatSnowfall(weatherInfo.find(w => w.category === 'SNO')?.fcstValue)}</div>
			</div>
			<div class="weather-item">
			  <div class="weather-label">습도</div>
			  <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'REH')?.fcstValue)}%</div>
			</div>
		  </div>
		{/if}
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
