import { format } from 'date-fns';

const API_KEY = 'your_api_key';
const BASE_URL = 'http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService';

export async function getMoonRiseSet(latitude, longitude, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const API_KEY = 'UVW4wG79WCklkQiInTEfdiSZ9QrsV1j3HoYYdoVYzjRPkZkjPYnskKpBVdBHAH5xiyeacby4Zce%2FVv2HqgIUOA%3D%3D';
  
  try {
    const response = await fetch(
      `http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo?serviceKey=${API_KEY}&locdate=${year}${month}${day}&latitude=${latitude}&longitude=${longitude}&dnYn=Y`
    );

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const item = xmlDoc.getElementsByTagName('item')[0];

    if (!item) {
      throw new Error('데이터를 찾을 수 없습니다');
    }

    return {
      moonrise: formatTime(item.getElementsByTagName('moonrise')[0]?.textContent),
      moonset: formatTime(item.getElementsByTagName('moonset')[0]?.textContent),
      sunrise: formatTime(item.getElementsByTagName('sunrise')[0]?.textContent),
      sunset: formatTime(item.getElementsByTagName('sunset')[0]?.textContent)
    };
  } catch (error) {
    console.error('일출몰/월출몰 데이터 조회 실패:', error);
    return {
      moonrise: '-',
      moonset: '-',
      sunrise: '-',
      sunset: '-'
    };
  }
}

function formatTime(timeString) {
  if (!timeString) return '-';
  const hours = timeString.slice(0, 2);
  const minutes = timeString.slice(2, 4);
  return `${hours}:${minutes}`;
}

export async function getCelestialTimes(latitude, longitude, date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const API_KEY = 'UVW4wG79WCklkQiInTEfdiSZ9QrsV1j3HoYYdoVYzjRPkZkjPYnskKpBVdBHAH5xiyeacby4Zce%2FVv2HqgIUOA%3D%3D';
    
    // 일출몰, 월출몰 정보를 모두 가져오는 API 호출
    const response = await fetch(
      `http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getLCRiseSetInfo?serviceKey=${API_KEY}&locdate=${year}${month}${day}&latitude=${latitude}&longitude=${longitude}&dnYn=Y`
    );
  
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
    const item = xmlDoc.getElementsByTagName('item')[0];
  
    if (!item) {
      throw new Error('Celestial data not found in the XML response');
    }
  
    return {
      // 월출몰 시간
      moonrise: formatTime(item.getElementsByTagName('moonrise')[0]?.textContent),
      moonset: formatTime(item.getElementsByTagName('moonset')[0]?.textContent),
      
      // 일출몰 시간
      sunrise: formatTime(item.getElementsByTagName('sunrise')[0]?.textContent),
      sunset: formatTime(item.getElementsByTagName('sunset')[0]?.textContent),
      
      // 시간 형식이 필요한 경우를 위한 원본 데이터
      raw: {
        moonrise: item.getElementsByTagName('moonrise')[0]?.textContent || '',
        moonset: item.getElementsByTagName('moonset')[0]?.textContent || '',
        sunrise: item.getElementsByTagName('sunrise')[0]?.textContent || '',
        sunset: item.getElementsByTagName('sunset')[0]?.textContent || ''
      }
    };
}