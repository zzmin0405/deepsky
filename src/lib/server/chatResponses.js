// 챗봇 응답 문장·카드 데이터와 LLM 프롬프트를 만드는 함수 모음입니다.
// LLM을 쓰지 못할 때도 예보·장소 데이터만으로 답할 수 있도록 결정론적인 문장을 함께 만듭니다.
import { subjectParticle } from '$lib/korean';

export const CHAT_SYSTEM_PROMPT = [
	'You are DeepSky, a Korean astronomical observing assistant.',
	'Answer in Korean.',
	'When weather context is provided, use it as the primary source for observing recommendations.',
	'Be practical: mention clouds, precipitation, humidity, and night-time observing suitability when relevant.',
	'If the user asks about a specific Korean region, answer using the matched forecast region instead of general climate knowledge.',
	// 챗봇 화면은 마크다운만 렌더링하므로 수식 표기가 그대로 노출되지 않게 합니다.
	'Format with plain Markdown only. Do not use LaTeX or math notation; write numbers and units as plain text.'
].join('\n');

export const GENERIC_FALLBACK_ANSWER =
	'현재 상세 답변을 생성하지 못했습니다. 관측 전에는 구름과 강수 예보를 확인하고, 주변 조명이 적고 출입이 허용된 장소를 선택해 주세요. 지역과 날짜를 넣어 다시 질문하거나 홈에서 예보를 확인할 수 있습니다.';

// 요약 문장 속 "2100" 같은 시각 표기를 "21시"로 바꿉니다.
export function formatDisplaySummary(summary) {
	return String(summary || '').replace(/\b(\d{2})00\b/g, (_, hour) => `${Number(hour)}시`);
}

function formatHour(time) {
	return `${time.slice(0, 2)}시`;
}

function toCardRow(row) {
	return {
		time: row.forecast_time,
		observable: row.is_observable,
		sky: row.sky_text ?? '-',
		precipitation: row.precipitation_text ?? '-',
		precipitationProbability: row.precipitation_probability,
		humidity: row.humidity,
		temperature: row.temperature
	};
}

function verdictFor(rows) {
	const favorableCount = rows.filter((row) => row.is_observable).length;
	if (favorableCount === rows.length) return 'good';
	return favorableCount > 0 ? 'mixed' : 'bad';
}

function locationNotice(rag) {
	if (rag.locationSource === 'browser') return '브라우저에서 확인된 현재 위치 기준으로 확인했어요.\n\n';
	if (rag.locationMatched) return '';
	return '질문에서 지역을 정확히 찾지 못해서 서울특별시 종로구 기준으로 확인했어요. 원하는 지역명을 다시 적어주면 그 지역으로 다시 볼 수 있습니다.\n\n';
}

export function buildWeatherFallbackAnswer(rag) {
	const locationText = `${rag.location.province} ${rag.location.city}`;
	const notice = locationNotice(rag);

	if (!rag.rows.length) {
		return `${notice}${locationText} / ${rag.targetDate} / ${rag.targetTimes.join(', ')} 기준 예보 데이터를 찾지 못했어요. 지역명을 조금 더 구체적으로 쓰거나 잠시 뒤 다시 시도해 주세요.`;
	}

	const rows = rag.rows.map((row) =>
		[
			`${formatHour(row.forecast_time)}: ${row.is_observable ? '관측 유리' : '관측 불리'}`,
			`하늘 ${row.sky_text ?? '-'}`,
			`강수 ${row.precipitation_text ?? '-'}`,
			`강수확률 ${row.precipitation_probability ?? '-'}%`,
			`습도 ${row.humidity ?? '-'}%`
		].join(', ')
	);

	return [
		`${notice}${locationText} / ${rag.targetDate} 기준으로 봤어요.`,
		formatDisplaySummary(rag.summary),
		'',
		...rows
	].join('\n');
}

export function buildWeatherCard(rag) {
	if (!rag?.rows?.length) return null;

	return {
		location: `${rag.location.province} ${rag.location.city}`,
		targetDate: rag.targetDate,
		targetTimes: rag.targetTimes,
		matched: rag.locationMatched,
		locationSource: rag.locationSource,
		summary: formatDisplaySummary(rag.summary),
		verdict: verdictFor(rag.rows),
		recommendedTimes: rag.rows.filter((row) => row.is_observable).map((row) => row.forecast_time),
		rows: rag.rows.map(toCardRow)
	};
}

