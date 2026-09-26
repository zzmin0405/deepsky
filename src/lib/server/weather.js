// 기상청 단기예보 API 클라이언트입니다. 서비스 키를 쓰므로 서버에서만 import합니다.
import { addDays, format } from 'date-fns';
import { kstParts, kstToday } from '$lib/kst';
import { getDataGoKrServiceKey } from './dataGoKr.js';

const API_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
const REQUEST_TIMEOUT_MS = 5000;

// 기상청 좌표 변환 함수
function dfs_xy_conv(code, v1, v2) {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)
  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);
  const rs = {};

  if (code === 'toXY') {
    rs['lat'] = v1;
    rs['lng'] = v2;
    let ra = Math.tan(Math.PI * 0.25 + v1 * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = v2 * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  }
  return rs;
}

export function getWeatherGrid(lat, lon) {
  const rs = dfs_xy_conv("toXY", lat, lon);
  const nx = rs.x;
  const ny = rs.y;

  return { nx, ny };
}

// 가장 최근 발표분의 base_date/base_time을 한국 시간 기준으로 계산합니다.
// 발표 시각은 02, 05, 08, 11, 14, 17, 20, 23시이고 정시 10분쯤부터 조회됩니다.
export function getBaseDateTime(now = new Date()) {
  const { hour: currentHour, minute: currentMinutes } = kstParts(now);
  let baseDate = kstToday(now);

  const baseTimes = [23, 20, 17, 14, 11, 8, 5, 2];
  let baseTime = '';

  for (const hour of baseTimes) {
    if (currentHour > hour || (currentHour === hour && currentMinutes >= 10)) {
      baseTime = `${String(hour).padStart(2, '0')}00`;
      break;
    }
  }

  // 02:10 이전이면 전날 23시 발표분을 씁니다.
  if (baseTime === '') {
    baseTime = '2300';
    baseDate = addDays(baseDate, -1);
  }

  return {
    base_date: format(baseDate, 'yyyyMMdd'),
    base_time: baseTime
  };
}

export async function getWeather(latitude, longitude) {
  const { base_date, base_time } = getBaseDateTime();
  const { nx, ny } = getWeatherGrid(latitude, longitude);

  const url = `${API_URL}?serviceKey=${getDataGoKrServiceKey()}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`기상청 API 응답 오류: ${response.status}`);
    }

    // 서비스 키 오류 같은 응답은 JSON을 요청해도 XML로 오므로 파싱 실패를 형식 오류로 처리합니다.
    const data = await response.json().catch(() => null);
    const header = data?.response?.header;
    if (header?.resultCode === '00') {
      return data.response.body.items.item;
    }

    throw new Error('API Error: ' + (header?.resultMsg || '알 수 없는 응답 형식'));
  } catch (error) {
    // 요청 URL에 서비스 키가 들어 있으므로 오류 메시지만 남깁니다.
    console.error('Failed to fetch weather data:', error.message);
    throw error;
  }
}
