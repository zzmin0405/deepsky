import { json } from '@sveltejs/kit';
import { GEMINI_API_KEY } from '$env/static/private';
import {
    buildBestObservationRecommendation,
    buildWeatherRagContext
} from '$lib/server/weatherContext';
import { checkRateLimit, getClientAddress, rateLimitHeaders } from '$lib/server/rateLimit';

function shouldUseWeatherContext(message) {
    return /(날씨|기온|온도|습도|하늘|구름|비|눈|별|은하수|관측|오늘|내일|모레|글피|밤|저녁|새벽|어때|괜찮|가능|추천)/.test(message);
}

function shouldUseRecommendation(message) {
    const text = String(message || '');
    const hasPlaceIntent = /(추천|어디|좋은\s*곳|명소|전체|전국|장소|관측지|주변|근처|베스트|TOP|탑|어둡|탁\s*트)/i.test(text);
    const hasObservingIntent = /(별|은하수|관측|장소|곳|오늘|내일|모레|글피)/.test(text);
    const weatherOnlyIntent = /(기온|온도|습도|비|눈|강수확률만|날씨만)/.test(text);

    return hasPlaceIntent && hasObservingIntent && !weatherOnlyIntent;
}

function formatDisplaySummary(summary) {
    return String(summary || '').replace(/\b(\d{2})00\b/g, (_, hour) => `${Number(hour)}시`);
}

function subjectParticle(text) {
    const lastChar = text.charCodeAt(text.length - 1);
    if (lastChar < 0xac00 || lastChar > 0xd7a3) return '이';
    return (lastChar - 0xac00) % 28 === 0 ? '가' : '이';
}

function buildWeatherFallbackAnswer(rag) {
    const locationText = `${rag.location.province} ${rag.location.city}`;
    const matchedNotice = rag.locationSource === 'browser'
        ? '브라우저에서 확인된 현재 위치 기준으로 확인했어요.\n\n'
        : rag.locationMatched
            ? ''
            : '질문에서 지역을 정확히 찾지 못해서 서울특별시 종로구 기준으로 확인했어요. 원하는 지역명을 다시 적어주면 그 지역으로 다시 볼 수 있습니다.\n\n';

    if (!rag.rows.length) {
        return `${matchedNotice}${locationText} / ${rag.targetDate} / ${rag.targetTimes.join(', ')} 기준 예보 데이터를 찾지 못했어요. 지역명을 조금 더 구체적으로 쓰거나 잠시 뒤 다시 시도해 주세요.`;
    }

    const rows = rag.rows.map((row) => {
        const observable = row.is_observable ? '관측 유리' : '관측 불리';
        return [
            `${row.forecast_time.slice(0, 2)}시: ${observable}`,
            `하늘 ${row.sky_text ?? '-'}`,
            `강수 ${row.precipitation_text ?? '-'}`,
            `강수확률 ${row.precipitation_probability ?? '-'}%`,
            `습도 ${row.humidity ?? '-'}%`
        ].join(', ');
    });

    return [
        matchedNotice + `${locationText} / ${rag.targetDate} 기준으로 봤어요.`,
        formatDisplaySummary(rag.summary),
        '',
        ...rows
    ].join('\n');
}

function buildWeatherCard(rag) {
    if (!rag?.rows?.length) return null;

    const favorableRows = rag.rows.filter((row) => row.is_observable);

    return {
        location: `${rag.location.province} ${rag.location.city}`,
        targetDate: rag.targetDate,
        targetTimes: rag.targetTimes,
        matched: rag.locationMatched,
        locationSource: rag.locationSource,
        summary: formatDisplaySummary(rag.summary),
        verdict:
            favorableRows.length === rag.rows.length
                ? 'good'
                : favorableRows.length > 0
                    ? 'mixed'
                    : 'bad',
        recommendedTimes: favorableRows.map((row) => row.forecast_time),
        rows: rag.rows.map((row) => ({
            time: row.forecast_time,
            observable: row.is_observable,
            sky: row.sky_text ?? '-',
            precipitation: row.precipitation_text ?? '-',
            precipitationProbability: row.precipitation_probability,
            humidity: row.humidity,
            temperature: row.temperature
        }))
    };
}

