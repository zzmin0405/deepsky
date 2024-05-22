<script>
  import { onMount } from 'svelte';
  import { locationStore, province, city } from '../stores/locationStore';
  import { getWeather } from '$lib/api/weather';
  import { writable } from 'svelte/store';
  import { format, addDays } from 'date-fns';

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
        <div class="observation-container possible">
          <h3>천문관측 가능 여부</h3>
          {#if selectedTime !== null && isObservable !== null}
            {#if isObservable}
              <p class="observation-possible">관측에 적합한 날씨입니다. 즐거운 관측 되세요! 😊</p>
            {:else}
              <p class="observation-impossible">구름이 많거나 눈/비가 올 것으로 예상되어 관측이 어려울 것 같습니다. 😓</p>
            {/if}
          {:else}
            <p>시간대를 선택하면 천문관측 가능 여부를 확인할 수 있습니다.</p>
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

<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

  :global(body) {
    font-family: 'Noto Sans KR', sans-serif;
  }

  .head {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #ffffff;
    text-shadow: 0 0 10px #31f1ff, 0 0 20px #31f1ff, 0 0 30px #31f1ff, 0 0 40px #31f1ff;
  }

  .current-date-time {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: #ffffff;
  }

  .location-select-container {
    display: flex;
    gap:1em;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper select {
    font-size: 1rem;
    padding: 0.5rem 2rem 0.5rem 0.5rem;
    border: none;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.8);
    color: #333;
    appearance: none;
    width: 100%;
  }

  .select-wrapper::after {
    content: '▼';
    position: absolute;
    top: 50%;
    bottom: -5px;
    right: 0.5rem;
    transform: translateY(-50%);
    font-size: 0.8rem;
    color: #333;
    pointer-events: none;
  }



  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .date-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }


  .date-buttons button {
    font-size: 1rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.8);
    color: #333;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .date-buttons button.selected {
    background-color: #31f1ff;
    color: #000;
  }

  .date-buttons button:hover {
    background-color: rgba(255, 255, 255, 0.6);
  }

  .date-buttons button.selected:hover {
    background-color: #31f1ff;
  }

  .time-buttons {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .time-buttons button {
    font-size: 1rem;
    font-weight: 500;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.8);
    color: #333;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .time-buttons button.selected {
    background-color: #31f1ff;
    color: #000;
  }

  .time-buttons button:hover {
    background-color: rgba(255, 255, 255, 0.6);
  }

  .time-buttons button.selected:hover {
    background-color: #31f1ff;
  }
.possible{
  margin-bottom: 15px;
}
  .observation-possible {
    color: #001ea3;
  }

  .observation-impossible {
    color: #ff0000;
  }

  .weather-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .weather-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    border: 1px solid #ffffff;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .weather-label {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #ffffff;
  }

  .weather-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
  }
</style>