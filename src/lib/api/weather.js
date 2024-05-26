// src/lib/api/weather.js
import axios from 'axios';
import { format ,subDays} from 'date-fns';

const API_KEY = 'UVW4wG79WCklkQiInTEfdiSZ9QrsV1j3HoYYdoVYzjRPkZkjPYnskKpBVdBHAH5xiyeacby4Zce%2FVv2HqgIUOA%3D%3D';
const API_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

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

function convertToGrid(lat, lon) {
  const rs = dfs_xy_conv("toXY", lat, lon);
  const nx = rs.x;
  const ny = rs.y;

  return { nx, ny };
}

export async function getWeather(latitude, longitude) {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const formattedYesterday = format(yesterday, 'yyyyMMdd');
  
  const { nx, ny } = convertToGrid(latitude, longitude);
  console.log('Converted Coordinates:', nx, ny);
  const url = `${API_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=2000&dataType=JSON&base_date=${formattedYesterday}&base_time=2000&nx=${nx}&ny=${ny}`;
  const response = await axios.get(url);
  if (response.data.response.header.resultCode === '00') {
    return response.data.response.body.items.item;
  } else {
    throw new Error('API Error: ' + response.data.response.header.resultMsg);
  }
}