function buildRecommendationAnswer(recommendation) {
    if (!recommendation?.recommendations?.length) {
        return `${recommendation?.targetDate ?? '오늘'} 기준으로 후보 지역 예보를 비교하려 했는데, 지금은 예보 데이터를 충분히 가져오지 못했어요. 잠시 뒤 다시 시도해 주세요.`;
    }

    const [best, ...others] = recommendation.recommendations;
    const bestTimes = best.recommendedTimes.length
        ? best.recommendedTimes.map((time) => `${time.slice(0, 2)}시`).join(', ')
        : '뚜렷한 추천 시간 없음';
    const nextPlaces = others.map((item) => item.placeName || item.locationName).join(', ');
    const bestName = best.placeName || best.locationName;
    const scopeText = recommendation.nearby
        ? '현재 위치에서 가까운 관측 후보를 우선 비교했어요.'
        : recommendation.locationUnavailable
            ? '현재 위치 권한을 받지 못해 전체 관측지를 비교했어요. 브라우저 위치 권한을 허용하면 주변 기준으로 다시 추천할 수 있습니다.'
        : '';

    return [
        `${recommendation.targetDate} 기준으로는 ${bestName}${subjectParticle(bestName)} 가장 좋아 보여요.`,
        scopeText,
        `${best.description} 오늘 밤 예보 기준 추천 시간대는 ${bestTimes}입니다.`,
        `판단 기준은 장소의 광해/개방감과 예보의 구름 상태, 강수 형태, 강수확률, 습도입니다.`,
        nextPlaces ? `대안 후보로는 ${nextPlaces}도 같이 볼 만합니다.` : '',
        '아래 카드에서 지역별 근거를 같이 정리해뒀어요.'
    ].filter(Boolean).join('\n\n');
}

function buildRecommendationCard(recommendation) {
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
            rows: item.rows.map((row) => ({
                time: row.forecast_time,
                observable: row.is_observable,
                sky: row.sky_text ?? '-',
                precipitation: row.precipitation_text ?? '-',
                precipitationProbability: row.precipitation_probability,
                humidity: row.humidity,
                temperature: row.temperature
            }))
        }))
    };
}

export async function POST(event) {
    const rateLimit = checkRateLimit('chat', getClientAddress(event), { limit: 20 });
    if (!rateLimit.allowed) {
        return json(
            { error: true, message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
            { status: 429, headers: rateLimitHeaders(rateLimit) }
        );
    }

    let rag = null;
    try {
        let payload;
        try {
            payload = await event.request.json();
        } catch {
            return json({ error: true, message: '올바른 JSON 요청을 보내 주세요.' }, { status: 400 });
        }
        const { message, userLocation } = payload || {};
        if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
            return json({ error: true, message: '질문은 1자 이상 2,000자 이하로 입력해 주세요.' }, { status: 400 });
        }
        let weatherContext = '';
        const recommendationRequested = shouldUseRecommendation(message);

        if (recommendationRequested) {
            const recommendation = await buildBestObservationRecommendation(message, userLocation);

            return json({
                response: buildRecommendationAnswer(recommendation),
                recommendationCard: buildRecommendationCard(recommendation),
                fallback: true,
                message: '여러 후보 지역의 예보 데이터를 비교해 추천했습니다.'
            });
        }

        if (shouldUseWeatherContext(message)) {
            rag = await buildWeatherRagContext(message, userLocation);
            weatherContext = [
                '---DeepSky weather context---',
                `질문에서 추정한 지역: ${rag.location.province} ${rag.location.city}`,
                `지역 기준: ${rag.locationSource === 'browser' ? '브라우저 현재 위치' : rag.locationMatched ? '사용자 질문에서 찾음' : '지역을 찾지 못해 기본값(서울특별시 종로구)을 사용함'}`,
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

        const systemPrompt = [
            'You are DeepSky, a Korean astronomical observing assistant.',
            'Answer in Korean.',
            'When weather context is provided, use it as the primary source for observing recommendations.',
            'Be practical: mention clouds, precipitation, humidity, and night-time observing suitability when relevant.',
            'If the user asks about a specific Korean region, answer using the matched forecast region instead of general climate knowledge.'
        ].join('\n');
        const fullMessage = `${systemPrompt}\n${weatherContext}\nUser's question: ${message}`;
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            signal: AbortSignal.timeout(15000),
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: fullMessage
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2000,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: data.error
            });

            if (rag) {
                return json({
                    response: buildWeatherFallbackAnswer(rag),
                    weatherCard: buildWeatherCard(rag),
                    fallback: true,
                    message: 'Gemini API가 응답하지 않아 날씨 예보 기반 요약으로 답변했습니다.'
                });
            }
            
            throw new Error('LLM 응답을 가져오지 못했습니다.');
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }

        return json({
            response: data.candidates[0].content.parts[0].text,
            weatherCard: buildWeatherCard(rag)
        });
        
    } catch (error) {
        console.error('Chat response error:', error.message);
        return json({
            response: rag
                ? buildWeatherFallbackAnswer(rag)
                : '현재 상세 답변을 생성하지 못했습니다. 관측 전에는 구름과 강수 예보를 확인하고, 주변 조명이 적고 출입이 허용된 장소를 선택해 주세요. 지역과 날짜를 넣어 다시 질문하거나 홈에서 예보를 확인할 수 있습니다.',
            weatherCard: rag ? buildWeatherCard(rag) : null,
            fallback: true
        });
    }
}
