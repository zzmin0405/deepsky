<script>
  import { onMount } from 'svelte';
  import { locationStore, province, city } from '../stores/locationStore';
  import { getWeather } from '$lib/api/weather';
  import { writable } from 'svelte/store';

  let weatherData = null;
  let selectedTime = null;
  let isObservable = null;
  let isLoading = false;

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

    weatherData = await getWeather(location.latitude, location.longitude);
    isLoading = false;
  }

  function getWeatherInfo(time) {
    selectedTime = time;
    const weatherInfo = weatherData.filter(data => data.fcstTime === time);

    const sky = weatherInfo.find(w => w.category === 'SKY')?.fcstValue;
    const pty = weatherInfo.find(w => w.category === 'PTY')?.fcstValue;

    isObservable = sky <= 2 && pty === 0;
  }

  function formatValue(value) {
    return value !== undefined ? value : '-';
  }
</script>


<main>
  <h1>DeepSky - 전국 천문관측 가능 여부 조회</h1>

  <div class="location-select-container">
    <div class="select-wrapper">
      <label for="province">광역시/도</label>
      <select id="province" bind:value={$province}>
        <option value="">선택</option>
        {#each provinces as province}
          <option>{province}</option>
        {/each}
      </select>
    </div>

    <div class="select-wrapper">
      <label for="city">시/군/구</label>
      <select id="city" bind:value={$city}>
        <option value="">선택</option>
        {#each cities as city}
          <option>{city}</option>
        {/each}
      </select>
    </div>

    <button on:click={getWeatherAndCheckObservable} disabled={isLoading}>
      {#if isLoading}
        <i class="fas fa-spinner fa-spin"></i> 조회 중...
      {:else}
        조회
      {/if}
    </button>
  </div>

  {#if weatherData}
    <div class="weather-info-container">
      <h2>시간대별 날씨 정보</h2>
      <div class="time-observation-container">
        <ul class="time-list">
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          {#each [...new Set(weatherData.map(data => data.fcstTime))] as time}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li class:selected={selectedTime === time} on:click={() => getWeatherInfo(time)}>
              {time.slice(0, 2)}시
            </li>
          {/each}
        </ul>
        <div class="observation-container">
          <h3>천문관측 가능 여부</h3>
          {#if selectedTime && isObservable !== null}
            {#if isObservable}
              <p class="observation-possible">관측에 적합한 날씨입니다. 즐거운 관측 되세요!</p>
            {:else}
              <p class="observation-impossible">구름이 많거나 눈/비가 올 것으로 예상되어 관측이 어려울 것 같습니다.</p>
            {/if}
          {:else}
            <p>시간대를 선택하면 천문관측 가능 여부를 확인할 수 있습니다.</p>
          {/if}
        </div>
      </div>

      {#if selectedTime}
        <div class="selected-time">
          선택된 시간: {selectedTime.slice(0, 2)}시
        </div>
        {@const weatherInfo = weatherData.filter(data => data.fcstTime === selectedTime)}
        <div class="weather-details">
          <div class="weather-item">
            <div class="weather-label">기온</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'TMP')?.fcstValue)}°C</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">하늘상태</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'SKY')?.fcstValue)}</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">강수형태</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'PTY')?.fcstValue)}</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">강수확률</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'POP')?.fcstValue)}%</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">1시간 강수량</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'PCP')?.fcstValue)}mm</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">1시간 신적설</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'SNO')?.fcstValue)}cm</div>
          </div>
          <div class="weather-item">
            <div class="weather-label">습도</div>
            <div class="weather-value">{formatValue(weatherInfo.find(w => w.category === 'REH')?.fcstValue)}%</div>
          </div>

        </div>
      {/if}
    </div>
  {/if}
</main>