export function buildRecommendationAnswer(recommendation) {
	if (!recommendation?.recommendations?.length) {
		return `${recommendation?.targetDate ?? '오늘'} 기준으로 후보 지역 예보를 비교하려 했는데, 지금은 예보 데이터를 충분히 가져오지 못했어요. 잠시 뒤 다시 시도해 주세요.`;
	}

	const [best, ...others] = recommendation.recommendations;
	const bestName = best.placeName || best.locationName;
	const bestTimes = best.recommendedTimes.length
		? best.recommendedTimes.map(formatHour).join(', ')
		: '뚜렷한 추천 시간 없음';
	const nextPlaces = others.map((item) => item.placeName || item.locationName).join(', ');
	const scopeText = recommendation.nearby
		? '현재 위치에서 가까운 관측 후보를 우선 비교했어요.'
		: recommendation.locationUnavailable
			? '현재 위치 권한을 받지 못해 전체 관측지를 비교했어요. 브라우저 위치 권한을 허용하면 주변 기준으로 다시 추천할 수 있습니다.'
			: '';

	return [
		`${recommendation.targetDate} 기준으로는 ${bestName}${subjectParticle(bestName)} 가장 좋아 보여요.`,
		scopeText,
		`${best.description} 예보 기준 추천 시간대는 ${bestTimes}입니다.`,
		'판단 기준은 장소의 광해/개방감과 예보의 구름 상태, 강수 형태, 강수확률, 습도입니다.',
		nextPlaces ? `대안 후보로는 ${nextPlaces}도 같이 볼 만합니다.` : '',
		'아래 카드에서 지역별 근거를 같이 정리해뒀어요.'
	]
		.filter(Boolean)
		.join('\n\n');
}

export function buildRecommendationCard(recommendation) {
	if (!recommendation?.recommendations?.length) return null;

	return {
		targetDate: recommendation.targetDate,
		targetTimes: recommendation.targetTimes,
		candidateCount: recommendation.candidateCount,
		nearby: recommendation.nearby,
		locationUnavailable: recommendation.locationUnavailable,
		locationSource: recommendation.locationSource,
		summary: formatDisplaySummary(recommendation.summary),
		locations: recommendation.recommendations.map((item, index) => ({
			rank: index + 1,
			location: item.placeName || item.locationName,
			weatherRegion: item.weatherRegion,
			description: item.description,
			document: item.document,
			tags: item.tags,
			elevationM: item.elevationM,
			lightPollutionScore: item.lightPollutionScore,
			bortleClass: item.bortleClass,
			sqmMagArcsec2: item.sqmMagArcsec2,
			lightPollutionYear: item.lightPollutionYear,
			opennessScore: item.opennessScore,
			accessScore: item.accessScore,
			distanceKm: item.distanceKm,
			score: item.score,
			verdict: item.verdict,
			summary: formatDisplaySummary(item.summary),
			recommendedTimes: item.recommendedTimes,
			rows: item.rows.map(toCardRow)
		}))
	};
}

// LLM 없이 돌려주는 응답입니다. 예보를 찾았으면 예보 요약을, 아니면 일반 안내를 씁니다.
export function buildFallbackPayload(rag, notice) {
	return {
		response: rag ? buildWeatherFallbackAnswer(rag) : GENERIC_FALLBACK_ANSWER,
		weatherCard: rag ? buildWeatherCard(rag) : null,
		fallback: true,
		...(notice ? { message: notice } : {})
	};
}

function buildWeatherPromptContext(rag) {
	const locationBasis =
		rag.locationSource === 'browser'
			? '브라우저 현재 위치'
			: rag.locationMatched
				? '사용자 질문에서 찾음'
				: '지역을 찾지 못해 기본값(서울특별시 종로구)을 사용함';

	return [
		'---DeepSky weather context---',
		`질문에서 추정한 지역: ${rag.location.province} ${rag.location.city}`,
		`지역 기준: ${locationBasis}`,
		`질문에서 추정한 날짜: ${rag.targetDate}`,
		`참고 시간대: ${rag.targetTimes.join(', ')}`,
		`관측 요약: ${rag.summary}`,
		'예보 데이터:',
		rag.context,
		'답변할 때 위 예보 데이터에 근거해서 천문 관측 가능성을 설명하세요.',
		'사용자가 지역을 말했으면 해당 지역명과 날짜/시간대를 먼저 짧게 확인하세요.',
		'지역 매칭 상태가 기본값이면 답변 앞부분에서 지역을 못 찾아 서울 기준이라고 말하고, 원하는 지역명을 다시 물어보세요.',
		'데이터가 부족하면 부족하다고 말하고, 확정적으로 꾸며내지 마세요.',
		'---end context---'
	].join('\n');
}

export function buildUserPrompt(message, rag) {
	const question = `User's question: ${message}`;
	return rag ? `${buildWeatherPromptContext(rag)}\n${question}` : question;
}
