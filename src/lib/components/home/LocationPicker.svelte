<script>
	/**
	 * 광역시/도·시/군/구 선택과 조회·추천 버튼입니다. 선택값은 부모와 양방향으로 묶입니다.
	 * @type {{
	 *   provinces: string[],
	 *   cities: string[],
	 *   province: string,
	 *   city: string,
	 *   isLoading?: boolean,
	 *   onlookup: () => void,
	 *   onrecommend: () => void
	 * }}
	 */
	let {
		provinces,
		cities,
		province = $bindable(),
		city = $bindable(),
		isLoading = false,
		onlookup,
		onrecommend
	} = $props();
</script>

<div class="location-select-container">
	<div class="select-wrapper">
		<!-- 광역시/도를 바꾸면 이전 시/군/구 선택은 새 목록에 없으므로 비웁니다. -->
		<select bind:value={province} onchange={() => (city = '')} aria-label="광역시/도">
			<option value="">광역시/도 선택</option>
			{#each provinces as provinceName (provinceName)}
				<option>{provinceName}</option>
			{/each}
		</select>
	</div>

	<div class="select-wrapper">
		<select bind:value={city} aria-label="시/군/구">
			<option value="">시/군/구 선택</option>
			{#each cities as cityName (cityName)}
				<option>{cityName}</option>
			{/each}
		</select>
	</div>

	<button class="JHbutton" onclick={onlookup} disabled={isLoading}>
		{#if isLoading}
			<i class="fas fa-spinner fa-spin"></i> 조회 중...
		{:else}
			날씨 조회
		{/if}
	</button>
	<button class="JHbutton" onclick={onrecommend} disabled={isLoading}>
		{#if isLoading}
			<i class="fas fa-spinner fa-spin"></i> 추천 찾는 중...
		{:else}
			추천 지역
		{/if}
	</button>
</div>
