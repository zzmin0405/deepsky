// 한국천문연구원 출몰시각 API 클라이언트입니다. 서비스 키를 쓰므로 서버에서만 import합니다.
import { getDataGoKrServiceKey } from './dataGoKr.js';

const API_URL = 'https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo';
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_MAX_ENTRIES = 64;

// 날짜·위치가 같으면 출몰시각은 바뀌지 않으므로 성공한 응답은 메모리에 보관합니다.
const riseSetCache = new Map();

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1].trim() : '';
}

function formatTime(value) {
  const digits = String(value || '').trim();
  if (!/^\d{4}/.test(digits)) return '-';
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function remember(key, value) {
  riseSetCache.delete(key);
  riseSetCache.set(key, value);
  while (riseSetCache.size > CACHE_MAX_ENTRIES) {
    riseSetCache.delete(riseSetCache.keys().next().value);
  }
}

/**
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} locdate yyyyMMdd
 */
export async function getMoonRiseSet(latitude, longitude, locdate) {
  const cacheKey = `${locdate}:${latitude}:${longitude}`;
  const cached = riseSetCache.get(cacheKey);
  if (cached) return cached;

  const url = `${API_URL}?serviceKey=${getDataGoKrServiceKey()}&locdate=${locdate}&latitude=${latitude}&longitude=${longitude}&dnYn=Y`;
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`출몰시각 API 응답 오류: ${response.status}`);
  }

  const xml = await response.text();
  const resultCode = readTag(xml, 'resultCode');
  if (resultCode && resultCode !== '00') {
    throw new Error(`출몰시각 API 오류: ${readTag(xml, 'resultMsg') || resultCode}`);
  }
  if (!xml.includes('<item>')) {
    throw new Error('출몰시각 데이터를 찾을 수 없습니다.');
  }

  const result = {
    moonrise: formatTime(readTag(xml, 'moonrise')),
    moonset: formatTime(readTag(xml, 'moonset')),
    sunrise: formatTime(readTag(xml, 'sunrise')),
    sunset: formatTime(readTag(xml, 'sunset'))
  };
  remember(cacheKey, result);
  return result;
}
